import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export function readCsv(text) {
  if (typeof text !== "string") throw new TypeError("CSV input must be text");
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }

    if (ch === '"' && field.length === 0) {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n") {
      row.push(field.endsWith("\r") ? field.slice(0, -1) : field);
      field = "";
      if (row.some((value) => value !== "")) rows.push(row);
      row = [];
    } else {
      field += ch;
    }
  }

  if (inQuotes) throw new Error("CANON_CSV_UNTERMINATED_QUOTE");
  if (field.length > 0 || row.length > 0) {
    row.push(field.endsWith("\r") ? field.slice(0, -1) : field);
    if (row.some((value) => value !== "")) rows.push(row);
  }
  if (rows.length === 0) return [];

  const headers = rows[0].map((header, index) => index === 0 ? header.replace(/^\uFEFF/, "") : header);
  return rows.slice(1).map((values, rowIndex) => {
    if (values.length !== headers.length) {
      throw new Error(`CANON_CSV_COLUMN_MISMATCH:${rowIndex + 2}`);
    }
    return Object.fromEntries(headers.map((header, index) => [header, values[index]]));
  });
}

export function readJson(text) {
  return JSON.parse(text);
}

const REQUIRED_EXPORTS = Object.freeze([
  ["roles", "roles.csv"],
  ["skills", "skills.csv"],
  ["integrations", "integrations.csv"],
  ["overlays", "overlays.csv"],
  ["relationships", "relationships.csv"],
]);

export function loadCanonExport(dir) {
  const loaded = {};
  for (const [key, filename] of REQUIRED_EXPORTS) {
    const path = join(dir, filename);
    if (!existsSync(path)) throw new Error(`CANON_SOURCE_MISSING:${filename}`);
    loaded[key] = readCsv(readFileSync(path, "utf8"));
  }
  return loaded;
}
