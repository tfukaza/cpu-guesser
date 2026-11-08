# Sources and attribution

All photographic question images are derivatives of the originals below and retain each original’s Creative Commons license. Full-die streaming pyramids are converted to grayscale, contrast normalized (1st–99th percentiles), JPEG encoded, and tiled; procedurally generated questions clip a random neighborhood from those derivatives at runtime. These use the same per-photograph attribution and license as the existing crops. Photographers are the creators; Wikimedia Commons, Flickr and CPU Graveyard host copies.

## Expanded collection

The collection includes CPUs, discrete NVIDIA GPUs and Apple M1 as a CPU-containing SoC. Supplemental primary photo and measurement evidence is saved under `data/research/`, including Flickr photo-specific license records. Photo-derived contours retain each linked source license.

The full playable collection, including all additional creators, exact licenses, original file links, source-rendition links, scale caveats and modification notices, is listed in [data/PLAYABLE-CREDITS.md](data/PLAYABLE-CREDITS.md). The wider reference collection is credited entry by entry in [data/CPU-CREDITS.md](data/CPU-CREDITS.md). Source/license evidence and unresolved candidates are preserved in [data/research](data/research).

New component contours were estimated from visible structure by three language-model reviewers. These contours are derivatives of the credited photographs and are distributed under each photograph's linked license, including CC BY-SA share-alike terms where applicable. Labels such as “Region A” do not establish circuit function. These estimates are distinct from the documented floorplan regions below. Physical scale and introduction dates from the discovery catalog remain provisional.

## Intel 8008

