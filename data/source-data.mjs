import expanded from "./expanded-catalog.json" with { type: "json" };

const article = (title, url) => ({ title, url, kind: "article" });
const doc = (title, url) => ({ title, url, kind: "documentation" });
const video = (title, url) => ({ title, url, kind: "video" });
const catalogSource = article(
  "The Data Drop — processor die catalog",
  "https://sheets.works/data-viz/cpu-dies",
);
const nodes6502 = doc(
  "Visual6502 — named storage nodes (Silverman, Spittles, Boessenkool)",
  "https://github.com/trebonian/visual6502/blob/master/nodenames.js",
);
const nodes6800 = doc(
  "Visual6502 — 6800 named nodes (Ijor, Boessenkool, Spittles)",
  "https://github.com/trebonian/visual6502/blob/master/chip-6800/nodenames.js",
);
const reading = video(
  "Ken Shirriff — Reading Silicon, Hackaday Superconference 2016",
  "https://www.youtube.com/watch?v=aHx-XUA6f9g",
);
const starnes = article(
  "Thomas W. Starnes / Motorola — Design Philosophy Behind the MC68000, Part 2 (BYTE, May 1983)",
  "http://www.easy68k.com/paulrsm/doc/dpbm68k2.htm",
);
const intel8008 = article(
  "Ken Shirriff — Die photos and analysis of the revolutionary 8008",
  "https://www.righto.com/2016/12/die-photos-and-analysis-of_24.html",
);
const zilogZ80 = article(
  "Ken Shirriff — The Z-80’s 16-bit increment/decrement circuit",
  "https://www.righto.com/2013/11/the-z-80s-16-bit-incrementdecrement.html",
);
const edits =
  "Converted to grayscale, contrast normalized (1st–99th percentiles), cropped into question neighborhoods, and tiled for CPU Guesser. Schematic atlas drawn separately; boundaries approximate.";
