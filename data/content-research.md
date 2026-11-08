# Content verification notes

## Procedural question imagery

New sessions sample five distinct photographed dies and random square neighborhoods spanning 16–28% of the short image axis, inset from the outer photo edge. Full-die Deep Zoom derivatives preserve the original orientation, grayscale conversion and global 1st–99th percentile normalization. Each derivative retains its existing per-photo creator, source and license; see `ATTRIBUTION.md` and `data/PLAYABLE-CREDITS.md`. `scripts/prepare-die-tiles.mjs` verifies input dimensions and SHA-256 against the existing catalog and provenance before generating these pyramids. The viewer clips imagery and constrains navigation to the sampled neighborhood; the atlas remains vector-only.

Random targets inherit a documented or visually estimated region label only when inside that region's existing polygon. Targets elsewhere have unknown circuit function and are displayed as unidentified. No additional functional inference or new contours are created by random sampling. Preset question tiles remain solely for existing saved-game compatibility; new games do not require authored target points. Generated crop geometry is persisted and validated so reloads preserve the same locations.

Research date: 2026-11-07. Rectangles below are **hand-aligned, approximate floorplan regions**, in the orientation of the files in `assets/originals`. Coordinates are `[left, top, right, bottom]`, normalized to the full photograph. They are educational block boundaries, not traced transistor geometry. Do not imply exact circuit-level boundaries.

## Photography and physical scale

