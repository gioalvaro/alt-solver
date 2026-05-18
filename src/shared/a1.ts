/**
 * A1 notation utilities. Pure functions, no Spreadsheet API dependency.
 * Validates and parses references like "Sheet1!$A$1:$B$2" or "B12".
 */

export interface ParsedA1 {
  sheet: string | null;
  start: string;       // canonical, without $: e.g. "B12"
  end: string | null;  // canonical, without $: e.g. "B17" or null for single cell
}

// Single cell: optional $, 1-3 letters, optional $, row index >= 1 (1-7 digits, no leading zero).
// Sheets/Excel rows are 1-indexed; "A0" is invalid.
const CELL = /\$?[A-Z]{1,3}\$?[1-9][0-9]{0,6}/;

// Unquoted sheet name: letters/digits/underscore, no spaces, no special chars
const SHEET_UNQUOTED = /[A-Za-z_][A-Za-z0-9_]*/;
// Quoted sheet name: anything except ' (we don't support escaped quotes for now)
const SHEET_QUOTED = /'[^']+'/;

const SHEET = new RegExp(`(?:${SHEET_QUOTED.source}|${SHEET_UNQUOTED.source})`);

const FULL = new RegExp(
  `^(?:(${SHEET.source})!)?(${CELL.source})(?::(${CELL.source}))?$`,
);

export function isValidA1(ref: string): boolean {
  return FULL.test(ref);
}

export function parseA1(ref: string): ParsedA1 | null {
  const m = FULL.exec(ref);
  if (!m) return null;
  const rawSheet = m[1] ?? null;
  const sheet = rawSheet
    ? rawSheet.startsWith("'")
      ? rawSheet.slice(1, -1)
      : rawSheet
    : null;
  const start = (m[2] ?? '').replace(/\$/g, '');
  const end = m[3] ? m[3].replace(/\$/g, '') : null;
  return { sheet, start, end };
}

export function isCellA1(ref: string): boolean {
  const p = parseA1(ref);
  return p !== null && p.end === null;
}

export function isRangeA1(ref: string): boolean {
  const p = parseA1(ref);
  return p !== null && p.end !== null;
}

export function qualifyWithSheet(ref: string, sheetName: string): string {
  const p = parseA1(ref);
  if (!p) throw new Error(`Invalid A1: ${ref}`);
  if (p.sheet) return ref;
  const needsQuotes = !/^[A-Za-z_][A-Za-z0-9_]*$/.test(sheetName);
  const prefix = needsQuotes ? `'${sheetName}'` : sheetName;
  return `${prefix}!${p.start}${p.end ? `:${p.end}` : ''}`;
}