function cpu(
  id,
  name,
  maker,
  year,
  revision,
  widthMm,
  heightMm,
  photographer,
  sourceUrl,
  imageUrl,
  license,
  dimensionNote,
  dimensionSource,
  resources,
) {
  return {
    id,
    name,
    maker,
    year,
    revision,
    widthMm,
    heightMm,
    photographer,
    source: article(`${photographer} — original die photograph`, sourceUrl),
    imageUrl,
    license: `CC BY ${license}`,
    licenseUrl: `https://creativecommons.org/licenses/by/${license}/`,
    modifications: edits,
    dimensionsNote: dimensionNote,
    dimensionsSource: dimensionSource,
    resources,
  };
}
export const cpus = [
  cpu(
    "intel_8008",
    "8008",
    "Intel",
    1972,
    "Intel 8008, die marked © Intel 1971; exact mask revision unconfirmed.",
    4.42,
    3.17,
    "Ken Shirriff",
    "https://happytrees.org/dieshots/File:Intel-8008-die-adjusted.jpg",
    "https://happytrees.org/sites/dieshots-mediawiki-1.35.4/images/3/30/Intel-8008-die-adjusted.jpg",
    "4.0",
    "Approximate catalog dimensions; not independently measured for this specimen.",
    catalogSource,
    [intel8008, reading],
  ),
  cpu(
    "moto_6800",
    "6800",
    "Motorola",
    1974,
    "MC6800P photographed by John McMaster; mask revision unconfirmed.",
    4.06,
    3.94,
    "John McMaster",
    "https://commons.wikimedia.org/wiki/File:Motorola_mc6800p_mcmaster_mz_vm1-10x.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/d/dd/Motorola_mc6800p_mcmaster_mz_vm1-10x.jpg",
    "4.0",
    "Approximate catalog dimensions; exact photographed specimen has no verified measurement.",
    catalogSource,
    [
      nodes6800,
      doc(
        "Motorola — M6800 Systems Reference and Data Sheets, May 1975",
        "https://vtda.org/docs/computing/Motorola/M6800SystemsReferenceDataSheets_May75.pdf",
      ),
      article(
        "John McMaster — original imaging archive",
        "https://siliconpr0n.org/archive/doku.php?id=mcmaster:motorola:mc6800p",
      ),
    ],
  ),
  cpu(
    "mos_6502",
    "6502",
    "MOS Technology",
    1975,
    "6502D package marking; D does not establish the die’s mask revision.",
    3.1,
    2.7,
    "John McMaster",
    "https://commons.wikimedia.org/wiki/File:Mos_6502d-2_mcmaster_mz_mit20x.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/4/4a/Mos_6502d-2_mcmaster_mz_mit20x.jpg",
    "4.0",
    "Provisional catalog estimate. This sample’s dimensions are unverified and the photo aspect differs slightly; scale is approximate.",
    catalogSource,
    [
      nodes6502,
      video(
        "Michael Steil — Reverse Engineering the MOS 6502 CPU, 27C3",
        "https://media.ccc.de/v/27c3-4159-en-reverse_engineering_mos_6502",
      ),
      article(
        "Ken Shirriff — The 6502 overflow flag at the silicon level",
        "https://www.righto.com/2013/01/a-small-part-of-6502-chip-explained.html",
      ),
      article(
        "John McMaster — original imaging archive",
        "https://siliconpr0n.org/archive/doku.php?id=mcmaster:mos:6502d-2",
      ),
    ],
  ),
  cpu(
    "zilog_z80",
    "Z80",
    "Zilog",
    1976,
    "Z0840004PSC, NMOS, date code 9012 (1990, week 12).",
    3.545,
    3.35,
    "ZeptoBars",
    "https://commons.wikimedia.org/wiki/File:Z80-Z0840004PSC-HD.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/3/3c/Z80-Z0840004PSC-HD.jpg",
    "3.0",
    "Dimensions explicitly stated for the photographed specimen in the original description.",
    article(
      "ZeptoBars / Commons — Z0840004PSC specimen dimensions",
      "https://commons.wikimedia.org/wiki/File:Z80-Z0840004PSC-HD.jpg",
    ),
    [
      zilogZ80,
      article(
        "Ken Shirriff — How the Z80’s registers are implemented",
        "https://www.righto.com/2014/10/how-z80s-registers-are-implemented-down.html",
      ),
      article(
        "Ken Shirriff — The Z80 has a four-bit ALU",
        "https://www.righto.com/2013/09/the-z-80-has-4-bit-alu-heres-how-it.html",
      ),
      reading,
    ],
  ),
  cpu(
    "moto_68000",
    "68000",
    "Motorola",
    1979,
    "MC68000L12, mask 2A72E, photographed by Pauli Rautakorpi.",
    7.14,
    6.24,
    "Pauli Rautakorpi",
    "https://commons.wikimedia.org/wiki/File:Motorola_68000_die.JPG",
    "https://upload.wikimedia.org/wikipedia/commons/f/fe/Motorola_68000_die.JPG",
    "3.0",
    "Primary Motorola floorplan gives 281 × 246 mils (7.14 × 6.24 mm in this orientation). Family measurement; exact mask dimensions unconfirmed.",
    starnes,
    [
      starnes,
      doc(
        "Roger Sanders — M68000 schematics and annotations",
        "https://github.com/RogerSanders/M68000Schematic",
      ),
      doc(
        "Richard Brown — 68000 microcode notes",
        "https://github.com/RichardBrown384/68000-microcode-division/blob/main/docs/microcode.md",
      ),
    ],
  ),
];
export const regions = [];
export const targets = [];
function region(cpuId, id, name, kind, rect, explanation, source, points) {
  const [l, t, r, b] = rect;
  const fullId = `${cpuId}-${id}`;
  regions.push({
    id: fullId,
    cpuId,
    name,
    kind,
    polygon: [
      { x: l, y: t },
      { x: r, y: t },
      { x: r, y: b },
      { x: l, y: b },
    ],
    explanation,
    source,
  });
  for (const [x, y] of points)
    targets.push({ cpuId, regionId: fullId, target: { x, y } });
}
region(
  "intel_8008",
  "registers",
  "Seven-register file",
  "register",
  [0.74, 0.17, 0.89, 0.43],
  "Look for the compact grid of repeated storage cells. This block holds seven eight-bit registers, including the accumulator.",
  intel8008,
  [
    [0.82, 0.26],
    [0.82, 0.36],
  ],
);
region(
  "intel_8008",
  "stack",
  "Program counter and address stack",
  "register",
  [0.72, 0.59, 0.91, 0.88],
  "The repeated rows store eight fourteen-bit addresses. The 8008 keeps its return-address stack on the chip alongside the program counter.",
  intel8008,
  [[0.82, 0.72]],
);
region(
  "intel_8008",
  "decode",
  "Instruction decode PLA",
  "control",
  [0.41, 0.3, 0.52, 0.66],
  "This narrow, regular array decodes instruction patterns into control signals. Its dense repeated lines contrast with the irregular arithmetic logic nearby.",
  intel8008,
  [
    [0.46, 0.44],
    [0.46, 0.56],
  ],
);
region(
  "intel_8008",
  "temporary",
  "ALU temporary registers",
  "register",
  [0.11, 0.16, 0.27, 0.39],
  "Two temporary registers hold the arithmetic unit’s input operands. Their driver circuitry occupies a conspicuous part of the left-hand datapath.",
  intel8008,
  [],
);
region(
  "moto_6800",
  "decode",
  "Instruction decode PLA",
  "control",
  [0.12, 0.105, 0.79, 0.215],
  "The broad regular array spans the upper part of this floorplan. Its word lines help turn instruction bits into the processor’s control signals.",
  nodes6800,
  [[0.42, 0.16]],
);
region(
  "moto_6800",
  "pc",
  "Program-counter register pair",
  "register",
  [0.24, 0.64, 0.32, 0.88],
  "Two repeated storage columns form the high and low bytes of the program counter. Neighboring vertical wiring connects them to the datapath.",
  nodes6800,
  [
    [0.275, 0.7],
    [0.275, 0.8],
  ],
);
region(
  "moto_6800",
  "sp",
  "Stack-pointer register pair",
  "register",
  [0.43, 0.64, 0.51, 0.88],
  "This pair of narrow storage columns holds the sixteen-bit stack pointer. The simplified atlas groups the cells into one approximate register block.",
  nodes6800,
  [[0.465, 0.72]],
);
region(
  "moto_6800",
  "ix",
  "Index register",
  "register",
  [0.53, 0.64, 0.59, 0.88],
  "The index register is embedded in the lower datapath. Repeated bit cells run vertically, rather than forming a separate rectangular memory macro.",
  nodes6800,
  [[0.565, 0.75]],
);
region(
  "mos_6502",
  "decode",
  "Instruction decode PLA",
  "control",
  [0.77, 0.1, 0.91, 0.84],
  "The long array at the right edge matches instruction patterns. Its straight repeated lines are a useful landmark beside the less regular datapath.",
  nodes6502,
  [[0.84, 0.4]],
);
region(
  "mos_6502",
  "index",
  "X and Y index registers",
  "register",
  [0.14, 0.19, 0.44, 0.25],
  "The X and Y registers sit within the eight-bit datapath. Here, their storage cells form a shallow band crossing the bit-slice wiring.",
  nodes6502,
  [[0.26, 0.22]],
);
region(
  "mos_6502",
  "acc",
  "Accumulator register",
  "register",
  [0.14, 0.5, 0.44, 0.55],
  "This band contains the accumulator’s storage cells. The atlas marks its approximate position within the surrounding datapath, rather than individual transistors.",
  nodes6502,
  [[0.26, 0.522]],
);
region(
  "mos_6502",
  "pch",
  "Program counter — high byte",
  "register",
  [0.14, 0.56, 0.44, 0.61],
  "Repeated storage cells in this datapath band hold the high byte of the program counter. The neighboring buses carry values between registers and logic.",
  nodes6502,
  [[0.26, 0.581]],
);
region(
  "mos_6502",
  "pcl",
  "Program counter — low byte",
  "register",
  [0.14, 0.69, 0.44, 0.73],
  "The low-byte program-counter cells sit farther down the same datapath. Their repeated bit structure is more useful than the photograph’s original color.",
  nodes6502,
  [[0.26, 0.708]],
);
region(
  "zilog_z80",
  "registers",
  "Register file",
  "register",
  [0.64, 0.49, 0.88, 0.75],
  "Repeated storage cells form the Z80’s register bank. This regular block sits below the arithmetic unit in the orientation used by our atlas.",
  zilogZ80,
  [
    [0.77, 0.6],
    [0.77, 0.7],
  ],
);
region(
  "zilog_z80",
  "alu",
  "Four-bit arithmetic logic unit",
  "compute",
  [0.74, 0.15, 0.88, 0.42],
  "Four repeated slices perform the arithmetic. The Z80 handles an eight-bit operation in two four-bit passes through this compact ALU.",
  zilogZ80,
  [[0.81, 0.27]],
);
region(
  "zilog_z80",
  "increment",
  "Increment/decrement unit",
  "compute",
  [0.64, 0.77, 0.87, 0.85],
  "This narrow block adjusts sixteen-bit values independently of the main ALU. Its position immediately beneath the register bank is a useful clue.",
  zilogZ80,
  [[0.76, 0.81]],
);
region(
  "zilog_z80",
  "decode",
  "Instruction decode PLA",
  "control",
  [0.24, 0.17, 0.33, 0.7],
  "The narrow instruction PLA is a regular strip on the opposite side from the registers. It matches instruction patterns to generate control signals.",
  zilogZ80,
  [[0.285, 0.35]],
);
region(
  "moto_68000",
  "address-hi",
  "Address execution unit — high word",
  "compute",
  [0.075, 0.095, 0.3, 0.326],
  "The upper address execution unit combines storage and arithmetic circuitry for the high half of address values. It is one of three stacked execution regions.",
  starnes,
  [[0.18, 0.21]],
);
region(
  "moto_68000",
  "address-lo",
  "Address execution unit — low word",
  "compute",
  [0.075, 0.326, 0.3, 0.56],
  "The middle execution region handles the low half of addresses. The regular datapath structure distinguishes it from the dense control stores farther right.",
  starnes,
  [[0.18, 0.45]],
);
region(
  "moto_68000",
  "data",
  "Data execution unit",
  "compute",
  [0.075, 0.56, 0.3, 0.87],
  "The data execution region contains arithmetic circuitry and registers. Its repeated slices occupy the lower part of the left-hand execution column.",
  starnes,
  [[0.18, 0.7]],
);
region(
  "moto_68000",
  "control",
  "Microcode and nanocode control stores",
  "control",
  [0.54, 0.1, 0.79, 0.65],
  "Dense arrays store control information for instruction execution. The atlas combines the microcode and nanocode areas into one approximate control-store region.",
  starnes,
  [
    [0.64, 0.25],
    [0.64, 0.54],
  ],
);

// Reviewed visual contours carry generic labels; do not infer circuit function.
cpus.push(...expanded.cpus);
regions.push(...expanded.regions);
targets.push(...expanded.targets);
