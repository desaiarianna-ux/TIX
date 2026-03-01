import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { buildDefense } from "@/core/defenseBuilder";
import { scoreValidation } from "@/core/scoring";
import { ContextInput, TicketInput } from "@/core/types";
import { validateTicket } from "@/core/validator";
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

function normalizeLegacyPayload(body: Record<string, unknown>): { ticket: TicketInput; context?: ContextInput; pastedText?: string } {
  if (body.ticket && typeof body.ticket === "object") {
    return {
      ticket: body.ticket as TicketInput,
      context: (body.context as ContextInput | undefined) || undefined,
      pastedText: (body.pastedText as string | undefined) || undefined
    };
  }

  return {
    ticket: {
      ticketNumber: (body.ticketNumber as string | undefined) || undefined,
      plate: (body.plate as string | undefined) || undefined,
      issueDate: (body.issueDate as string | undefined) || undefined
    }
  };
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = (await req.json()) as Record<string, unknown>;
    const { ticket, context, pastedText } = normalizeLegacyPayload(rawBody);
    const db = getDb();

    const matches: Array<Record<string, unknown>> = [];
    if (ticket.ticketNumber) {
      const row = db.prepare("SELECT * FROM tickets_normalized WHERE id = ?").get(ticket.ticketNumber) as TicketRow | undefined;
      if (row) {
        matches.push({
          source: row.source,
          ticketNumber: row.id,
          agency: row.agency ?? undefined,
          issueDate: row.issue_date ?? undefined,
          violationCode: row.violation_code ?? undefined,
          fineAmount: row.fine_amount ?? undefined,
          status: "unknown",
          details: JSON.parse(row.raw_json)
        });
      }
    }

    const validator = validateTicket(ticket, context, pastedText);
    const scoring = scoreValidation(validator);
    const defense = buildDefense(ticket, context, validator);

    const signals = [
      ...validator.errors.map((e) => ({ type: "error", pass: false, message: e.message })),
      ...validator.warnings.map((w) => ({ type: "warning", pass: false, message: w.message })),
      ...validator.notes.map((n) => ({ type: "note", pass: true, message: n.message }))
    ];

    return NextResponse.json({
      verdict: scoring.verdict,
      payLikelihoodScore: scoring.payLikelihoodScore,
      fightLikelihoodScore: scoring.fightLikelihoodScore,
      summary: scoring.summary,
      explanation: scoring.explanation,
      validator,
      bestArguments: defense.bestArguments,
      evidenceChecklist: defense.evidenceChecklist,
      appealDraft: defense.appealDraft,
      nextSteps: [
        { label: "NYC Finance Dispute Portal", url: "https://www.nyc.gov/site/finance/vehicles/dispute-a-ticket.page" },
        { label: "NYC Pay or Dispute Hub", url: "https://www.nyc.gov/site/finance/vehicles/services-violation.page" },
        { label: "NYS DMV Tickets", url: "https://dmv.ny.gov/tickets" }
      ],
      matches,
      signals
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
