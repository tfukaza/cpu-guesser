import sharp from "sharp";
import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";

// Upgrade an existing catalog without changing identities, annotations, or legacy crops.
const catalog = JSON.parse(await readFile("data/catalog.json", "utf8"));
const provenance = JSON.parse(await readFile("data/provenance.json", "utf8"));
for (const cpu of catalog.cpus) {
  const original = await readFile(`assets/originals/${cpu.id}.jpg`);
  const record = provenance.find((p) => p.id === cpu.id);
  if (!record || record.sha256 !== createHash("sha256").update(original).digest("hex"))
    throw new Error(`Original differs from recorded provenance: ${cpu.id}`);
  const meta = await sharp(original).metadata();
  if (meta.width !== cpu.width || meta.height !== cpu.height)
    throw new Error(`Original dimensions differ from catalog: ${cpu.id}`);
  await sharp(original)
    .greyscale()
    .normalise({ lower: 1, upper: 99 })
    .jpeg({ quality: 92 })
    .tile({ size: 512, overlap: 1, layout: "dz" })
    .toFile(`public/tiles/die-${cpu.id}.dz`);
  cpu.tileSource = `/tiles/die-${cpu.id}.dzi`;
  console.log(`Prepared full-die tiles: ${cpu.maker} ${cpu.name}`);
}
await writeFile("data/catalog.json", JSON.stringify(catalog, null, 2) + "\n");
