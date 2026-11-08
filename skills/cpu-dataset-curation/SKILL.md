---
name: cpu-dataset-curation
description: Research, credit, visually annotate, and save CPU, GPU and SoC die datasets for the CPU Guesser game. Use when adding processors, checking photo licenses, drafting circuit-region contours, or regenerating the game's content assets.
---

# CPU Guesser dataset curation

Work from the CPU Guesser repository root. Read `data/content-research.md`, `ATTRIBUTION.md`, `data/source-data.mjs`, and the relevant current datasets before changing content. This is a die-location game: a list of processor specifications alone does not create playable questions.

## Curate identities and evidence

- Prefer distinct photographed dies or meaningful mask/floorplan variants. Clock speeds, retail bins, package variants and different crops of the same photo do not automatically justify new CPUs.
- Include mainstream consumer, workstation, server, mobile and console CPUs, discrete GPUs, and major historical vendors as appropriate to the request. Treat a CPU-containing SoC as a SoC; identify a CPU compute chiplet separately from an I/O-only chiplet. An I/O die is not a processor question. The user has explicitly requested famous NVIDIA GPUs and Apple M-series SoCs; retain `chipType` so these are identified accurately.
- Use discovery catalogs to find originals. Verify the actual file page, original photographer, reusable license, attribution text, specimen description and original resolution at the original host. A search thumbnail, an uploader name, a site's footer license, or a publicly accessible URL does not establish rights to the photograph.
- Separate family introduction, exact part introduction, mask revision, die copyright, package date code and photograph date. Record disagreements or unknowns rather than inferring one from another. For example, a 6502D package does not prove mask revision D; the catalog's `moto_68060` photograph actually depicts a 68LC060.
- Attach evidence per field. A photograph license does not verify a release year; a manufacturer architecture diagram does not establish locations on a particular die photograph. Reference entries can remain useful with unknown dates or dimensions.

## Save reusable research

- `scripts/research-cpus.py` discovers candidate records and checks Wikimedia Commons metadata. `data/research/commons-batches.json` stores primary metadata; `commons-cpus.json` contains normalized records; `pending-cpus.json` records unresolved hosts/errors. Cache successes, batch Commons titles (up to 40 per request), respect rate limits and use bounded retries with backoff. Do not turn a failed request into a verified record.
- `scripts/build-cpu-library.mjs` generates `data/cpu-library.json` and `data/CPU-CREDITS.md`. This is the broad reference collection; its provisional discovery-catalog dates and dimensions are explicitly flagged.
- Independently researched additions/overrides live in `additional-cpus.json`, `apple-cpus.json` and `nvidia-cpus.json` under `data/research/`, with primary evidence alongside them. `scripts/cpu-records.mjs` merges these by stable ID after the discovery records, so a refresh cannot discard their corrections. Regenerate `pending-current.json` to distinguish resolved discoveries from the historical pending snapshot.
- For Flickr, save the photo’s own ImageObject license and photo-model license ID, original author, exact source/download URLs and measurement text. A photographer’s scribe-line, seal-ring and active-area measurements describe different boundaries; match the full photograph, not a smaller interior measurement. Original photo dates do not date the design.
- Keep research evidence in tracked `data/research/`. `scripts/research/` and `assets/originals/` are ignored scratch/download directories and are insufficient as the only saved provenance.
- Preserve original and downloaded-rendition URLs separately. Save retrieval date, image dimensions, creator, exact license/link, attribution strings and any restrictions. Generation records SHA-256 for the exact downloaded input in `data/provenance.json`.
- Regenerating the library must retain curated identity corrections, exclusions and annotation decisions. Add explicit override records or maintain the builder; do not silently overwrite established primary evidence with a discovery catalog.

## Inspect photos and draw regions

The user permits language models to visually estimate component contours with unknown functions. Visually inspect every new playable photograph, using contact sheets for triage and individual images when boundaries are unclear. Authorized parallel agents may review disjoint batches, but annotation must be grounded in images each reviewer actually saw.

