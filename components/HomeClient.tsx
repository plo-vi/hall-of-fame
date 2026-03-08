"use client";

import { FormEvent } from "react";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import CurtainOverlay from "./CurtainOverlay";
import StageScene from "./StageScene";
import { ADMIN_ROWS_KEY } from "../lib/adminStorage";

type HallRow = {
  id: string;
  name: string;
  date: string;
  text: string;
};

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? "theater-admin";

function toIsoDate(value: string): string {
  const dot = value.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (dot) {
    const [, dd, mm, yyyy] = dot;
    return `${yyyy}-${mm}-${dd}`;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }
  return "";
}

function fromIsoDate(value: string): string {
  const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!iso) return value;
  const [, yyyy, mm, dd] = iso;
  return `${dd}.${mm}.${yyyy}`;
}

function dateRank(value: string): number {
  const iso = toIsoDate(value);
  if (!iso) return Number.NEGATIVE_INFINITY;
  const ts = Date.parse(`${iso}T00:00:00Z`);
  return Number.isNaN(ts) ? Number.NEGATIVE_INFINITY : ts;
}

function sortRows(rows: HallRow[]): HallRow[] {
  const idOrder: Record<string, number> = { elena: 0, darya: 1 };
  return [...rows].sort((a, b) => {
    const aOrder = idOrder[a.id] ?? 99;
    const bOrder = idOrder[b.id] ?? 99;
    if (aOrder !== bOrder) return aOrder - bOrder;
    return dateRank(b.date) - dateRank(a.date);
  });
}

function todayRuDate(): string {
  const now = new Date();
  const dd = `${now.getDate()}`.padStart(2, "0");
  const mm = `${now.getMonth() + 1}`.padStart(2, "0");
  const yyyy = now.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function rowsToCsv(rows: HallRow[]): string {
  const header = "id,name,date,text";
  const lines = rows.map((row) =>
    [row.id, row.name, row.date, row.text].map((value) => csvEscape(value.trim())).join(","),
  );
  return [header, ...lines].join("\n");
}

function parseStoredRows(initialRows: HallRow[]): HallRow[] {
  if (typeof window === "undefined") return initialRows;
  const raw = localStorage.getItem(ADMIN_ROWS_KEY);
  if (!raw) return initialRows;
  try {
    const parsed = JSON.parse(raw) as HallRow[];
    if (Array.isArray(parsed)) {
      return parsed.filter((row) => row.id && row.name && row.date && row.text);
    }
  } catch {
    return initialRows;
  }
  return initialRows;
}

function StageAdminModal({
  initialRows,
  onSaveAndExit,
  onCancelAndExit,
}: {
  initialRows: HallRow[];
  onSaveAndExit: (rows: HallRow[]) => void;
  onCancelAndExit: () => void;
}) {
  const [rows, setRows] = useState<HallRow[]>(() => sortRows(parseStoredRows(initialRows)));
  const [activePersonId, setActivePersonId] = useState<"elena" | "darya">("elena");

  const updateRow = (index: number, key: keyof HallRow, value: string) => {
    const normalizedValue = key === "date" ? fromIsoDate(value) : value;
    setRows((prev) =>
      sortRows(prev.map((row, i) => (i === index ? { ...row, [key]: normalizedValue } : row))),
    );
  };

  const addRow = (id: string) => {
    const name = rows.find((row) => row.id === id)?.name ?? (id === "darya" ? "Дарья" : "Елена");
    setRows((prev) => {
      const insertAt = prev.findIndex((row) => row.id === id);
      const next = [...prev];
      const newRow = { id, name, date: todayRuDate(), text: "Новая награда" };
      if (insertAt === -1) {
        next.push(newRow);
      } else {
        next.splice(insertAt, 0, newRow);
      }
      return sortRows(next);
    });
  };

  const deleteRow = (index: number) => {
    setRows((prev) => sortRows(prev.filter((_, i) => i !== index)));
  };

  const exportCsv = () => {
    const csv = rowsToCsv(rows);
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

  const groups = useMemo(
    () => [
      { id: "elena", title: "Елена", rows: rows.map((row, index) => ({ row, index })).filter((e) => e.row.id === "elena") },
      { id: "darya", title: "Дарья", rows: rows.map((row, index) => ({ row, index })).filter((e) => e.row.id === "darya") },
    ],
    [rows],
  );

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2200,
        background: "rgba(6,4,4,0.84)",
        display: "grid",
        placeItems: "center",
        padding: "16px",
      }}
    >
      <div
        style={{
          width: "min(1120px, 98vw)",
          maxHeight: "92vh",
          overflow: "auto",
          borderRadius: "16px",
          border: "1px solid rgba(255, 214, 148, 0.35)",
          background: "linear-gradient(180deg, rgba(31,23,20,0.98) 0%, rgba(19,15,13,0.99) 100%)",
          color: "#f2e4c8",
          padding: "16px",
          fontFamily: "Georgia, serif",
        }}
      >
        <h2 style={{ margin: "0 0 12px", color: "#f8d9a3" }}>Редактирование наград (обе страницы)</h2>

        <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
          {[
            { id: "elena" as const, label: "Елена" },
            { id: "darya" as const, label: "Дарья" },
          ].map((person) => {
            const active = activePersonId === person.id;
            return (
              <button
                key={person.id}
                onClick={() => setActivePersonId(person.id)}
                style={{
                  border: "1px solid rgba(255, 214, 148, 0.45)",
                  background: active ? "#3a241a" : "#2a1a13",
                  color: active ? "#ffdfab" : "#ffe1a2",
                  borderRadius: "999px",
                  padding: "8px 14px",
                  boxShadow: active ? "0 0 14px rgba(255, 196, 120, 0.28)" : "none",
                }}
              >
                {person.label}
              </button>
            );
          })}
        </div>

        <div style={{ display: "grid", gap: "14px" }}>
          {groups
            .filter((group) => group.id === activePersonId)
            .map((group) => (
            <section
              key={group.id}
              style={{
                border: "1px solid rgba(243, 196, 111, 0.2)",
                borderRadius: "12px",
                padding: "10px",
                display: "grid",
                gap: "8px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px" }}>
                <strong style={{ color: "#f4cc8f", fontSize: "22px" }}>{group.title}</strong>
                <button
                  onClick={() => addRow(group.id)}
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
              </div>

              {group.rows.map(({ row, index }) => (
                <div
                  key={`${group.id}-${index}`}
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
                      type="date"
                      value={toIsoDate(row.date)}
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
                        height: "fit-content",
                      }}
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              ))}
            </section>
          ))}
        </div>

        <div
          style={{
            position: "sticky",
            bottom: 0,
            marginTop: "14px",
            paddingTop: "12px",
            background: "linear-gradient(180deg, rgba(19,15,13,0) 0%, rgba(19,15,13,1) 35%)",
            display: "flex",
            gap: "10px",
            justifyContent: "flex-end",
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={exportCsv}
            style={{
              border: "1px solid rgba(255, 214, 148, 0.45)",
              background: "#2a1a13",
              color: "#ffe1a2",
              borderRadius: "8px",
              padding: "10px 12px",
            }}
          >
            Скачать CSV
          </button>
          <button
            onClick={() => onSaveAndExit(rows)}
            style={{
              border: "1px solid rgba(255, 214, 148, 0.45)",
              background: "#2a1a13",
              color: "#ffe1a2",
              borderRadius: "8px",
              padding: "10px 12px",
            }}
          >
            Сохранить изменения и выйти
          </button>
          <button
            onClick={onCancelAndExit}
            style={{
              border: "1px solid rgba(255, 170, 140, 0.55)",
              background: "#3a1712",
              color: "#ffd2b6",
              borderRadius: "8px",
              padding: "10px 12px",
            }}
          >
            Отменить изменения и выйти
          </button>
        </div>
      </div>
    </div>
  );
}

