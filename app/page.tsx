import { HomeWithSuspense } from "../components/HomeClient";
import { getHallRows } from "../lib/hallData";

export default async function Home() {
  const rows = await getHallRows();
  return <HomeWithSuspense initialRows={rows} />;
}
