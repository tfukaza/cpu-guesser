# CPU Guesser

A local, five-round exploration game built around real CPU die photographs. Inspect a bounded photographic neighborhood, then pin its original location on a **vector schematic atlas**.

The atlas places die centers on an introduction-year timeline. Colored company timelines branch to their chips and reuse vertical space when their collection spans do not overlap. All die outlines use millimeter world units. The atlas has **no photographic layer**, even at maximum zoom.

## Run locally

Requires Node.js 22.13 or newer and npm.

```sh
npm install
npm run dev -- --hostname 127.0.0.1
```

Open the Local URL printed by the server (normally `http://127.0.0.1:5173`). The game runs entirely in the browser. Current sessions and personal bests stay in this browser’s local storage. No sign-in, database, or external API is needed. The inherited Sites development helper may print a mock sign-in identity; the game does not use it.

The prepared full-die tiles and content catalog are included, so playing does not require downloading source photographs. Browser requests stay local; educational links open their original websites when clicked.

## The collection

| CPU                 | Introduction | Photograph       | License   |
| ------------------- | ------------ | ---------------- | --------- |
| Intel 8008          | 1972         | Ken Shirriff     | CC BY 4.0 |
| Motorola 6800       | 1974         | John McMaster    | CC BY 4.0 |
| MOS Technology 6502 | 1975         | John McMaster    | CC BY 4.0 |
| Zilog Z80           | 1976         | ZeptoBars        | CC BY 3.0 |
| Motorola 68000      | 1979         | Pauli Rautakorpi | CC BY 3.0 |

The table above describes the original collection. New playable families include AMD K5/K6, Athlon, Ryzen compute chiplets through Zen 5; Intel 8085, x86, Pentium, Core and Xeon; Motorola 68k and PowerPC; DEC Alpha; MIPS; HP PA-RISC; and console APUs. The latest additions include Apple M1, Steam Deck’s Van Gogh APU, and 12 NVIDIA GPUs from RIVA 128ZX and GeForce 8800 GTX to RTX 4090. The expanded collection has **102 playable dies with procedurally generated questions**, plus **179 reference-only entries**. The original 21 documented regions are joined by 625 model-estimated component contours whose functions are unverified. See [ATTRIBUTION.md](ATTRIBUTION.md) for original links, licenses, reference authors, videos, and modification notices. The in-game **Sourcebook** contains the same source categories.

## Playing

- Pan and zoom the mystery photo within its fixed neighborhood. The crosshair stays anchored to the original location.
- Expand the shared atlas or search for a CPU. Click or tap its schematic to place a pin; empty space does not accept pins.
- Submit to reveal the actual location, approximate circuit region, explanation, and source article or document.
- Each round awards up to 5,000 points: 1,000 for the same manufacturer, up to 1,000 for the model introduction year, 1,000 for the exact CPU, and up to 2,000 for location accuracy on the correct CPU. Year credit decays smoothly as `1000 × 2^(−year gap / 4)`, rounded to a whole point: 1 year away earns 841, 2 years 707, 4 years 500, and 8 years 250. Manufacturer and year credits are independent, so a different CPU can still earn either or both. Joint maker labels qualify when they share a named company. Location points remain maximal within 0.5% of the die diagonal and fall linearly to zero at 25%. The popup shows the model years and an optional score breakdown. Saved rounds are rescored when loaded.
- Five rounds form an expedition. Each session samples five different CPUs and a new random location and zoom level on each, without using preset targets. Crops span 16–28% of the short image axis and avoid the outer photo edges. Known region labels are attached when the target falls inside an existing annotation; other locations are explicitly unidentified. Reloading preserves the exact crops.
- A hidden elapsed timer starts once the first round is ready and stops at the fifth guess. Time between rounds and across reloads counts; there is no time limit. The final results and shared scorecard show `mm:ss.mmm` (or `h:mm:ss.mmm` for longer games). Restarting resets the timer. Older saved games without timing data do not invent a duration.

Keyboard: focus a viewer, use arrow keys to pan, `+`/`−` to zoom, and `Home` to reset. In the atlas, `Enter` pins the viewport center.

## Accuracy and scale

The map is an **educational approximation**, not a transistor-level reconstruction. Documented region locations are hand aligned to the photographs; unlabeled background blocks, routes, and pads are illustrative. Circuit labels appear only after a guess. No Visual6502 polygon meshes are bundled.

One atlas world unit equals one millimeter. The shared chronology uses 12 world units per year; large dies never expand the spacing for every other year. Each company has a colored trunk and branches to its dies. Company spans are packed into reusable vertical space, and contemporary variants receive separate branches so die hitboxes cannot overlap. A line begins and ends with years represented in this dataset; it does not assert company birth, closure, acquisition or design ancestry. Timeline spacing and branch positions are layout conventions; die dimensions are physical values or explicitly noted estimates.

The Z80 has a published measurement for the exact photographed specimen. The 68000 uses a primary Motorola family floorplan measurement. The 8008, 6800, and especially the 6502 use provisional catalog estimates, not verified specimen measurements. The sourcebook records this uncertainty. Exact relative scaling of these specimens remains a content limitation, and the game should not be used for metrology. A 6502D package marking is not evidence of mask revision D.

## Rebuild image assets

```sh
npm run prepare-assets
```

