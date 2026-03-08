import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "../../../../lib/supabase";

type AdminRow = {
  id: string;
  name: string;
  date: string;
  text: string;
};

const ADMIN_COOKIE = "hof_admin_session";

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

function sanitizeRows(input: unknown): AdminRow[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((row) => {
      if (!row || typeof row !== "object") return null;
      const raw = row as Record<string, unknown>;
      const id = String(raw.id ?? "").trim().toLowerCase();
      const name = String(raw.name ?? "").trim();
      const date = String(raw.date ?? "").trim();
      const text = String(raw.text ?? "").trim();
      if (!id || !name || !date || !text) return null;
      return { id, name, date, text };
    })
    .filter((row): row is AdminRow => Boolean(row));
}

export async function POST(request: NextRequest) {
  const adminPassword = process.env.ADMIN_PASSWORD;
  const hasSupabase =
    Boolean(process.env.SUPABASE_URL) && Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

  if (!adminPassword) {
    return NextResponse.json({ ok: false, error: "ADMIN_PASSWORD is not configured" }, { status: 500 });
  }

  if (!hasSupabase) {
    return NextResponse.json({ ok: false, error: "Supabase env is not configured" }, { status: 500 });
  }

  let body: { mode?: string; password?: string; rows?: unknown } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const cookieAuthorized = request.cookies.get(ADMIN_COOKIE)?.value === "1";
  const passwordAuthorized = body.password === adminPassword;
  const authorized = cookieAuthorized || passwordAuthorized;

  if (!authorized) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  if (body.mode === "auth") {
    const authResponse = NextResponse.json({ ok: true });
    authResponse.cookies.set(ADMIN_COOKIE, "1", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 8,
    });
    return authResponse;
  }

  const rows = sanitizeRows(body.rows);
  if (rows.length === 0) {
    return NextResponse.json({ ok: false, error: "Rows are empty or invalid" }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();
  const replaceRows = rows.map((row) => ({
    person_id: row.id,
    person_name: row.name,
    date: toIsoDate(row.date),
    text: row.text,
  }));

  if (replaceRows.some((row) => !row.date)) {
    return NextResponse.json({ ok: false, error: "Invalid date format in payload" }, { status: 400 });
  }

  const { error: deleteError } = await supabase
    .from("hall_achievements")
    .delete()
    .neq("person_id", "__never__");

  if (deleteError) {
    return NextResponse.json({ ok: false, error: deleteError.message }, { status: 500 });
  }

  const { error: insertError } = await supabase
    .from("hall_achievements")
    .insert(replaceRows);

  if (insertError) {
    return NextResponse.json({ ok: false, error: insertError.message }, { status: 500 });
  }

  const response = NextResponse.json({ ok: true, count: replaceRows.length });
  response.cookies.set(ADMIN_COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  return response;
}
