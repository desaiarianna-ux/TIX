import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

const DATASET_URL = "https://data.cityofnewyork.us/resource/nc67-uf89.csv?$limit=50000";
const dbPath = path.join(process.cwd(), "db.sqlite");
const sampleTicketsPath = path.join(process.cwd(), "data", "sample.csv");
const sampleCodesPath = path.join(process.cwd(), "data", "sample_violation_codes.csv");
const sampleStreetsPath = path.join(process.cwd(), "data", "sample_streets.csv");

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
      } else insideQuotes = !insideQuotes;
    } else if (char === "," && !insideQuotes) {
      row.push(cur);
      cur = "";
    } else if ((char === "\n" || char === "\r") && !insideQuotes) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(cur);
      cur = "";
      if (row.some((cell) => cell.length > 0)) rows.push(row);
      row = [];
    } else cur += char;
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

async function loadCsvText(url: string, fallbackPath: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Download failed with status ${response.status}`);
    console.log(`Downloaded dataset from ${url}`);
    return await response.text();
  } catch (error) {
    console.warn(`Falling back to local CSV (${fallbackPath}) because download failed: ${String(error)}`);
    return fs.readFileSync(fallbackPath, "utf-8");
  }
}

function normalizeDate(raw: string): string | null {
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? raw : d.toISOString().slice(0, 10);
}

function normalizeStreet(raw?: string) {
  return (raw || "").trim().toLowerCase().replace(/\s+/g, " ");
}

async function main() {
  const ticketsCsv = await loadCsvText(DATASET_URL, sampleTicketsPath);
  const ticketRecords = parseCsv(ticketsCsv);
  const codeRecords = parseCsv(fs.readFileSync(sampleCodesPath, "utf-8"));
  const streetRecords = parseCsv(fs.readFileSync(sampleStreetsPath, "utf-8"));

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

  db.exec("DELETE FROM tickets_normalized");
  db.exec("DELETE FROM violation_rules");
  db.exec("DELETE FROM streets_ref");

  const insertTicket = db.prepare(`
    INSERT OR REPLACE INTO tickets_normalized
    (id, source, agency, issue_date, plate, violation_code, fine_amount, raw_json)
    VALUES (@id, @source, @agency, @issue_date, @plate, @violation_code, @fine_amount, @raw_json)
  `);

  const insertRule = db.prepare(`
    INSERT OR REPLACE INTO violation_rules (code, description, required_fields, notes)
    VALUES (@code, @description, @required_fields, @notes)
  `);

  const insertStreet = db.prepare(`
    INSERT INTO streets_ref (name, borough, normalized_name)
    VALUES (@name, @borough, @normalized_name)
  `);

  const saveMeta = db.prepare(`INSERT OR REPLACE INTO ingest_meta (key, value) VALUES (?, ?)`);

  const tx = db.transaction(() => {
    for (const item of ticketRecords) {
      const id = item.summons_number?.trim();
      if (!id) continue;
      insertTicket.run({
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

    for (const rule of codeRecords) {
      insertRule.run({
        code: rule.code,
        description: rule.description || "",
        required_fields: rule.required_fields || "[]",
        notes: rule.notes || "[]"
      });
    }

    for (const street of streetRecords) {
      if (!street.name) continue;
      insertStreet.run({
        name: street.name,
        borough: street.borough || "",
        normalized_name: normalizeStreet(street.name)
      });
    }

    saveMeta.run("last_ingest_at", new Date().toISOString());
  });

  tx();

  const counts = {
    tickets: (db.prepare("SELECT COUNT(*) as c FROM tickets_normalized").get() as { c: number }).c,
    rules: (db.prepare("SELECT COUNT(*) as c FROM violation_rules").get() as { c: number }).c,
    streets: (db.prepare("SELECT COUNT(*) as c FROM streets_ref").get() as { c: number }).c
  };

  console.log(`Ingestion complete: ${JSON.stringify(counts)} into ${dbPath}`);
  db.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
