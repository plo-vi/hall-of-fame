import { readFile } from "node:fs/promises";
import path from "node:path";
import { cache } from "react";

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

const loadHallRows = cache(async (): Promise<HallCsvRow[]> => {
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

  for (let i = 1; i < lines.length; i += 1) {
    const [idRaw, nameRaw, dateRaw, textRaw] = parseCsvLine(lines[i]);
    const id = (idRaw ?? "").toLowerCase();
    const name = nameRaw ?? "";
    const date = dateRaw ?? "";
    const text = textRaw ?? "";

    if (!id || !name || !date || !text) {
      continue;
    }

    rows.push({ id, name, date, text });
  }

  return rows;
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