The script downloads missing originals into ignored `assets/originals/` using `curl`, converts each downloaded master to grayscale, normalizes its 1st–99th percentiles once, and builds full-die Deep Zoom pyramids of 512-pixel JPEG tiles with one-pixel overlap. Runtime questions choose new crops from these pyramids; OpenSeadragon clips the photo and constrains navigation to the selected neighborhood. The atlas stays entirely schematic. Existing authored neighborhood pyramids remain for legacy saved-game compatibility. New CPUs need full-die imagery and metadata, with no preset target requirement.

To add full-die pyramids to an existing catalog without regenerating annotations or old crops, run `node scripts/prepare-die-tiles.mjs`. It verifies each input against its recorded SHA-256 and dimensions before writing the tiles.

Use `npm run prepare-assets -- --download` to fetch every original again. This requires network access; expanded collection downloads include large original images and downsampled renditions. Input hashes and original resolutions are recorded in [data/provenance.json](data/provenance.json). Keep any regeneration changes to the catalog, provenance, and tiles together.

Content is authored in [data/source-data.mjs](data/source-data.mjs). It defines photo credits, physical dimensions and confidence notes, model introduction years, reference links, schematic polygons, and legacy target points. The generated [data/catalog.json](data/catalog.json) is the typed app input. Research and orientation notes are in [data/content-research.md](data/content-research.md).

## Verify

```sh
npm run typecheck
npm test
npm run test:e2e
npm run build
```

If Playwright has no Chromium installed, run `npx playwright install chromium` once. Browser tests reuse a running local server or start one automatically. They cover the five-round flow, exact scoring, reload recovery, SVG-only atlas, physical size ratios, keyboard pinning, credits, mobile touch, and image retry. Unit/content checks validate coordinates, question bounds, complete tile pyramids, and grayscale pixels.

The app uses React, TypeScript, Vinext, and OpenSeadragon. Sharp handles offline image preparation. The local preview remains on Vinext. Vercel uses a separate native Next.js static export through `npm run build:vercel`, configured in `vercel.json`. The first version is a casual local game: its browser-side answer data is inspectable; no competitive anti-cheat is claimed.

The interface uses locally bundled Geist Mono. Results emphasize the CPU model, pin-to-answer distance, and score. Cross-CPU distances use the timeline atlas coordinates; this is a map-layout distance, not a physical separation between chips.

After each guess, a modal fades the game into the background. Its expanded vector map fits both locations and draws a distance line between the guess and the answer, including when they are on different CPUs. CPU and circuit details sit below the map. **Next Level** starts the next round; the fifth round leads to the session results. The modal survives reloads with the saved session.

The final results screen includes **Share Result**, which copies a spoiler-free emoji scorecard with the total, elapsed time, and each round’s score. Green tiles represent full 1,000-point steps, yellow a partial step, and white the remaining steps. A confirmation appears after copying; if clipboard access is unavailable, the scorecard is selected in a read-only field for manual copying.

## Research and curation

The complete photo reference dataset is [data/cpu-library.json](data/cpu-library.json), with [per-entry creator and license credits](data/CPU-CREDITS.md). Playable images and photo-derived contours have [full modification and license notices](data/PLAYABLE-CREDITS.md). No reference-only photograph is bundled. Collection counts refer to photographed dies/families, not every retail CPU or speed bin.

Primary image metadata and unresolved candidates are saved in [data/research](data/research). The discovery catalog is credited separately. Discovery-catalog introduction dates and dimensions remain provisional; image license verification does not establish those facts. Supplemental Apple/NVIDIA/Flickr records retain field-specific manufacturer dates, photographer measurements or explicitly derived estimates. A few width/height pairs were swapped to match photograph orientation, with explicit notes.

The new contours follow visually distinct component boundaries reviewed by three language-model agents. They use generic labels such as “Region A — rectangular array,” qualitative confidence, and `model-visual-estimate` provenance. They do not assert circuit function or exact transistor geometry. Photos with oblique packages, excessive framing or inadequate evidence remain reference-only. Preferred downloaded resolution is 2000 pixels on both axes; wide downsampled renditions down to a 1600-pixel short side are accepted with their actual resolutions recorded, never upscaled.

```sh
npm run research:cpus        # discover; reuse cached primary metadata
# python3 scripts/research-cpus.py --refresh  # explicitly refresh cached metadata
node scripts/download-cpu-candidates.mjs
# Visually inspect photos and curate data/visual-regions-*.json before promotion.
npm run build:cpu-regions
npm run prepare-assets
npm run build:cpu-library
```

Dataset work should follow [skills/cpu-dataset-curation/SKILL.md](skills/cpu-dataset-curation/SKILL.md). The repository's [AGENTS.md](AGENTS.md) points future agents to this guide.

## Deploy to Vercel

Source lives at [tfukaza/cpu-guesser](https://github.com/tfukaza/cpu-guesser). Vercel builds the `main` branch with `npm ci` and `npm run build:vercel`, serving the static `out/` directory. The app has no required runtime secrets, API server, or database.

Use the GitHub integration for deployments: the full-resolution image pyramids exceed Vercel CLI source upload limits. Keep `public/tiles`, the catalog and attribution files together in commits. Tiles use a one-day cache lifetime. The regular `npm run dev` and `npm run build` commands retain the local Vinext/Sites workflow.

Link previews use the original monochrome artwork in `public/social-preview.png`, with Open Graph and Twitter large-image metadata. Regenerate the 1200 × 630 image and editable SVG with `node scripts/generate-social-card.mjs`; it uses the bundled Geist Mono font and no third-party photographs.
