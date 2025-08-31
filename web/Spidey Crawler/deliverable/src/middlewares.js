const db = require("./db");

// Ensures a session user exists
function requireAuth(req, res, next) {
  if (req.session.userId) return next();
  res.redirect("/login");
}

// Only allow localhost (no proxies). Accept ::1 and 127.0.0.1 forms.
function onlyLocalhost(req, res, next) {
  const ip = req.ip || "";
  if (
    ip === "127.0.0.1" ||
    ip === "::1" ||
    ip === "::ffff:127.0.0.1"
  ) return next();
  res.redirect("/");
}

// If user not verified, redirect to verify page
async function requireVerified(req, res, next) {
  const userId = req.session.userId;
  if (!userId) return res.redirect("/login");
  const user = await db.getUserById(userId);
  if (user && user.verified) return next();
  res.redirect("/verify");
}

module.exports = { requireAuth, onlyLocalhost, requireVerified };
