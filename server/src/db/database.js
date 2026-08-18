'use strict';
require('dotenv').config();
const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || './data/fieldlink.db';
const dbDir = path.dirname(path.resolve(DB_PATH));
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

// sql.js is synchronous after initialisation.
// We expose a singleton that is initialised once.
let _db = null;

function getDb() {
  if (_db) return _db;
  throw new Error('Database not initialised. Call initDb() first.');
}

async function initDb() {
  if (_db) return _db;

  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    _db = new SQL.Database(fileBuffer);
  } else {
    _db = new SQL.Database();
  }

  // Enable WAL-like behaviour (sql.js is in-memory, so we persist manually)
  _db.run('PRAGMA foreign_keys = ON;');

  // Persist DB to disk on process exit and periodically
  function persist() {
    const data = _db.export();
    fs.writeFileSync(DB_PATH, Buffer.from(data));
  }

  process.on('exit', persist);
  process.on('SIGINT', () => { persist(); process.exit(0); });
  process.on('SIGTERM', () => { persist(); process.exit(0); });

  // Persist every 30 seconds
  setInterval(persist, 30_000).unref();

  return _db;
}

/**
 * Synchronous helper wrappers that mimic better-sqlite3's API
 * so the rest of the code stays synchronous.
 */
function run(sql, params = []) {
  getDb().run(sql, params);
}

function get(sql, params = []) {
  const stmt = getDb().prepare(sql);
  stmt.bind(params);
  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    return row;
  }
  stmt.free();
  return undefined;
}

function all(sql, params = []) {
  const results = [];
  const stmt = getDb().prepare(sql);
  stmt.bind(params);
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

function exec(sql) {
  getDb().run(sql);
}

// Persist immediately (called after write operations)
function persist() {
  if (!_db) return;
  const data = _db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

module.exports = { initDb, getDb, run, get, all, exec, persist };
