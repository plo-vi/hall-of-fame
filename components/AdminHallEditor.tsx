"use client";

import { useMemo, useState } from "react";

type HallRow = {
  id: string;
  name: string;
  date: string;
  text: string;
};

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function toCsv(rows: HallRow[]): string {
  const header = "id,name,date,text";
  const lines = rows.map((row) =>
    [row.id, row.name, row.date, row.text].map((v) => csvEscape(v.trim())).join(","),
  );
  return [header, ...lines].join("\n");
}

export default function AdminHallEditor({ initialRows }: { initialRows: HallRow[] }) {
  const [rows, setRows] = useState<HallRow[]>(initialRows);
  const [filterId, setFilterId] = useState<string>("all");

  const ids = useMemo(() => {
    return ["all", ...Array.from(new Set(rows.map((row) => row.id)))];
  }, [rows]);

  const visibleRows = useMemo(() => {
    if (filterId === "all") return rows;
    return rows.filter((row) => row.id === filterId);
  }, [filterId, rows]);

  const updateRow = (index: number, key: keyof HallRow, value: string) => {
    setRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [key]: value } : row)),
    );
  };

  const addRow = () => {
    const baseId = filterId === "all" ? (ids[1] ?? "elena") : filterId;
    const baseName =
      rows.find((row) => row.id === baseId)?.name ??
      (baseId === "darya" ? "Дарья" : "Елена");

    setRows((prev) => [
      ...prev,
      { id: baseId, name: baseName, date: "01.01.2026", text: "Новая награда" },
    ]);
  };

  const deleteRow = (index: number) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  const downloadCsv = () => {
    const csv = toCsv(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "halls.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "radial-gradient(circle at 50% -15%, #3f1f17 0%, #1e1412 45%, #0d0a09 100%)",
        color: "#f2e4c8",
        fontFamily: "Georgia, serif",
        padding: "24px 16px 40px",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          border: "1px solid rgba(248, 200, 116, 0.35)",
          borderRadius: "18px",
          padding: "20px",
          background: "linear-gradient(180deg, rgba(31,23,20,0.95) 0%, rgba(19,15,13,0.97) 100%)",
        }}
      >
        <h1 style={{ margin: "0 0 8px", color: "#f8d9a3" }}>Админка наград</h1>
        <p style={{ margin: "0 0 18px", color: "#d9b176" }}>
          Отредактируйте таблицу и нажмите «Скачать halls.csv», затем замените файл в `data/halls.csv`.
        </p>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "16px" }}>
          <button
            onClick={addRow}
            style={{
              borderRadius: "10px",
              border: "1px solid rgba(255, 214, 148, 0.45)",
              background: "rgba(18, 11, 3, 0.75)",
              color: "#ffe1a2",
              padding: "10px 14px",
              cursor: "pointer",
            }}
          >
            + Добавить строку
          </button>

          <button
            onClick={downloadCsv}
            style={{
              borderRadius: "10px",
              border: "1px solid rgba(255, 214, 148, 0.45)",
              background: "rgba(18, 11, 3, 0.75)",
              color: "#ffe1a2",
              padding: "10px 14px",
              cursor: "pointer",
            }}
          >
            Скачать halls.csv
          </button>

          <label style={{ display: "flex", alignItems: "center", gap: "8px", color: "#e9c88e" }}>
            Персонаж:
            <select
              value={filterId}
              onChange={(e) => setFilterId(e.target.value)}
              style={{
                borderRadius: "10px",
                border: "1px solid rgba(255, 214, 148, 0.45)",
                background: "rgba(18, 11, 3, 0.75)",
                color: "#ffe1a2",
                padding: "8px 10px",
              }}
            >
              {ids.map((id) => (
                <option key={id} value={id}>
                  {id === "all" ? "Все" : id}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "860px" }}>
            <thead>
              <tr style={{ color: "#f4cc8f" }}>
                <th style={{ textAlign: "left", borderBottom: "1px solid rgba(243,196,111,0.35)", padding: "8px" }}>id</th>
                <th style={{ textAlign: "left", borderBottom: "1px solid rgba(243,196,111,0.35)", padding: "8px" }}>имя</th>
                <th style={{ textAlign: "left", borderBottom: "1px solid rgba(243,196,111,0.35)", padding: "8px" }}>дата</th>
                <th style={{ textAlign: "left", borderBottom: "1px solid rgba(243,196,111,0.35)", padding: "8px" }}>текст</th>
                <th style={{ borderBottom: "1px solid rgba(243,196,111,0.35)", padding: "8px" }}>действие</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => {
                if (filterId !== "all" && row.id !== filterId) return null;

                return (
                  <tr key={`${row.id}-${index}`}>
                    <td style={{ padding: "8px", borderBottom: "1px solid rgba(243,196,111,0.18)" }}>
                      <input
                        value={row.id}
                        onChange={(e) => updateRow(index, "id", e.target.value)}
                        style={{ width: "100%", padding: "8px", background: "#1a120e", color: "#f2e4c8", border: "1px solid rgba(243,196,111,0.3)", borderRadius: "8px" }}
                      />
                    </td>
                    <td style={{ padding: "8px", borderBottom: "1px solid rgba(243,196,111,0.18)" }}>
                      <input
                        value={row.name}
                        onChange={(e) => updateRow(index, "name", e.target.value)}
                        style={{ width: "100%", padding: "8px", background: "#1a120e", color: "#f2e4c8", border: "1px solid rgba(243,196,111,0.3)", borderRadius: "8px" }}
                      />
                    </td>
                    <td style={{ padding: "8px", borderBottom: "1px solid rgba(243,196,111,0.18)" }}>
                      <input
                        value={row.date}
                        onChange={(e) => updateRow(index, "date", e.target.value)}
                        style={{ width: "100%", padding: "8px", background: "#1a120e", color: "#f2e4c8", border: "1px solid rgba(243,196,111,0.3)", borderRadius: "8px" }}
                      />
                    </td>
                    <td style={{ padding: "8px", borderBottom: "1px solid rgba(243,196,111,0.18)" }}>
                      <input
                        value={row.text}
                        onChange={(e) => updateRow(index, "text", e.target.value)}
                        style={{ width: "100%", padding: "8px", background: "#1a120e", color: "#f2e4c8", border: "1px solid rgba(243,196,111,0.3)", borderRadius: "8px" }}
                      />
                    </td>
                    <td style={{ padding: "8px", borderBottom: "1px solid rgba(243,196,111,0.18)", textAlign: "center" }}>
                      <button
                        onClick={() => deleteRow(index)}
                        style={{
                          borderRadius: "8px",
                          border: "1px solid rgba(255, 170, 140, 0.55)",
                          background: "rgba(55, 16, 10, 0.75)",
                          color: "#ffd2b6",
                          padding: "8px 10px",
                          cursor: "pointer",
                        }}
                      >
                        Удалить
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p style={{ marginTop: "14px", color: "#bf9a60", fontSize: "14px" }}>
          Всего строк: {visibleRows.length}
        </p>
      </div>
    </main>
  );
}
