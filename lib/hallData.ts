import { readFile } from "node:fs/promises";
import path from "node:path";
import { cache } from "react";
import { getSupabasePublicClient } from "./supabase";

export type Achievement = {
  date: string;
  text: string;
};

export type HallPerson = {
  name: string;
  achievements: Achievement[];
};

export type HallCsvRow = {
  id: string;
  name: string;
  date: string;
  text: string;
};

type HallDbRow = {
  person_id?: string | null;
  person_name?: string | null;
  id?: string | null;
  name?: string | null;
  date?: string | null;
  text?: string | null;
};

function toUiDate(value: string): string {
  const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!iso) return value;
  const [, yyyy, mm, dd] = iso;
  return `${dd}.${mm}.${yyyy}`;
}

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];

    if (ch === '"') {
      const next = line[i + 1];
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (ch === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
      continue;
    }

    current += ch;
  }

  values.push(current.trim());
  return values;
}

const loadHallRowsFromCsv = cache(async (): Promise<HallCsvRow[]> => {
  const csvPath = path.join(process.cwd(), "data", "halls.csv");
  const content = await readFile(csvPath, "utf-8");
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length <= 1) {
    return [];
  }

  const rows: HallCsvRow[] = [];
  const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
  const idIndex = headers.findIndex((h) => h === "id" || h === "person_id");
  const nameIndex = headers.findIndex((h) => h === "name" || h === "person_name");
  const dateIndex = headers.findIndex((h) => h === "date");
  const textIndex = headers.findIndex((h) => h === "text");

  for (let i = 1; i < lines.length; i += 1) {
    const cells = parseCsvLine(lines[i]);
    const idRaw = cells[idIndex] ?? "";
    const nameRaw = cells[nameIndex] ?? "";
    const dateRaw = cells[dateIndex] ?? "";
    const textRaw = cells[textIndex] ?? "";
    const id = (idRaw ?? "").toLowerCase();
    const name = nameRaw ?? "";
    const date = toUiDate(dateRaw ?? "");
    const text = textRaw ?? "";

    if (!id || !name || !date || !text) {
      continue;
    }

    rows.push({ id, name, date, text });
  }

  return rows;
});

async function loadHallRowsFromSupabase(): Promise<HallCsvRow[] | null> {
  const hasSupabase =
    Boolean(process.env.SUPABASE_URL) && Boolean(process.env.SUPABASE_ANON_KEY);
  if (!hasSupabase) {
    return null;
  }

  const supabase = getSupabasePublicClient();
  const { data, error } = await supabase
    .from("hall_achievements")
    .select("*")
    .order("date", { ascending: false });

  if (error) {
    return null;
  }

  const rows = (data as HallDbRow[] | null) ?? [];
  if (rows.length === 0) {
    return null;
  }

  const normalized = rows
    .map<HallCsvRow | null>((row) => {
      const id = String(row.person_id ?? row.id ?? "").trim().toLowerCase();
      const name = String(row.person_name ?? row.name ?? "").trim();
      const date = toUiDate(String(row.date ?? "").trim());
      const text = String(row.text ?? "").trim();
      if (!id || !name || !date || !text) return null;
      return { id, name, date, text };
    })
    .filter((row): row is HallCsvRow => Boolean(row));

  return normalized.length > 0 ? normalized : null;
}

const loadHallRows = cache(async (): Promise<HallCsvRow[]> => {
  const dbRows = await loadHallRowsFromSupabase();
  if (dbRows) return dbRows;
  return loadHallRowsFromCsv();
});

const loadHallData = cache(async (): Promise<Record<string, HallPerson>> => {
  const rows = await loadHallRows();
  const data: Record<string, HallPerson> = {};

  for (const row of rows) {
    if (!data[row.id]) {
      data[row.id] = { name: row.name, achievements: [] };
    }
    data[row.id].achievements.push({ date: row.date, text: row.text });
  }

  return data;
});

export async function getHallIds(): Promise<string[]> {
  const data = await loadHallData();
  return Object.keys(data);
}

export async function getHallById(id: string): Promise<HallPerson | undefined> {
  const data = await loadHallData();
  return data[id];
}

export async function getHallRows(): Promise<HallCsvRow[]> {
  return loadHallRows();
}
