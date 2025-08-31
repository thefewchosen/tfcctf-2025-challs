const path = require("path");
const crypto = require("crypto");
const express = require("express");
const session = require("express-session");
const db = require("./db");
const routes = require("./routes");

const app = express();

// View engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Body parsing
app.use(express.urlencoded({ extended: true }));

// Sessions
app.use(
  session({
    secret: crypto.randomBytes(16).toString("hex"),
    resave: false,
    saveUninitialized: false,
    cookie: { sameSite: "lax" }
  })
);

// Serve a tiny style
app.use("/static", express.static(path.join(__dirname, "public")));

// Routes
app.use(routes);

// Boot
(async () => {
  await db.init();
  await db.ensureDefaultAdmin();

  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
  });
})();
