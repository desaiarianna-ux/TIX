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
    `);
  }
  return dbInstance;
}
