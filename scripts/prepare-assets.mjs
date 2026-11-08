import sharp from "sharp";
import { mkdir, readFile, writeFile, access } from "node:fs/promises";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { cpus, regions, targets } from "../data/source-data.mjs";

const force = process.argv.includes("--download");
await mkdir("assets/originals", { recursive: true });
await mkdir("public/tiles", { recursive: true });
await mkdir("public/previews", { recursive: true });
const out = { version: 4, cpus: [], regions, questions: [] };
const provenance = [];
let serial = 0;
for (const cpu of cpus) {
  const file = `assets/originals/${cpu.id}.jpg`;
  let exists = true;
  try {
    await access(file);
  } catch {
    exists = false;
  }
  if (!exists || force) {
    console.log(`Downloading ${cpu.maker} ${cpu.name}…`);
    execFileSync(
      "curl",
      [
        "--fail",
        "--location",
        "--retry",
        "2",
        "--user-agent",
        "CPU-Guesser/0.1 (educational local prototype; Mozilla/5.0)",
        "--silent",
        "--show-error",
        cpu.imageUrl,
        "--output",
        file,
      ],
      { stdio: "inherit" },
    );
  }
  const original = await readFile(file);
  const meta = await sharp(original).metadata();
  if (!meta.width || !meta.height || Math.min(meta.width, meta.height) < 1600)
    throw new Error(`Insufficient resolution: ${file}`);
  console.log(
    `Preparing ${cpu.maker} ${cpu.name}: ${meta.width} × ${meta.height}`,
  );
  // Normalize once on the full master; every crop inherits the same transfer function.
  const master = await sharp(original)
    .greyscale()
    .normalise({ lower: 1, upper: 99 })
    .png()
    .toBuffer();
  await sharp(master)
    .jpeg({ quality: 92 })
    .tile({ size: 512, overlap: 1, layout: "dz" })
    .toFile(`public/tiles/die-${cpu.id}.dz`);
  await sharp(master)
    .resize({ width: 640, withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toFile(`public/previews/${cpu.id}.jpg`);
  const { imageUrl, ...info } = cpu;
  out.cpus.push({
    ...info,
    width: meta.width,
    height: meta.height,
    tileSource: `/tiles/die-${cpu.id}.dzi`,
    thumbnail: `/previews/${cpu.id}.jpg`,
  });
  provenance.push({
    id: cpu.id,
    downloadUrl: imageUrl,
    source: cpu.source,
    photographer: cpu.photographer,
    license: cpu.license,
    licenseUrl: cpu.licenseUrl,
    width: meta.width,
    height: meta.height,
    sha256: createHash("sha256").update(original).digest("hex"),
    modifications: cpu.modifications,
  });
  for (const target of targets.filter((t) => t.cpuId === cpu.id)) {
    const id = target.questionId ?? `location-${String(++serial).padStart(2, "0")}`;
    const side = Math.round(Math.min(meta.width, meta.height) * 0.2);
    const left = Math.round(target.target.x * meta.width - side / 2),
      top = Math.round(target.target.y * meta.height - side / 2);
    if (
      left < 0 ||
      top < 0 ||
      left + side > meta.width ||
      top + side > meta.height
    )
      throw new Error(`Neighborhood exceeds die: ${id}`);
    await sharp(master)
      .extract({ left, top, width: side, height: side })
      .jpeg({ quality: 92 })
      .tile({ size: 512, overlap: 1, layout: "dz" })
      .toFile(`public/tiles/${id}.dz`);
    // The pin corresponds exactly to the extracted crop center, including pixel rounding.
    out.questions.push({
      ...target,
      id,
      target: {
        x: (left + side / 2) / meta.width,
        y: (top + side / 2) / meta.height,
      },
      neighborhood: { left, top, width: side, height: side },
      tileSource: `/tiles/${id}.dzi`,
      width: side,
      height: side,
    });
  }
}
if (out.cpus.length < 5)
  throw new Error(
    "The playable collection requires at least five CPUs. Questions are generated at runtime.",
  );
await writeFile("data/catalog.json", JSON.stringify(out, null, 2) + "\n");
await writeFile(
  "data/provenance.json",
  JSON.stringify(provenance, null, 2) + "\n",
);
console.log(
  `Prepared ${out.cpus.length} CPUs, ${regions.length} schematic regions, and ${out.questions.length} tiled neighborhoods.`,
);
