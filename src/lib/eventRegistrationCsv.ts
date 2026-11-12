/**
 * Registrant answers: parsing, display text and a CSV that is safe to open in
 * a spreadsheet. Answers are typed by attendees, so every cell is neutralised
 * against formula injection. No ids ever go into the output.
 */

export interface AnswerField {
  id: string;
  label: string;
  type: string;
}

export type AnswerValue = string | string[] | boolean;

/** Parse `formResponsesJson`; anything that is not a JSON object yields {}. */
export function parseFormResponses(json: string | null | undefined): Record<string, AnswerValue> {
  if (!json) return {};
  try {
    const parsed: unknown = JSON.parse(json);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const out: Record<string, AnswerValue> = {};
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof value === "string" || typeof value === "boolean") out[key] = value;
      else if (Array.isArray(value)) out[key] = value.filter((v): v is string => typeof v === "string");
      else if (typeof value === "number") out[key] = String(value);
    }
    return out;
  } catch {
    return {};
  }
}

/**
 * The registrant's email: the account email when the gateway shares one
 * (it does not), else their answer to the form's default `email` question,
 * else "". Never an id.
 */
export function registrantEmail(
  userEmail: string | null | undefined,
  formResponsesJson: string | null | undefined,
): string {
  const direct = userEmail?.trim();
  if (direct) return direct;
  const answer = parseFormResponses(formResponsesJson).email;
  return typeof answer === "string" ? answer.trim() : "";
}

/** Human text of one answer: choices joined with ", ", checkbox Yes/No, blank → "". */
export function answerText(
  value: AnswerValue | undefined,
  field: Pick<AnswerField, "type">,
  words: { yes: string; no: string },
): string {
  if (value === undefined || value === null) return field.type === "checkbox" ? words.no : "";
  if (typeof value === "boolean") return value ? words.yes : words.no;
  if (Array.isArray(value)) return value.join(", ");
  return value;
}

/** A cell starting with = + - @ tab or CR is read as a formula: prefix an apostrophe. */
export function neutraliseCell(value: string): string {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

/** RFC 4180 quoting of an already-neutralised cell. */
export function quoteCell(value: string): string {
  return /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export function csvCell(value: string | null | undefined): string {
  return quoteCell(neutraliseCell(value ?? ""));
}

/** UTF-8 BOM (Excel) + CRLF rows, headers and cells all neutralised and quoted. */
export function buildCsv(headers: string[], rows: string[][]): string {
  const lines = [headers, ...rows].map((r) => r.map(csvCell).join(","));
  return "﻿" + lines.join("\r\n");
}

/** Download a CSV string in the browser. */
export function downloadCsv(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
