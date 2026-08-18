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
  });
}

main().catch(err => {
  console.error('[FATAL]', err);
  process.exit(1);
});
