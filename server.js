const express = require("express");
const { Pool } = require("pg");

const app = express();
const port = process.env.PORT || 3000;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function ensureSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS visits (
      id SERIAL PRIMARY KEY,
      visited_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
}

app.get("/", async (req, res) => {
  try {
    await pool.query("INSERT INTO visits DEFAULT VALUES");
    const { rows } = await pool.query("SELECT COUNT(*)::int AS count FROM visits");
    const count = rows[0].count;
    res.send(`<!doctype html>
<html>
<head>
  <title>Node + Postgres demo</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #0b0f1a; color: #e8ecf7; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
    .card { text-align: center; padding: 40px 56px; border: 1px solid #262f4a; border-radius: 16px; background: #161d33; }
    h1 { margin: 0 0 12px; font-size: 20px; font-weight: 600; }
    .count { font-size: 56px; font-weight: 700; background: linear-gradient(135deg, #7c9cff, #b98cff); -webkit-background-clip: text; background-clip: text; color: transparent; }
    p { color: #9aa4c2; margin: 8px 0 0; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Node + Express + Postgres, via hosting-mcp</h1>
    <div class="count">${count}</div>
    <p>total visits, persisted in Postgres &mdash; refresh to increment</p>
  </div>
</body>
</html>`);
  } catch (err) {
    res.status(500).send("Database error: " + err.message);
  }
});

app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", db: "connected" });
  } catch (err) {
    res.status(500).json({ status: "error", db: "disconnected", error: String(err.message || err) });
  }
});

ensureSchema()
  .then(() => {
    app.listen(port, () => console.log(`listening on ${port}`));
  })
  .catch((err) => {
    console.error("failed to initialize schema", err);
    process.exit(1);
  });
