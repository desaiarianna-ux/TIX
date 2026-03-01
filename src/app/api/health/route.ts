import fs from "node:fs";
import { NextResponse } from "next/server";
import { getDb, getDbPath } from "@/lib/db";

export async function GET() {
  const dbPath = getDbPath();
  const dbExists = fs.existsSync(dbPath);
  const db = getDb();

  const tickets = (db.prepare("SELECT COUNT(*) as c FROM tickets_normalized").get() as { c: number }).c;
  const rules = (db.prepare("SELECT COUNT(*) as c FROM violation_rules").get() as { c: number }).c;
  const streets = (db.prepare("SELECT COUNT(*) as c FROM streets_ref").get() as { c: number }).c;
  const lastIngestRow = db.prepare("SELECT value FROM ingest_meta WHERE key = 'last_ingest_at'").get() as { value?: string } | undefined;

  return NextResponse.json({
    ok: dbExists,
    dbExists,
    tables: {
      tickets_normalized: tickets,
      violation_rules: rules,
      streets_ref: streets
    },
    lastIngestAt: lastIngestRow?.value || null
  });
}
