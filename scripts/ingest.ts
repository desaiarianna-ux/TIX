import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

const DATASET_URL = "https://data.cityofnewyork.us/resource/nc67-uf89.csv?$limit=50000";
const dbPath = path.join(process.cwd(), "db.sqlite");
const samplePath = path.join(process.cwd(), "data", "sample.csv");

type ParsedRecord = Record<string, string>;

function parseCsv(text: string): ParsedRecord[] {
  const rows: string[][] = [];
  let cur = "";
  let row: string[] = [];
  let insideQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"') {
      if (insideQuotes && next === '"') {
        cur += '"';
        i += 1;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === "," && !insideQuotes) {
      row.push(cur);
      cur = "";
    } else if ((char === "\n" || char === "\r") && !insideQuotes) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(cur);
      cur = "";
      if (row.some((cell) => cell.length > 0)) rows.push(row);
      row = [];
    } else {
      cur += char;
    }
  }

  if (cur.length > 0 || row.length > 0) {
    row.push(cur);
    rows.push(row);
  }

  const [header, ...dataRows] = rows;
  if (!header) return [];

  return dataRows.map((r) => {
    const obj: ParsedRecord = {};
    header.forEach((h, idx) => {
      obj[h.trim()] = (r[idx] ?? "").trim();
    });
    return obj;
  });
}

async function loadCsvText(): Promise<string> {
  try {
    const response = await fetch(DATASET_URL);
    if (!response.ok) {
      throw new Error(`Download failed with status ${response.status}`);
    }
    console.log(`Downloaded dataset from ${DATASET_URL}`);
    return await response.text();
  } catch (error) {
    console.warn(`Falling back to sample CSV because dataset download failed: ${String(error)}`);
    return fs.readFileSync(samplePath, "utf-8");
  }
}

function normalizeDate(raw: string): string | null {
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? raw : d.toISOString().slice(0, 10);
}

async function main() {
  const csvText = await loadCsvText();
  const records = parseCsv(csvText);

  const db = new Database(dbPath);
  db.exec(`
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

  db.exec("DELETE FROM tickets_normalized");

  const insert = db.prepare(`
    INSERT OR REPLACE INTO tickets_normalized
    (id, source, agency, issue_date, plate, violation_code, fine_amount, raw_json)
    VALUES (@id, @source, @agency, @issue_date, @plate, @violation_code, @fine_amount, @raw_json)
  `);

  const transaction = db.transaction((batch: ParsedRecord[]) => {
    for (const item of batch) {
      const id = item.summons_number?.trim();
      if (!id) continue;

      insert.run({
        id,
        source: "NYC OpenData Parking Violations (nc67-uf89)",
        agency: item.issuing_agency || null,
        issue_date: normalizeDate(item.issue_date),
        plate: item.plate_id || null,
        violation_code: item.violation_code || null,
        fine_amount: item.fine_amount ? Number(item.fine_amount) : null,
        raw_json: JSON.stringify(item)
      });
    }
  });

  transaction(records);
  const count = db.prepare("SELECT COUNT(*) as total FROM tickets_normalized").get() as { total: number };
  console.log(`Ingestion complete. Loaded ${count.total} rows into ${dbPath}`);
  db.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
