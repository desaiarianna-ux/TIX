export type ValidationSignalType = "format" | "dataset" | "plate" | "date" | "redflag";

export type ValidationSignal = {
  type: ValidationSignalType;
  pass: boolean;
  message: string;
};

export function normalizeTicketNumber(raw: string): string {
  return raw.trim().replace(/\s+/g, "");
}

export function runFormatChecks(ticketNumber: string): { pass: boolean; signals: ValidationSignal[] } {
  const signals: ValidationSignal[] = [];
  const normalized = normalizeTicketNumber(ticketNumber);

  const numericLike = /^\d{8,11}$/.test(normalized);
  signals.push({
    type: "format",
    pass: numericLike,
    message: numericLike ? "Ticket number has 8–11 digits and appears summons-like." : "Ticket number is not 8–11 digits."
  });

  const repeated = /^(\d)\1+$/.test(normalized);
  signals.push({
    type: "redflag",
    pass: !repeated,
    message: repeated ? "All digits are repeated; may be invalid test data." : "Digits are not all repeated."
  });

  const longZeroPrefix = /^0{4,}/.test(normalized);
  signals.push({
    type: "redflag",
    pass: !longZeroPrefix,
    message: longZeroPrefix ? "Long leading-zero sequence detected." : "No suspicious long leading-zero prefix."
  });

  return { pass: numericLike, signals };
}

export function computeVerdict(confidence: number): "valid" | "uncertain" | "not_found" {
  if (confidence >= 80) return "valid";
  if (confidence >= 40) return "uncertain";
  return "not_found";
}
