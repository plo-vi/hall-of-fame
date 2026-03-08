import Link from "next/link";
import HallPageClient from "../../../components/HallPageClient";
import { getHallById, getHallIds, getHallRows } from "../../../lib/hallData";

export async function generateStaticParams() {
  const ids = await getHallIds();
  return ids.map((id) => ({ id }));
}

export const dynamicParams = false;

export default async function PersonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const personKey = (await params).id.trim().toLowerCase();
  const person = await getHallById(personKey);
  const allRows = await getHallRows();

  if (!person) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background:
            "radial-gradient(circle at 50% 10%, #4b140f 0%, #250a08 40%, #140606 100%)",
          color: "#f6d8a2",
          fontFamily: "Georgia, serif",
          padding: "24px",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <h1 style={{ fontSize: "36px", marginBottom: "12px" }}>Зал славы не найден</h1>
          <Link href="/?stage=1" style={{ color: "#f3c672" }}>
            Вернуться на сцену
          </Link>
        </div>
      </main>
    );
  }

  return <HallPageClient currentId={personKey} initialRows={allRows} />;
}
