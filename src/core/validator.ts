import { getViolationRule, streetLooksKnown } from "./rules";
import { scanScamSignals } from "./redFlags";
import { ContextInput, TicketInput, ValidatorOutput } from "./types";

function validDate(date?: string): boolean {
  if (!date) return false;
  const d = new Date(date);
  return !Number.isNaN(d.getTime());
}

function validTime(time?: string): boolean {
  return !!time && /^([01]\d|2[0-3]):([0-5]\d)$/.test(time);
}

function plateByState(plate?: string, state?: string): boolean {
  if (!plate) return false;
  const normalized = plate.replace(/\s+/g, "").toUpperCase();
  if ((state || "NY").toUpperCase() === "NY") return /^[A-Z0-9]{2,8}$/.test(normalized);
  return /^[A-Z0-9-]{2,10}$/.test(normalized);
}

export function validateTicket(ticket: TicketInput, context?: ContextInput, pastedText?: string): ValidatorOutput {
  const errors: ValidatorOutput["errors"] = [];
  const warnings: ValidatorOutput["warnings"] = [];
  const notes: ValidatorOutput["notes"] = [];

  if (!ticket.issueDate || !validDate(ticket.issueDate)) {
    errors.push({ code: "MISSING_OR_BAD_DATE", message: "Issue date is required and must be valid.", field: "issueDate" });
  }
  if (!ticket.issueTime || !validTime(ticket.issueTime)) {
    errors.push({ code: "MISSING_OR_BAD_TIME", message: "Issue time is required in HH:MM format.", field: "issueTime" });
  }
  if (!ticket.location?.street) {
    errors.push({ code: "MISSING_STREET", message: "Street/location is required.", field: "location.street" });
  }
  if (!ticket.location?.borough && !ticket.location?.city) {
    errors.push({ code: "MISSING_AREA", message: "Borough or city is required.", field: "location.borough" });
  }
  if (!ticket.violationCode) {
    errors.push({ code: "MISSING_VIOLATION", message: "Violation code is required.", field: "violationCode" });
  }

  if (ticket.plate && !plateByState(ticket.plate, ticket.state)) {
    warnings.push({ code: "PLATE_FORMAT", message: "Plate format looks unusual for selected state.", field: "plate" });
  }

  if (ticket.issueDate && validDate(ticket.issueDate) && new Date(ticket.issueDate).getTime() > Date.now()) {
    errors.push({ code: "FUTURE_DATE", message: "Issue date cannot be in the future.", field: "issueDate" });
  }

  if (ticket.location?.street && !streetLooksKnown(ticket.location.street, ticket.location?.borough || ticket.location?.city)) {
    warnings.push({ code: "STREET_UNRESOLVED", message: "Street could not be matched to reference list.", field: "location.street" });
  }

  const rule = getViolationRule(ticket.violationCode);
  if (ticket.violationCode && !rule) {
    warnings.push({ code: "UNKNOWN_VIOLATION", message: "Violation code not found in local rule table.", field: "violationCode" });
  }
  if (rule) {
    for (const field of rule.required_fields) {
      const value = field.split(".").reduce<unknown>((obj, part) => (obj as Record<string, unknown> | undefined)?.[part], ticket as unknown as Record<string, unknown>);
      if (value === undefined || value === null || value === "") {
        const severe = field === "meterZone";
        (severe ? errors : warnings).push({
          code: "RULE_REQUIRED_FIELD",
          message: `${rule.code} (${rule.description}) requires ${field}.`,
          field
        });
      }
    }
    rule.notes.forEach((n) => notes.push({ code: "RULE_NOTE", message: n }));
  }

  if (context?.signageVisible === "no") {
    notes.push({ code: "SIGNAGE_DEFENSE", message: "Missing/blocked signage can support an appeal." });
  }
  if (context?.hasPhotos) {
    notes.push({ code: "PHOTO_EVIDENCE", message: "Photo evidence usually strengthens disputes." });
  }
  if (context?.inCar) {
    notes.push({ code: "IN_CAR_CONTEXT", message: "Being in the vehicle may help in standing/double-parking disputes." });
  }

  warnings.push(...scanScamSignals(pastedText));

  return { errors, warnings, notes };
}