- Record polygons in normalized full-image coordinates: `(0,0)` top left, X right, Y down, `(1,1)` bottom right. Keep image orientation unchanged unless a documented transform is applied consistently to imagery, contours, targets and provenance.
- Follow visible component boundaries, repeated arrays or distinct geometric blocks. Use rectangles for genuinely rectangular blocks and polygons for clearly irregular ones. Do not substitute a generic grid, invent precision, or claim visual contours are transistor-level boundaries.
- Unknown function: use labels such as `Region A — dense rectangular array`, `kind: "unclassified"`, `annotationMethod: "model-visual-estimate"`, a visual explanation and qualitative confidence. Confidence concerns contour placement and is not a calibrated probability. Never promote an array to "cache", "ALU" or "core" solely from appearance.
- Documented functions: cite the original reverse engineer or manufacturer, visually register their floorplan against the exact source photo and record any rotation/mirroring. Keep documented and visually inferred labels distinguishable.
- Reject or explicitly transform photos with packaging, large margins, perspective, rotation, annotations covering silicon, or unreadable circuit structure. Whole-frame pixels must describe the die represented by the atlas outline. Do not assign physical die dimensions to an uncropped package photograph.
- Put targets inside their own polygons and ensure the 20%-short-side square neighborhood fits inside the photo. Avoid regions dominated by markings, wire bonds or blank borders. Check polygon validity, self-intersections, duplicate targets and overlapping regions.

## Promote and generate

- Review drafts are `data/visual-regions-{early,middle,modern,additional,apple,nvidia}.json`. `scripts/build-expanded-cpus.mjs` combines accepted drafts and verified records into `data/expanded-catalog.json`; `data/source-data.mjs` appends these to the original documented collection.
- Unknown physical dimensions must stay unknown. Never convert pixels to millimeters without scale evidence. A primary measured die area plus a full-frame rectangular aspect ratio can support derived side-length estimates; save the area source, square-root calculation and approximation status, and never describe those sides as measured. Existing provisional catalog sizes must be labeled approximate; check orientation and aspect ratio. Keep entries without usable scale in the reference collection unless the user requests a separately designed unscaled mode.
- Download candidates with `scripts/download-cpu-candidates.mjs`. Prefer at least 2000 pixels on both downloaded axes. The game accepts a 1600-pixel short-side rendition when the original has at least 2000 pixels on both axes; save the actual rendition resolution and inspect the resulting crop quality. Choose a larger rendition for wide dies where available instead of upscaling. If a host blocks an input, retain a pending/reference entry and explain the unresolved limitation.
- Run `node scripts/build-expanded-cpus.mjs`, `npm run prepare-assets`, then `node scripts/build-cpu-library.mjs`. Keep generated catalog, provenance, previews and bounded Deep Zoom neighborhoods together. New questions use stable CPU/region IDs; preserve existing question identities. Bump catalog version if old sessions could have changed meaning.
- Keep atlas bounds data-driven. The user prefers colored company timelines with branches and reused vertical space rather than permanent manufacturer rows. `layoutAtlas` packs company spans only across the years represented in this dataset. Preserve shared year centers, nonoverlapping die hitboxes and physical/approximate die sizes. Lines are collection coverage, not corporate lifespans, acquisitions or factual chip ancestry. Major maker colors should remain consistent across lines, outlines and labels; retain text labels so color is not the sole identifier.

## Credit and verify

Credit the photographer, original file/page, exact license/link, required attribution and modifications in the in-game Sources, provenance and attribution files. Credit discovery catalogs separately. Preserve each original's license on photo derivatives and photo-derived contours; CC BY-SA derivatives need the corresponding share-alike terms. Do not describe all files as CC BY when the collection includes CC0 or CC BY-SA. Do not copy unrelated source descriptions or article text into the game.

Run appropriate content tests, typecheck, browser tests and a production build after promotion. Content checks should cover unique identities, source/license completeness, polygon interiors, valid crop bounds, complete tile pyramids, grayscale pixels, and atlas hitbox round trips. Browser-check a new manufacturer, a modern large die, an inferred-region reveal, credits and reference search. Report playable counts separately from reference-only or pending records; do not claim universal CPU coverage.
