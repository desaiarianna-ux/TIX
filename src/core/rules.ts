import { getDb } from "@/lib/db";

export type ViolationRule = {
  code: string;
  description: string;
  required_fields: string[];
  notes: string[];
};

export function getViolationRule(code?: string): ViolationRule | null {
  if (!code) return null;
  const db = getDb();
  const row = db
    .prepare("SELECT code, description, required_fields, notes FROM violation_rules WHERE code = ?")
    .get(code) as { code: string; description: string; required_fields: string; notes: string } | undefined;
  if (!row) return null;
  return {
    code: row.code,
    description: row.description,
    required_fields: JSON.parse(row.required_fields || "[]"),
    notes: JSON.parse(row.notes || "[]")
  };
}

export function streetLooksKnown(street?: string, borough?: string): boolean {
  if (!street) return false;
  const normalized = street.trim().toLowerCase().replace(/\s+/g, " ");
  const db = getDb();
  const row = db
    .prepare("SELECT 1 as ok FROM streets_ref WHERE normalized_name = ? AND (? = '' OR lower(borough) = lower(?)) LIMIT 1")
    .get(normalized, borough?.trim() || "", borough?.trim() || "") as { ok: number } | undefined;
  return !!row;
}
