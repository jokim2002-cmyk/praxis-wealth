import * as SQLite from "expo-sqlite";

export const db = SQLite.openDatabaseSync("praxis.db");
export const SCHEMA_VERSION = 3;

export async function createTables() {
  try {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS profile (
        id TEXT PRIMARY KEY,
        name TEXT,
        monthly_income REAL,
        income_type TEXT,
        cash_on_hand REAL,
        bank_balance REAL,
        emergency_fund REAL,
        onboarded INTEGER DEFAULT 0,
        created_at INTEGER,
        updated_at INTEGER,
        deleted INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        amount REAL NOT NULL,
        description TEXT,
        category TEXT,
        type TEXT,
        date INTEGER,
        notes TEXT,
        ai_categorized INTEGER DEFAULT 0,
        created_at INTEGER,
        updated_at INTEGER,
        deleted INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS budgets (
        id TEXT PRIMARY KEY,
        category_key TEXT,
        amount REAL,
        period TEXT,
        created_at INTEGER,
        updated_at INTEGER,
        deleted INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS savings_goals (
        id TEXT PRIMARY KEY,
        name TEXT,
        target REAL,
        saved REAL,
        kind TEXT,
        target_date INTEGER,
        icon TEXT,
        created_at INTEGER,
        updated_at INTEGER,
        deleted INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS bills (
        id TEXT PRIMARY KEY,
        name TEXT,
        amount REAL,
        kind TEXT,
        day_of_month INTEGER,
        paid_months TEXT,
        active INTEGER DEFAULT 1,
        created_at INTEGER,
        updated_at INTEGER,
        deleted INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS monthly_snapshots (
        id TEXT PRIMARY KEY,
        period TEXT,
        total_income REAL,
        total_expense REAL,
        net_savings REAL,
        by_category TEXT,
        opening_balance REAL,
        closing_balance REAL,
        created_at INTEGER,
        updated_at INTEGER,
        deleted INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS sync_queue (
        id TEXT PRIMARY KEY,
        action TEXT CHECK(action IN ('create', 'update', 'delete')),
        entity TEXT,
        record_id TEXT,
        payload TEXT,
        attempts INTEGER DEFAULT 0,
        status TEXT DEFAULT 'pending',
        created_at INTEGER,
        updated_at INTEGER
      );

      CREATE TABLE IF NOT EXISTS schema_metadata (
        key TEXT PRIMARY KEY,
        value TEXT,
        updated_at INTEGER
      );
    `);

    await db.runAsync(
      `INSERT OR REPLACE INTO schema_metadata (key, value, updated_at) VALUES (?, ?, ?)`,
      "version",
      String(SCHEMA_VERSION),
      Date.now()
    );
    console.log("[DB] Tables created successfully (v3 with sync_queue).");
    return true;
  } catch (e) {
    console.error("[DB] Error creating tables:", e);
    return false;
  }
}

export async function isDatabaseReady() {
  try {
    const result = await db.getFirstAsync<{ value: string }>(
      "SELECT value FROM schema_metadata WHERE key = 'version'"
    );
    return result?.value === String(SCHEMA_VERSION);
  } catch {
    return false;
  }
}