export default function HomeClient({ initialRows }: { initialRows: HallRow[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [skipCurtainOnce] = useState(() => searchParams.get("stage") === "1");
  const [curtainOpened, setCurtainOpened] = useState(skipCurtainOnce);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const showCurtain = !curtainOpened;

  useEffect(() => {
    if (skipCurtainOnce && searchParams.get("stage") === "1") {
      router.replace("/");
    }
  }, [router, searchParams, skipCurtainOnce]);

  const handleAdminLogin = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (password !== ADMIN_PASSWORD) {
      setLoginError("Неверный пароль");
      return;
    }
    setLoginError("");
    setPassword("");
    setShowAdminLogin(false);
    setShowAdmin(true);
  };

  return (
    <>
      <StageScene />
      {showCurtain && <CurtainOverlay onOpen={() => setCurtainOpened(true)} />}

      <button
        onClick={() => setShowAdminLogin(true)}
        aria-label="open admin editor"
        style={{
          position: "fixed",
          bottom: "8px",
          left: "8px",
          width: "18px",
          height: "18px",
          opacity: 0.02,
          border: "none",
          background: "#fff",
          borderRadius: "999px",
          zIndex: 2100,
          cursor: "default",
        }}
      />

      {showAdminLogin && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 2150,
            background: "rgba(6,4,4,0.82)",
            display: "grid",
            placeItems: "center",
            padding: "16px",
          }}
        >
          <form
            onSubmit={handleAdminLogin}
            style={{
              width: "min(360px, 92vw)",
              background: "#18100d",
              border: "1px solid rgba(255, 214, 148, 0.45)",
              borderRadius: "14px",
              padding: "16px",
              display: "grid",
              gap: "10px",
              color: "#f2e4c8",
              fontFamily: "Georgia, serif",
            }}
          >
            <strong style={{ color: "#f8d9a3" }}>Вход в админ-версию</strong>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Введите пароль"
              style={{
                background: "#0f0a08",
                color: "#f2e4c8",
                border: "1px solid rgba(255, 214, 148, 0.45)",
                borderRadius: "8px",
                padding: "9px 10px",
              }}
            />
            {loginError && <span style={{ color: "#ff9c8f", fontSize: "13px" }}>{loginError}</span>}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
              <button
                type="button"
                onClick={() => {
                  setShowAdminLogin(false);
                  setPassword("");
                  setLoginError("");
                }}
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

      {showAdmin && (
        <StageAdminModal
          initialRows={initialRows}
          onSaveAndExit={(rows) => {
            localStorage.setItem(ADMIN_ROWS_KEY, JSON.stringify(rows));
            setShowAdmin(false);
          }}
          onCancelAndExit={() => {
            setShowAdmin(false);
          }}
        />
      )}
    </>
  );
}

export function HomeWithSuspense({ initialRows }: { initialRows: HallRow[] }) {
  return (
    <Suspense fallback={<StageScene />}>
      <HomeClient initialRows={initialRows} />
    </Suspense>
  );
}
