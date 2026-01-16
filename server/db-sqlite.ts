import { drizzle, BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "@shared/schema-sqlite";
import path from "path";
import os from "os";

let _sqliteDb: Database.Database | null = null;
let _db: BetterSQLite3Database<typeof schema> | null = null;
let _customDbPath: string | null = null;

export function setDbPath(dbPath: string): void {
  _customDbPath = dbPath;
}

function getDbPath(): string {
  if (_customDbPath) return _customDbPath;
  
  const appName = "OposTest Pro";
  let userDataPath: string;
  
  if (process.platform === "win32") {
    userDataPath = path.join(process.env.APPDATA || os.homedir(), appName);
  } else if (process.platform === "darwin") {
    userDataPath = path.join(os.homedir(), "Library", "Application Support", appName);
  } else {
    userDataPath = path.join(os.homedir(), ".config", appName);
  }
  
  const fs = require("fs");
  if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath, { recursive: true });
  }
  
  return path.join(userDataPath, "opostest.db");
}

export function initializeSqliteDatabase(): BetterSQLite3Database<typeof schema> {
  if (_db) return _db;
  
  const dbPath = getDbPath();
  console.log(`[SQLite] Initializing database at: ${dbPath}`);
  
  _sqliteDb = new Database(dbPath);
  _db = drizzle(_sqliteDb, { schema });
  
  _sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
    );
    
    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      test_id TEXT NOT NULL,
      question_text TEXT NOT NULL,
      answers TEXT NOT NULL,
      correct_answer TEXT NOT NULL,
      category TEXT,
      user_id INTEGER
    );
    
    CREATE TABLE IF NOT EXISTS results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      test_id TEXT NOT NULL,
      score INTEGER NOT NULL,
      correct_count INTEGER NOT NULL,
      total_questions INTEGER NOT NULL,
      completed_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
      user_id INTEGER
    );
    
    CREATE TABLE IF NOT EXISTS test_attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      test_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'in_progress',
      current_index INTEGER NOT NULL DEFAULT 0,
      answers TEXT NOT NULL,
      question_order TEXT NOT NULL,
      total_questions INTEGER NOT NULL,
      correct_count INTEGER DEFAULT 0,
      score INTEGER DEFAULT 0,
      started_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
      completed_at INTEGER,
      user_id INTEGER
    );
    
    CREATE TABLE IF NOT EXISTS session (
      sid TEXT PRIMARY KEY,
      sess TEXT NOT NULL,
      expire INTEGER NOT NULL
    );
  `);
  
  console.log("[SQLite] Database initialized successfully");
  return _db;
}

export function getSqliteDb(): BetterSQLite3Database<typeof schema> {
  if (!_db) {
    return initializeSqliteDatabase();
  }
  return _db;
}

export function closeSqliteDatabase(): void {
  if (_sqliteDb) {
    _sqliteDb.close();
    _sqliteDb = null;
    _db = null;
  }
}
