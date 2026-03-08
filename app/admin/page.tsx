import Link from "next/link";
import AdminHallEditor from "../../components/AdminHallEditor";
import { getHallRows } from "../../lib/hallData";

export default async function AdminPage() {
  const rows = await getHallRows();

  return (
    <>
      <div style={{ position: "fixed", top: 16, left: 16, zIndex: 10 }}>
        <Link
          href="/?stage=1"
          style={{
            color: "#ffe1a2",
            textDecoration: "none",
            background: "rgba(14, 9, 3, 0.64)",
            border: "1px solid rgba(255, 214, 148, 0.45)",
            borderRadius: "999px",
            padding: "8px 14px",
            fontFamily: "Georgia, serif",
          }}
        >
          ← Вернуться на сцену
        </Link>
      </div>

      <AdminHallEditor initialRows={rows} />
    </>
  );
}
