'use strict';
require('dotenv').config();
const { initDb } = require('./db/database');

async function main() {
  console.log('[FieldLink] Initialising database...');
  await initDb();

  const { runMigrations } = require('./db/migrations');
  runMigrations();

  const app = require('./app');
  const PORT = process.env.PORT || 3001;

  app.listen(PORT, () => {
    console.log(`[FieldLink API] Running on http://localhost:${PORT}`);
    console.log(`[FieldLink API] Env: ${process.env.NODE_ENV}`);
    console.log(`[FieldLink API] Seed: npm run seed`);

    // --- Self-ping to keep Render free tier awake ---
    const url = process.env.RENDER_EXTERNAL_URL || process.env.CLIENT_URL;
    if (url) {
      console.log(`[FieldLink API] Starting self-ping mechanism on ${url}`);
      // Ping every 14 minutes (840000 milliseconds)
      setInterval(() => {
        fetch(`${url}/api/health`)
          .then(res => console.log(`[Self-Ping] OK: ${res.status}`))
          .catch(err => console.error(`[Self-Ping] ERROR:`, err.message));
      }, 14 * 60 * 1000);
    }
  });
}

main().catch(err => {
  console.error('[FATAL]', err);
  process.exit(1);
});
