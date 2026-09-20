import * as XLSX from "xlsx";

export type ImportedQuestionRow = {
  section: string;
  question_text: string;
  type: string;
  option_a?: string;
  option_b?: string;
  option_c?: string;
  option_d?: string;
  correct_answer: string;
  points?: number;
};

export type ParsedImportResult = {
  rows: ImportedQuestionRow[];
  errors: string[];
};

const REQUIRED_FIELDS = ["section", "question_text", "type", "correct_answer"];

function coerceRow(raw: Record<string, unknown>, index: number, errors: string[]): ImportedQuestionRow | null {
  const get = (key: string) => {
    const value = raw[key] ?? raw[key.toUpperCase()] ?? raw[key.replace(/_/g, " ")];
    return value === undefined || value === null ? "" : String(value).trim();
  };

  const missing = REQUIRED_FIELDS.filter((field) => !get(field));
  if (missing.length > 0) {
    errors.push(`Строка ${index + 2}: отсутствуют поля ${missing.join(", ")}`);
    return null;
  }

  const type = get("type").toLowerCase();
  if (!["single", "multiple", "text"].includes(type)) {
    errors.push(`Строка ${index + 2}: неизвестный тип вопроса "${type}" (ожидается single/multiple/text)`);
    return null;
  }

  const pointsRaw = get("points");
  const points = pointsRaw ? Number(pointsRaw) : 1;

  return {
    section: get("section"),
    question_text: get("question_text"),
    type,
    option_a: get("option_a") || undefined,
    option_b: get("option_b") || undefined,
    option_c: get("option_c") || undefined,
    option_d: get("option_d") || undefined,
    correct_answer: get("correct_answer"),
    points: Number.isFinite(points) && points > 0 ? points : 1,
  };
}

export function parseQuestionsFile(buffer: Buffer, filename: string): ParsedImportResult {
  const errors: string[] = [];
  const lowerName = filename.toLowerCase();

  let rawRows: Record<string, unknown>[] = [];

  if (lowerName.endsWith(".json")) {
    try {
      const text = buffer.toString("utf-8");
      const parsed = JSON.parse(text);
      rawRows = Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      errors.push("Не удалось разобрать JSON файл: " + (e as Error).message);
      return { rows: [], errors };
    }
  } else {
    try {
      const workbook = XLSX.read(buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      rawRows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
    } catch (e) {
      errors.push("Не удалось разобрать файл: " + (e as Error).message);
      return { rows: [], errors };
    }
  }

  const rows: ImportedQuestionRow[] = [];
  rawRows.forEach((raw, index) => {
    const row = coerceRow(raw, index, errors);
    if (row) rows.push(row);
  });

  return { rows, errors };
}
