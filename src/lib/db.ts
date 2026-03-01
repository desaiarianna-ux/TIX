import Database from "better-sqlite3";
import path from "node:path";

const dbPath = path.join(process.cwd(), "db.sqlite");

let dbInstance: Database.Database | null = null;

export function getDb() {
  if (!dbInstance) {
    dbInstance = new Database(dbPath, { fileMustExist: false });
    dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS tickets_normalized (
        id TEXT PRIMARY KEY,
        source TEXT NOT NULL,
        agency TEXT,
        issue_date TEXT,
        plate TEXT,
        violation_code TEXT,
        fine_amount REAL,
        raw_json TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_tickets_id ON tickets_normalized(id);

      CREATE TABLE IF NOT EXISTS violation_rules (
        code TEXT PRIMARY KEY,
        description TEXT,
        required_fields TEXT,
        notes TEXT
      );

      CREATE TABLE IF NOT EXISTS streets_ref (
        name TEXT,
        borough TEXT,
        normalized_name TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_street_norm ON streets_ref(normalized_name);

      CREATE TABLE IF NOT EXISTS ingest_meta (
        key TEXT PRIMARY KEY,
        value TEXT
      );
    `);
  }
  return dbInstance;
}

export function getDbPath() {
  return dbPath;
}
