import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { computeVerdict, normalizeTicketNumber, runFormatChecks, ValidationSignal } from "@/lib/validation";

type TicketRow = {
  id: string;
  source: string;
  agency: string | null;
  issue_date: string | null;
  plate: string | null;
  violation_code: string | null;
  fine_amount: number | null;
  raw_json: string;
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { ticketNumber?: string; plate?: string; issueDate?: string };
    if (!body.ticketNumber) {
      return NextResponse.json({ error: "ticketNumber is required" }, { status: 400 });
    }

    const ticketNumber = normalizeTicketNumber(body.ticketNumber);
    const plate = body.plate?.trim().toUpperCase();
    const issueDate = body.issueDate?.trim();

    const format = runFormatChecks(ticketNumber);
    const signals: ValidationSignal[] = [...format.signals];

    const db = getDb();
    const row = db.prepare("SELECT * FROM tickets_normalized WHERE id = ?").get(ticketNumber) as TicketRow | undefined;
    const totalCount = db.prepare("SELECT COUNT(*) as total FROM tickets_normalized").get() as { total: number };

    let confidence = 0;
    if (format.pass) {
      confidence += 40;
    }

    const matches = [];

    if (row) {
      confidence += 50;
      signals.push({ type: "dataset", pass: true, message: `Exact match found in ${row.source}.` });

      let platePass = false;
      if (plate && row.plate) {
        platePass = row.plate.toUpperCase() === plate;
        signals.push({ type: "plate", pass: platePass, message: platePass ? "Plate matches dataset record." : "Plate does not match dataset record." });
      } else if (plate) {
        signals.push({ type: "plate", pass: false, message: "Plate provided, but no plate value exists for this dataset row." });
      }

      let datePass = false;
      if (issueDate && row.issue_date) {
        const normalizedRowDate = row.issue_date.slice(0, 10);
        datePass = normalizedRowDate === issueDate;
        signals.push({ type: "date", pass: datePass, message: datePass ? "Issue date matches dataset record." : "Issue date does not match dataset record." });
      } else if (issueDate) {
        signals.push({ type: "date", pass: false, message: "Issue date provided, but no issue date exists for this dataset row." });
      }

      if (platePass || datePass) {
        confidence += 10;
      }

      matches.push({
        source: row.source,
        ticketNumber: row.id,
        agency: row.agency ?? undefined,
        issueDate: row.issue_date ?? undefined,
        violationCode: row.violation_code ?? undefined,
        fineAmount: row.fine_amount ?? undefined,
        status: "unknown" as const,
        details: JSON.parse(row.raw_json)
      });
    } else {
      signals.push({ type: "dataset", pass: false, message: "No exact ticket number match found in local dataset." });
      if (totalCount.total === 0) {
        signals.push({
          type: "redflag",
          pass: false,
          message: "Local dataset is empty. Run `npm run ingest` before validating tickets."
        });
      }
    }

    confidence = Math.max(0, Math.min(100, confidence));

    return NextResponse.json({
      verdict: computeVerdict(confidence),
      confidence,
      matches,
      signals,
      nextSteps: [
        { label: "NYC Finance - Parking Ticket Services", url: "https://www.nyc.gov/site/finance/vehicles/services-violation.page" },
        { label: "NYS DMV Traffic Tickets", url: "https://dmv.ny.gov/tickets" }
      ]
    });
  } catch {
    return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
  }
}
