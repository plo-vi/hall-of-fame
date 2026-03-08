"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { ADMIN_ROWS_KEY } from "../lib/adminStorage";

type HallRow = {
  id: string;
  name: string;
  date: string;
  text: string;
};

type HallPageClientProps = {
  currentId: string;
  initialRows: HallRow[];
};

const ADMIN_FLAG_KEY = "hof_admin_auth";
const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? "theater-admin";

function uniqueIds(rows: HallRow[]): string[] {
  return Array.from(new Set(rows.map((row) => row.id)));
}

function personName(rows: HallRow[], id: string): string {
  return rows.find((row) => row.id === id)?.name ?? id;
}

export default function HallPageClient({ currentId, initialRows }: HallPageClientProps) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [rows, setRows] = useState<HallRow[]>(initialRows);
  const [editorId, setEditorId] = useState(currentId);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === "a") {
        event.preventDefault();
        setShowLogin(true);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const ids = useMemo(() => uniqueIds(rows), [rows]);
  const currentName = useMemo(() => personName(rows, currentId), [rows, currentId]);
  const currentAchievements = useMemo(
    () => rows.filter((row) => row.id === currentId).map((row) => ({ date: row.date, text: row.text })),
    [rows, currentId],
  );
  const editorRows = useMemo(
    () => rows.map((row, index) => ({ row, index })).filter((entry) => entry.row.id === editorId),
    [rows, editorId],
  );

  const login = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (password !== ADMIN_PASSWORD) {
      setError("Неверный пароль");
      return;
    }
    sessionStorage.setItem(ADMIN_FLAG_KEY, "1");
    setIsAdmin(true);
    setShowLogin(false);
    setPassword("");
    setError("");
  };

  const saveLocal = () => {
    localStorage.setItem(ADMIN_ROWS_KEY, JSON.stringify(rows));
  };

  const resetLocal = () => {
    localStorage.removeItem(ADMIN_ROWS_KEY);
    setRows(initialRows);
    setEditorId(currentId);
  };

  const updateRow = (index: number, key: keyof HallRow, value: string) => {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, [key]: value } : row)));
  };

  const addRow = () => {
    const baseName = personName(rows, editorId);
    setRows((prev) => [...prev, { id: editorId, name: baseName, date: "01.01.2026", text: "Новая награда" }]);
  };

  const deleteRow = (index: number) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        overflowX: "hidden",
        background:
          "radial-gradient(circle at 50% -15%, #3f1f17 0%, #1e1412 45%, #0d0a09 100%)",
        color: "#f2e4c8",
        fontFamily: "Georgia, serif",
        padding: "30px 20px 56px",
      }}
    >
      <button
        onClick={() => setShowLogin(true)}
        style={{
          position: "fixed",
          bottom: "8px",
          right: "8px",
          width: "18px",
          height: "18px",
          opacity: 0.02,
          border: "none",
          background: "#fff",
          borderRadius: "999px",
          zIndex: 30,
          cursor: "default",
        }}
        aria-label="admin login"
      />

      {showLogin && !isAdmin && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            display: "grid",
            placeItems: "center",
            zIndex: 40,
          }}
        >
          <form
            onSubmit={login}
            style={{
              width: "min(360px, 92vw)",
              background: "#18100d",
              border: "1px solid rgba(255, 214, 148, 0.45)",
              borderRadius: "14px",
              padding: "16px",
              display: "grid",
              gap: "10px",
            }}
          >
            <strong style={{ color: "#f8d9a3" }}>Вход администратора</strong>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Пароль"
              style={{
                background: "#0f0a08",
                color: "#f2e4c8",
                border: "1px solid rgba(255, 214, 148, 0.45)",
                borderRadius: "8px",
                padding: "9px 10px",
              }}
            />
            {error && <span style={{ color: "#ff9c8f", fontSize: "13px" }}>{error}</span>}
            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setShowLogin(false)}
                style={{
                  border: "1px solid rgba(255, 214, 148, 0.45)",
                  background: "transparent",
                  color: "#f2e4c8",
                  borderRadius: "8px",
                  padding: "7px 10px",
                }}
              >
                Отмена
              </button>
              <button
                type="submit"
                style={{
                  border: "1px solid rgba(255, 214, 148, 0.45)",
                  background: "#2a1a13",
                  color: "#ffe1a2",
                  borderRadius: "8px",
                  padding: "7px 10px",
                }}
              >
                Войти
              </button>
            </div>
          </form>
        </div>
      )}

      <div
        style={{
          maxWidth: "920px",
          margin: "0 auto",
          border: "1px solid rgba(248, 200, 116, 0.35)",
          borderRadius: "18px",
          padding: "24px 24px 28px",
          background: "linear-gradient(180deg, rgba(31,23,20,0.95) 0%, rgba(19,15,13,0.97) 100%)",
          boxShadow: "0 20px 44px rgba(0,0,0,0.42), inset 0 1px 0 rgba(255,228,173,0.08)",
        }}
      >
        <Link href="/?stage=1" style={{ color: "#eec274", textDecoration: "none" }}>
          ← Вернуться на сцену
        </Link>

        <h1
          style={{
            margin: "16px 0 6px",
            fontSize: "40px",
            color: "#f8d9a3",
          }}
        >
          {currentName}
        </h1>
        <p style={{ margin: "0 0 22px", color: "#bf9a60", letterSpacing: "0.05em" }}>
          ПЕРСОНАЛЬНЫЙ СПИСОК НАГРАД
        </p>

        {isAdmin && (
          <div
            style={{
              marginBottom: "16px",
              padding: "12px",
              borderRadius: "12px",
              border: "1px solid rgba(243, 196, 111, 0.25)",
              background: "rgba(19,14,12,0.7)",
              display: "grid",
              gap: "8px",
            }}
          >
            <strong style={{ color: "#f4cc8f" }}>Режим администратора (обе страницы)</strong>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ color: "#e9c88e" }}>Редактировать:</span>
              <select
                value={editorId}
                onChange={(e) => setEditorId(e.target.value)}
                style={{
                  background: "#0f0a08",
                  color: "#f2e4c8",
                  border: "1px solid rgba(255, 214, 148, 0.35)",
                  borderRadius: "8px",
                  padding: "6px 8px",
                }}
              >
                {ids.map((id) => (
                  <option key={id} value={id}>
                    {id} ({personName(rows, id)})
                  </option>
                ))}
              </select>
            </div>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <button
                onClick={addRow}
                style={{
                  border: "1px solid rgba(255, 214, 148, 0.45)",
                  background: "#2a1a13",
                  color: "#ffe1a2",
                  borderRadius: "8px",
                  padding: "7px 10px",
                }}
              >
                + Добавить награду
              </button>
              <button
                onClick={saveLocal}
                style={{
                  border: "1px solid rgba(255, 214, 148, 0.45)",
                  background: "#2a1a13",
                  color: "#ffe1a2",
                  borderRadius: "8px",
                  padding: "7px 10px",
                }}
              >
                Сохранить локально
              </button>
              <button
                onClick={resetLocal}
                style={{
                  border: "1px solid rgba(255, 170, 140, 0.55)",
                  background: "#3a1712",
                  color: "#ffd2b6",
                  borderRadius: "8px",
                  padding: "7px 10px",
                }}
              >
                Сбросить локальные правки
              </button>
            </div>

            <div style={{ display: "grid", gap: "8px", marginTop: "6px" }}>
              {editorRows.map(({ row, index }) => (
                <div
                  key={`${row.id}-${index}`}
                  style={{
                    border: "1px solid rgba(243, 196, 111, 0.2)",
                    borderRadius: "10px",
                    padding: "8px",
                    display: "grid",
                    gap: "6px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "minmax(110px, 160px) minmax(0, 1fr)",
                      gap: "8px",
                    }}
                  >
                    <input
                      value={row.date}
                      onChange={(e) => updateRow(index, "date", e.target.value)}
                      style={{
                        width: "100%",
                        minWidth: 0,
                        background: "#0f0a08",
                        color: "#f2e4c8",
                        border: "1px solid rgba(255, 214, 148, 0.35)",
                        borderRadius: "8px",
                        padding: "6px 8px",
                      }}
                    />
                    <input
                      value={row.name}
                      onChange={(e) => updateRow(index, "name", e.target.value)}
                      style={{
                        width: "100%",
                        minWidth: 0,
                        background: "#0f0a08",
                        color: "#f2e4c8",
                        border: "1px solid rgba(255, 214, 148, 0.35)",
                        borderRadius: "8px",
                        padding: "6px 8px",
                      }}
                    />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", gap: "8px" }}>
                    <textarea
                      value={row.text}
                      onChange={(e) => updateRow(index, "text", e.target.value)}
                      rows={2}
                      style={{
                        width: "100%",
                        minWidth: 0,
                        background: "#0f0a08",
                        color: "#f2e4c8",
                        border: "1px solid rgba(255, 214, 148, 0.35)",
                        borderRadius: "8px",
                        padding: "6px 8px",
                        resize: "vertical",
                        overflowWrap: "anywhere",
                      }}
                    />
                    <button
                      onClick={() => deleteRow(index)}
                      style={{
                        border: "1px solid rgba(255, 170, 140, 0.55)",
                        background: "#3a1712",
                        color: "#ffd2b6",
                        borderRadius: "8px",
                        padding: "5px 8px",
                      }}
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <ol
          style={{
            listStyle: "none",
            padding: 0,
            margin: 0,
            display: "grid",
            gap: "10px",
          }}
        >
          {currentAchievements.map((item, index) => (
            <li
              key={`${item.date}-${index}`}
              style={{
                display: "grid",
                gridTemplateColumns: "130px 1fr",
                gap: "12px",
                alignItems: "center",
                padding: "12px 14px",
                borderRadius: "12px",
                border: "1px solid rgba(243, 196, 111, 0.2)",
                background: "linear-gradient(180deg, rgba(42,32,28,0.72) 0%, rgba(26,21,18,0.84) 100%)",
              }}
            >
              <div
                style={{
                  fontWeight: 700,
                  color: "#f4cc8f",
                  letterSpacing: "0.02em",
                }}
              >
                {item.date}
              </div>

              <div
                style={{
                  lineHeight: 1.4,
                  paddingRight: "8px",
                  color: "#f2e4c8",
                  minWidth: 0,
                  overflowWrap: "anywhere",
                  wordBreak: "break-word",
                }}
              >
                {item.text}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </main>
  );
}