- Photograph: **Ken Shirriff**, [original source](https://happytrees.org/dieshots/File:Intel-8008-die-adjusted.jpg), [image download](https://happytrees.org/sites/dieshots-mediawiki-1.35.4/images/3/30/Intel-8008-die-adjusted.jpg).
- License: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
- Modifications: Converted to grayscale, contrast normalized (1st–99th percentiles), cropped into question neighborhoods, and tiled for CPU Guesser. Schematic atlas drawn separately; boundaries approximate.
- Specimen: Intel 8008, die marked © Intel 1971; exact mask revision unconfirmed.
- Scale: 4.42 × 3.17 mm. Approximate catalog dimensions; not independently measured for this specimen. [Reference](https://sheets.works/data-viz/cpu-dies).

Educational sources:

- article: [Ken Shirriff — Die photos and analysis of the revolutionary 8008](https://www.righto.com/2016/12/die-photos-and-analysis-of_24.html).
- video: [Ken Shirriff — Reading Silicon, Hackaday Superconference 2016](https://www.youtube.com/watch?v=aHx-XUA6f9g).

## Motorola 6800

- Photograph: **John McMaster**, [original source](https://commons.wikimedia.org/wiki/File:Motorola_mc6800p_mcmaster_mz_vm1-10x.jpg), [image download](https://upload.wikimedia.org/wikipedia/commons/d/dd/Motorola_mc6800p_mcmaster_mz_vm1-10x.jpg).
- License: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
- Modifications: Converted to grayscale, contrast normalized (1st–99th percentiles), cropped into question neighborhoods, and tiled for CPU Guesser. Schematic atlas drawn separately; boundaries approximate.
- Specimen: MC6800P photographed by John McMaster; mask revision unconfirmed.
- Scale: 4.06 × 3.94 mm. Approximate catalog dimensions; exact photographed specimen has no verified measurement. [Reference](https://sheets.works/data-viz/cpu-dies).

Educational sources:

- documentation: [Visual6502 — 6800 named nodes (Ijor, Boessenkool, Spittles)](https://github.com/trebonian/visual6502/blob/master/chip-6800/nodenames.js).
- documentation: [Motorola — M6800 Systems Reference and Data Sheets, May 1975](https://vtda.org/docs/computing/Motorola/M6800SystemsReferenceDataSheets_May75.pdf).
- article: [John McMaster — original imaging archive](https://siliconpr0n.org/archive/doku.php?id=mcmaster:motorola:mc6800p).

## MOS Technology 6502

- Photograph: **John McMaster**, [original source](https://commons.wikimedia.org/wiki/File:Mos_6502d-2_mcmaster_mz_mit20x.jpg), [image download](https://upload.wikimedia.org/wikipedia/commons/4/4a/Mos_6502d-2_mcmaster_mz_mit20x.jpg).
- License: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
- Modifications: Converted to grayscale, contrast normalized (1st–99th percentiles), cropped into question neighborhoods, and tiled for CPU Guesser. Schematic atlas drawn separately; boundaries approximate.
- Specimen: 6502D package marking; D does not establish the die’s mask revision.
- Scale: 3.1 × 2.7 mm. Provisional catalog estimate. This sample’s dimensions are unverified and the photo aspect differs slightly; scale is approximate. [Reference](https://sheets.works/data-viz/cpu-dies).

Educational sources:

- documentation: [Visual6502 — named storage nodes (Silverman, Spittles, Boessenkool)](https://github.com/trebonian/visual6502/blob/master/nodenames.js).
- video: [Michael Steil — Reverse Engineering the MOS 6502 CPU, 27C3](https://media.ccc.de/v/27c3-4159-en-reverse_engineering_mos_6502).
- article: [Ken Shirriff — The 6502 overflow flag at the silicon level](https://www.righto.com/2013/01/a-small-part-of-6502-chip-explained.html).
- article: [John McMaster — original imaging archive](https://siliconpr0n.org/archive/doku.php?id=mcmaster:mos:6502d-2).

## Zilog Z80

- Photograph: **ZeptoBars**, [original source](https://commons.wikimedia.org/wiki/File:Z80-Z0840004PSC-HD.jpg), [image download](https://upload.wikimedia.org/wikipedia/commons/3/3c/Z80-Z0840004PSC-HD.jpg).
- License: [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/).
- Modifications: Converted to grayscale, contrast normalized (1st–99th percentiles), cropped into question neighborhoods, and tiled for CPU Guesser. Schematic atlas drawn separately; boundaries approximate.
- Specimen: Z0840004PSC, NMOS, date code 9012 (1990, week 12).
- Scale: 3.545 × 3.35 mm. Dimensions explicitly stated for the photographed specimen in the original description. [Reference](https://commons.wikimedia.org/wiki/File:Z80-Z0840004PSC-HD.jpg).

Educational sources:

- article: [Ken Shirriff — The Z-80’s 16-bit increment/decrement circuit](https://www.righto.com/2013/11/the-z-80s-16-bit-incrementdecrement.html).
- article: [Ken Shirriff — How the Z80’s registers are implemented](https://www.righto.com/2014/10/how-z80s-registers-are-implemented-down.html).
- article: [Ken Shirriff — The Z80 has a four-bit ALU](https://www.righto.com/2013/09/the-z-80-has-4-bit-alu-heres-how-it.html).
- video: [Ken Shirriff — Reading Silicon, Hackaday Superconference 2016](https://www.youtube.com/watch?v=aHx-XUA6f9g).

## Motorola 68000

- Photograph: **Pauli Rautakorpi**, [original source](https://commons.wikimedia.org/wiki/File:Motorola_68000_die.JPG), [image download](https://upload.wikimedia.org/wikipedia/commons/f/fe/Motorola_68000_die.JPG).
- License: [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/).
- Modifications: Converted to grayscale, contrast normalized (1st–99th percentiles), cropped into question neighborhoods, and tiled for CPU Guesser. Schematic atlas drawn separately; boundaries approximate.
- Specimen: MC68000L12, mask 2A72E, photographed by Pauli Rautakorpi.
- Scale: 7.14 × 6.24 mm. Primary Motorola floorplan gives 281 × 246 mils (7.14 × 6.24 mm in this orientation). Family measurement; exact mask dimensions unconfirmed. [Reference](http://www.easy68k.com/paulrsm/doc/dpbm68k2.htm).

Educational sources:

- article: [Thomas W. Starnes / Motorola — Design Philosophy Behind the MC68000, Part 2 (BYTE, May 1983)](http://www.easy68k.com/paulrsm/doc/dpbm68k2.htm).
- documentation: [Roger Sanders — M68000 schematics and annotations](https://github.com/RogerSanders/M68000Schematic).
- documentation: [Richard Brown — 68000 microcode notes](https://github.com/RichardBrown384/68000-microcode-division/blob/main/docs/microcode.md).

## Research and schematic attribution

Circuit locations are independently drawn broad floorplan rectangles informed by the cited primary articles, manufacturer floorplans, and named storage nodes. Attribution: Ken Shirriff; Thomas W. Starnes and Motorola; Roger Sanders; Richard Brown; Visual6502’s Greg James, Brian Silverman, Barry Silverman, Ijor, Segher Boessenkool, and Ed Spittles. Visual6502 named-node files carry MIT notices; their CC BY-NC-SA 3.0 polygon meshes are not redistributed. Routes, generic pads, and unannotated background cells are illustrative rather than physically verified.

[The Data Drop / Sheets Works](https://sheets.works/data-viz/cpu-dies) helped locate original photography and supplies the explicitly provisional dimensions for some samples. No third-party catalog artwork is used. Detailed registration and scale caveats: [content verification notes](data/content-research.md).

## Software

React and React DOM (MIT), Vinext (MIT), OpenSeadragon (BSD-3-Clause), Lucide (ISC and MIT), Sharp (Apache-2.0), Vite (MIT), and TypeScript (Apache-2.0). The Sites starter and its retained helpers include their own notices. See [third-party license notices](public/THIRD_PARTY_NOTICES.txt).

## Typeface

[Geist Mono](https://github.com/vercel/geist-font), by Vercel and Basement Studio, is bundled locally under the [SIL Open Font License 1.1](public/fonts/OFL.txt). The Latin WOFF2 asset is distributed with the installed Next.js package.
