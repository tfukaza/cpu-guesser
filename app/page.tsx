import Game from "@/components/Game";
import catalog from "@/data/catalog.json";
import type { Catalog } from "@/lib/game";
export default function Home() {
  return <Game catalog={catalog as Catalog} />;
}