| File | Photographer / license | Sample and size evidence |
| --- | --- | --- |
| `intel_8008.jpg` | Ken Shirriff, [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), [file source](https://happytrees.org/dieshots/File:Intel-8008-die-adjusted.jpg) | Photo shows Intel 1971 / 8008. Approximately 4.42 × 3.17 mm is recorded by the [Sheets Works die catalog](https://sheets.works/data-viz/cpu-dies); **not independently confirmed for this sample**. Use ≈4.4 × 3.2 mm and disclose estimate. |
| `mos_6502.jpg` | John McMaster, [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), [Commons source](https://commons.wikimedia.org/wiki/File:Mos_6502d-2_mcmaster_mz_mit20x.jpg), [original archive](https://siliconpr0n.org/archive/doku.php?id=mcmaster:mos:6502d-2) | Commons confirms a MOS 6502-series photo and the label 6502D, **not mask revision D**. Exact sample dimensions unconfirmed. Catalog quotes 3.1 × 2.7 mm, but this disagrees modestly with image aspect (10874/9910 ≈1.097). Do not assert these as measured sample dimensions; D can denote package. Original-6502 family dimensions elsewhere are ~3.9 × 4.3 mm and cannot safely identify this shrink. |
| `zilog_z80.jpg` | ZeptoBars, [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/), [Commons source](https://commons.wikimedia.org/wiki/File:Z80-Z0840004PSC-HD.jpg) | **Exact photographed sample**: Zilog Z0840004PSC, date code 9012; description explicitly gives **3545 × 3350 µm**. Use 3.545 × 3.350 mm, landscape. |
| `moto_68000.jpg` | Pauli Rautakorpi, [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/), [Commons source](https://commons.wikimedia.org/wiki/File:Motorola_68000_die.JPG) | Commons identifies MC68000L12, mask 2A72E. Motorola engineer Thomas W. Starnes's [1983 article](http://www.easy68k.com/paulrsm/doc/dpbm68k2.htm), Photo 1, states **246 × 281 mils /6.24 × 7.14 mm**. In current landscape orientation use **7.14 × 6.24 mm**. This is a primary family floorplan measurement; same floorplan visually identifiable, but publication does not name 2A72E. |
| `moto_6800.jpg` | John McMaster, [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), [Commons source](https://commons.wikimedia.org/wiki/File:Motorola_mc6800p_mcmaster_mz_vm1-10x.jpg), [original archive](https://siliconpr0n.org/archive/doku.php?id=mcmaster:motorola:mc6800p) | Commons identifies MC6800P, recorded 2023, no mask or die dimensions. Catalog quotes **4.06 × 3.94 mm**, consistent with photo aspect (10880/10560≈1.030); treat as estimate, not a measured sample. |

All displayed derivatives should state: “Cropped, converted to grayscale, contrast normalized, and tiled for CPU Guesser.” Retain the original license for each photo/derivative. Attribute Wikimedia Commons and CPU Graveyard as repositories, while keeping the photographer as the creator. Sheets Works was useful for source discovery and estimated dimensions and should receive a separate catalog credit.

Exact per-sample scale for 6502/6800 is an unresolved content limitation. An honest atlas should distinguish measured and approximate sizes, and use a “physical scale (approx.)” legend if those estimates are shown. Pixel dimensions are not physical millimeters.

## Intel 8008

Primary explanation and annotated die: **Ken Shirriff**, [Die photos and analysis of the revolutionary 8008 microprocessor](https://www.righto.com/2016/12/die-photos-and-analysis-of_24.html). It is the exact same photo. Region names are supported directly by the annotated diagram and article.

| Region | Rectangle | Safe interior target(s) |
| --- | --- | --- |
| Register file (seven 8-bit registers) | `[.74,.17,.89,.43]` | `(.82,.26)`, `(.82,.36)` |
| Program counter / address stack | `[.72,.59,.91,.88]` | `(.82,.72)` |
| Instruction decode PLA | `[.41,.30,.52,.66]` | `(.46,.44)`, `(.46,.56)` |
| ALU temporary registers | `[.11,.16,.27,.39]` | `(.20,.22)`, `(.20,.34)` |

The triangular carry generator is to the left/center under the temporary registers; it should be a polygon rather than an enormous rectangular ALU label. The main ALU is irregular and occupies the remaining lower-left area. Avoid overclaiming the whole left region as one regular ALU array.

## Zilog Z80

Primary annotated floorplan: **Ken Shirriff**, [The Z-80’s 16-bit increment/decrement circuit reverse engineered](https://www.righto.com/2013/11/the-z-80s-16-bit-incrementdecrement.html). Its overview is oriented 90° counterclockwise relative to the ZeptoBars photo; the locations below account for that rotation.

| Region | Rectangle | Safe interior target(s) |
| --- | --- | --- |
| Register file | `[.64,.49,.88,.75]` | `(.77,.60)`, `(.77,.70)` |
| Four-bit ALU | `[.74,.15,.88,.42]` | `(.81,.27)` |
| Increment/decrement unit | `[.64,.77,.87,.85]` | `(.76,.81)` |
| Instruction PLA | `[.24,.17,.33,.70]` | `(.285,.35)` |

Additional primary educational articles: [Down to the silicon: how the Z80’s registers are implemented](https://www.righto.com/2014/10/how-z80s-registers-are-implemented-down.html), and [The Z-80 has a 4-bit ALU](https://www.righto.com/2013/09/the-z-80-has-4-bit-alu-heres-how-it.html), both Ken Shirriff. Correct description: the ALU processes an eight-bit operation in two four-bit passes. Do not describe the entire CPU as four-bit.

## Motorola 68000

Excellent primary source: **Thomas W. Starnes, Motorola**, [Design Philosophy Behind Motorola’s MC68000, Part 2](http://www.easy68k.com/paulrsm/doc/dpbm68k2.htm), originally BYTE, May 1983. Photo 1 has an annotated floorplan; its orientation is portrait. Rotate it 90° clockwise to align with the current landscape photograph. This is a same-floorplan visual registration, not a transistor-level trace of the exact 2A72E sample.

| Region | Approximate rectangle in current photo | Safe interior target(s) |
| --- | --- | --- |
| Address high execution unit | `[.075,.095,.30,.326]` | `(.18,.21)` |
| Address low execution unit | `[.075,.326,.30,.56]` | `(.18,.45)` |
| Data execution unit / data ALU | `[.075,.56,.30,.87]` | `(.18,.70)` |
| Microcode / nanocode control store, combined | `[.54,.10,.79,.65]` | `(.64,.25)`, `(.64,.54)` |

The first three named execution units include registers as well as arithmetic circuitry. Label them as execution units, not just memory. In the primary portrait image µROM and NROM are stacked; after rotation they become side-by-side portions of the large right-hand store. The combined label is safer across masks than incorrectly treating the two visibly stacked landscape blocks as µROM versus NROM.

More technical primary reverse-engineering material: [Roger Sanders’s M68000Schematic](https://github.com/RogerSanders/M68000Schematic), MIT (schematic/annotations), and [Richard Brown’s microcode notes](https://github.com/RichardBrown384/68000-microcode-division/blob/main/docs/microcode.md). Do not claim those schematic coordinates are die-photo coordinates.

## Motorola 6800

Primary reverse-engineering reference: **Ijor, Segher Boessenkool, Ed Spittles / Visual6502**, [named nodes](https://github.com/trebonian/visual6502/blob/master/chip-6800/nodenames.js). Nodes explicitly identify PC, SP, IX, accumulator A/B and PLA word lines. Inspection of the accompanying polygon model shows the same floorplan as the McMaster photo, in the same orientation with its Y origin reversed. The following rectangles are hand-aligned broad factual regions, **not redistributed polygon geometry**.

| Region | Rectangle | Safe interior target(s) |
| --- | --- | --- |
| Instruction PLA | `[.12,.105,.79,.215]` | `(.42,.16)` |
| Program-counter register pair | `[.24,.64,.32,.88]` | `(.275,.70)`, `(.275,.80)` |
| Stack-pointer register pair | `[.43,.64,.51,.88]` | `(.465,.72)` |
| Index register | `[.53,.64,.59,.88]` | `(.565,.75)` |

Accumulator A is around `x=.64`, B around `x=.60`, both spanning `y≈.64–.88`. These can be added as narrow optional regions, but avoid a large arbitrary “register file” rectangle because the storage columns are interleaved with datapath wiring.

Technical manufacturer documentation: [Motorola M6800 Systems Reference and Data Sheets, May 1975](https://vtda.org/docs/computing/Motorola/M6800SystemsReferenceDataSheets_May75.pdf). This supports architecture descriptions, not exact photo boundary claims.

## MOS 6502

Primary reverse-engineering reference: **Brian Silverman, Barry Silverman, Ed Spittles, Segher Boessenkool / Visual6502**, [named nodes](https://github.com/trebonian/visual6502/blob/master/nodenames.js). Names identify accumulator, X/Y, PC high/low, stack pointer and instruction register. The current McMaster photo is 90° clockwise from the usual Visual6502 portrait view. Rectangles below are hand-aligned broad regions; match points against the native photo while building the question crops.

| Region | Rectangle | Safe interior target(s) |
| --- | --- | --- |
| Instruction decode PLA | `[.77,.10,.91,.84]` | `(.84,.40)` |
| X/Y index registers | `[.14,.19,.44,.25]` | `(.26,.22)` |
| Accumulator register | `[.14,.50,.44,.55]` | `(.26,.522)` |
| Program counter, high byte | `[.14,.56,.44,.61]` | `(.26,.581)` |
| Program counter, low byte | `[.14,.69,.44,.73]` | `(.26,.708)` |

The fine boundaries of the latter four are approximate: the source model omits outer photographic margins. They are best represented in the new vector atlas as simplified contiguous datapath blocks, with an “approximate floorplan” note. Do not label isolated transistor gates without stronger evidence.

Primary explanation example: **Ken Shirriff**, [The 6502 CPU’s overflow flag explained at the silicon level](https://www.righto.com/2013/01/a-small-part-of-6502-chip-explained.html). It explains how logic is read from layers, but it does not directly validate all the register boundaries above.

## Videos and educational material

- **Video — Michael Steil, CCC/27C3:** [Reverse Engineering the MOS 6502 CPU](https://media.ccc.de/v/27c3-4159-en-reverse_engineering_mos_6502). Relevant to 6502 and the general die-to-simulator process. A direct recording, not an unrelated architecture introduction.
- **Video — Ken Shirriff, Hackaday Superconference 2016:** [Reading Silicon: How to Reverse Engineer Integrated Circuits](https://www.youtube.com/watch?v=aHx-XUA6f9g). Includes Z80 examples and general circuitry identification. [Author’s talk page](https://www.righto.com/p/silicon.html), [slides](https://static.righto.com/ken-shirriff-supercon.pdf).
- Link Starnes’s 68000 article as **Article / manufacturer floorplan** and the Motorola reference PDF as **Documentation**. Video links should be labeled “Video”; no need to iframe third-party players.

## Geometry/data license caution

Visual6502’s named-node JavaScript files have MIT notices with the authors listed above. Their **polygon geometry** is **CC BY-NC-SA 3.0**: 6502 credits Greg James / Visual6502; 6800 credits Ijor / Visual6502. Do not vendor or trace those polygon meshes into the product and imply MIT. The user now requests a schematic floorplan, so fresh approximate block rectangles based on documented identities are sufficient. Credit the research authors and link their sources; explain that the atlas is an educational approximation. The temporary raster/model comparisons used for this report remain in `/tmp`, not application assets.

## Expanded visual contour collection (2026-11-07)

Primary image metadata was checked for 260 Commons file records discovered among 291 candidates from mainstream and major historical CPU vendors in the Sheets Works catalog. Seven records describe I/O-only dies, non-CPU devices or annotated artwork and are excluded from the reference collection; 253 credited CPU/SoC reference records remain. The original 8008 record is separately preserved with its previously researched CPU Graveyard source. This gives 254 distinct collection records in total: 73 playable and 181 reference-only. Thirty-one candidate sources still need separate host/license verification and are not credited as verified additions.

Three language-model reviewers inspected disjoint batches of the available full-frame die photographs, checked target geometry, and reviewed visible block boundaries. Their saved decisions are `visual-regions-early.json`, `visual-regions-middle.json` and `visual-regions-modern.json`. The modern-photo reviewer also inspected rendered contour-overlay contact sheets. Combined accepted additions: 68 dies, 286 regions. The original five CPUs retain their documented region labels; the new labels describe visible geometry and texture without claiming function. Qualitative confidence refers to placement of approximate contours, never a calibrated probability of identifying a component. All draft files and original Commons metadata are retained for later correction.

The final set has 73 playable dies, 307 total regions and 311 questions. New question IDs use stable CPU/region names rather than collection-order indices. The original 25 location IDs remain unchanged. The catalog version changed to prevent stale saved games from silently using a different collection.

Known limitations and exclusions:

- `amd_k6_2` and `amd_k6_iii`: tilted dies pictured inside packages with substantial background; remain reference-only until a documented crop and rectification is available.
- `amd_zeppelin`: tilted silicon with substantial framing; remains reference-only. The separate, full-frame Zen+ photograph is playable.
- Twelve original-image endpoints remained rate limited after bounded attempts and a delayed retry. Metadata and original source links remain available in the reference collection; no contours were invented for unavailable images.
- Wide downloaded 3840-pixel renditions of Coffee Lake-R, Zen+ Zeppelin, Rocket Lake and Raptor Lake have short sides between 1688 and 1858 pixels. Their original sources exceed 2000 pixels in both dimensions. The actual downloaded resolutions and SHA-256 values are saved; these images were not upscaled. Their small question crops have less detail than full-resolution masters.
- WDC 65C02 is photographed portrait, although catalog dimensions are landscape. The dimensions were swapped to match the photo's orientation; aspect still differs by about 14%, so physical scale remains explicitly provisional. Pentium II Deschutes and Freescale MPC8245 also require width/height swaps. The builder records swaps as aspect-ratio inferences and does not claim they are measurements.
- IBM-made 386 has an approximately 11% mismatch between photo aspect and catalog dimensions and heavy upper-metal routing; visual boundaries and scale remain uncertain. CBM 65CE02's uneven etch, Sandy Bridge's etched structure and PS5's obscuring upper-metal grid also reduce confidence. The PS5 contours mark only visible peripheral panels.
- Discovery-catalog years describe families or variants and are not independently verified for every sample. `moto_68060` has been labeled **68LC060 (68060 family)** to agree with its actual original-photo identification. An Alpha 21064A record's catalog year may describe the broader family; it remains explicitly unverified.

New photo-derived vector contours retain the source photograph's license, including share-alike requirements where applicable. They are not copied from third-party catalog artwork. The expanded atlas omits decorative pseudo-circuit blocks for new dies and displays the reviewed contours directly. Manufacturer rows and atlas bounds are computed from the full collection so same-year variants do not overlap; dates position columns, and dimensions govern the individual die size only approximately.


## Compact company timelines and famous dies (2026-11-07)

The user requested discrete NVIDIA GPUs and Apple M-series SoCs as well as additional CPUs, and then requested company colors with reusable vertical space. The atlas now shares a 12-world-unit-per-year X axis while packing each company’s recorded collection interval into available vertical space. Company-colored trunks branch to photographed dies; nonoverlapping intervals can share the same height. Actual/approximate die dimensions still govern outline sizes. The colors are readable interface approximations of company palettes, not an assertion of exact official brand specifications. A line endpoint means the collection has no later photographed entry; it does **not** date a company’s founding, closure or acquisition. Branches organize photographs and do not assert design ancestry.

Supplemental research lives in `data/research/{additional,apple,nvidia}-cpus.json`, with primary evidence in matching `*-evidence.json` files. `scripts/cpu-records.mjs` merges these supplements after the discovery records, preserving field-specific corrections when discovery metadata is refreshed. `pending-cpus.json` remains the original audit snapshot; `pending-current.json` identifies which of those candidates have since been resolved. New source pages are checked at the photographer or Commons file level, with license and measurements saved separately from provisional catalog claims.

Apple M1 uses Fritzchens Fritz’s CC0 polysilicon photograph and the photographer’s 11.344 × 10.855 mm measurement **including scribe lines**, which matches the full rectangular frame. Apple’s November 10, 2020 announcement supports its introduction year. Smaller no-scribe/no-seal measurements in the same photograph description are preserved as evidence but do not replace the full-frame dimensions. M2/M3/M4 and M1 Pro/Max leads remain pending: illustrations, annotated reproductions, or photography with no verified reusable grant do not qualify as playable die photos. Details are in `apple-evidence.json`.

A discovery record labeled `amd_zen3_ccd` points to a Vermeer **I/O die**, identified explicitly by the original photographer. It is excluded rather than relabeled as CPU silicon. A separately located real Vermeer compute chiplet is retained as a reference if its damaged photograph is unsuitable for full-frame gameplay.


This pass adds **29 playable dies and 339 reviewed contours**: 16 CPU/SoC recoveries with 281 regions, Apple M1 with 6, and 12 NVIDIA GPU dies with 52. The final collection has **102 playable dies, 646 regions, 650 legacy authored neighborhoods**, and procedural question generation. The merged reference library contains 280 credited records, of which 179 are reference-only; the separately sourced original 8008 gives 281 distinct photographed collection entries overall. The NVIDIA additions are RIVA 128ZX, GeForce 8800 GTX, GTX 280/470/580/980 Ti, Tesla P100, and RTX 2060/2080/2080 Ti/3090/4090. Six additional NVIDIA records remain reference-only with explicit suitability notes, preserving known measurements even where imagery is unsuitable. G80’s sides are clearly marked as estimates from a published 470 mm² NVIDIA-authored paper and rectangular photo aspect; they are not claimed as specimen measurements.
