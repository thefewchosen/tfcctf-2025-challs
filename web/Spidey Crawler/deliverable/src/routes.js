const express = require("express");
const { URL } = require("url");
const { JSDOM } = require("jsdom");
const createDOMPurify = require("dompurify");
const db = require("./db");
const bot = require("./bot");
const { requireAuth, onlyLocalhost, requireVerified, attachUser } = require("./middlewares");

const router = express.Router();

// Home: submit a URL to crawl
router.get("/", (req, res) => res.render("index", { created: false, error: null }));
router.post("/crawl", async (req, res) => {
  const url = (req.body.url || "").trim();
  try {
    new URL(url); // rudimentary validation
  } catch {
    return res.render("index", { created: false, error: "Invalid URL" });
  }
  const uuid = await bot.enqueueCrawl(db, url);

  // TODO: render the UUID back to user
  res.render("index", { created: true, error: null });
});

// ---- Auth / verification (localhost only) ----
router.get("/login", onlyLocalhost, (req, res) => {
  res.render("login", { error: null });
});
router.post("/login", onlyLocalhost, async (req, res) => {
  const { username, password } = req.body;
  const user = await db.getUserByUsername((username || "").trim());
  if (!user || user.password !== password) {
    return res.render("login", { error: "Invalid credentials" });
  }
  req.session.userId = user.id;
  if (user.verified) {
    return res.redirect('/dashboard');
  }
  res.redirect("/verify");
});

router.post("/logout", onlyLocalhost, requireAuth, (req, res) => {
  req.session.destroy(() => res.redirect("/login"));
});


router.get("/verify", onlyLocalhost, requireAuth, (req, res) => {
  res.render("verify", { error: null, ok: null });
});

router.put("/api/verify", onlyLocalhost, requireAuth, async (req, res) => {
  const token = (req.body?.token || "").trim()
  if (!token) return res.json({ error: 'Missing token', ok: false });

  const user = await db.getUserById(req.session.userId);
  if (user && token === user.token) {
    await db.setVerified(user.id);
    return res.json({ error: null, ok: true });
  }
  return res.json({ ok: false, error: "Invalid token" });
});

// ---- Dashboard & page view (localhost + verified) ----
router.get("/dashboard", onlyLocalhost, requireAuth, requireVerified, async (req, res) => {
  const uuid = (req.query.uuid || "").trim();
  let crawl = null;
  if (uuid) crawl = await db.getCrawl(uuid);
  res.render("dashboard", { uuid, crawl });
});

const window = new JSDOM("").window;
const DOMPurify = createDOMPurify(window);

// Serve the crawled HTML inside an iframe (localhost + verified)
router.get("/page/:uuid", onlyLocalhost, requireAuth, requireVerified, async (req, res) => {
  const row = await db.getCrawl(req.params.uuid);
  if (!row) return res.status(404).send("Not found");
  if (row.status !== "done") return res.status(202).send(`<p>Status: not done</p>`);
  
  const raw = (row.html || "<p>(empty)</p>");
  const clean = DOMPurify.sanitize(raw);

  res.setHeader("Content-Type", row.content_type);
  res.end(clean);
});

module.exports = router;
