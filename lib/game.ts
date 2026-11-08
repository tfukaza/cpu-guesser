import catalogData from "../data/catalog.json";

export type Point = { x: number; y: number };
export type Source = {
  title: string;
  url: string;
  kind?: "article" | "video" | "documentation";
};
export type Cpu = {
  id: string;
  chipType?: "cpu" | "soc" | "gpu";
  name: string;
  maker: string;
  year: number;
  revision: string;
  widthMm: number;
  heightMm: number;
  dimensionsSource: Source;
  dimensionsNote: string;
  width: number;
  height: number;
  tileSource: string;
  thumbnail: string;
  photographer: string;
  source: Source;
  license: string;
  licenseUrl: string;
  modifications: string;
  resources: Source[];
  annotationMethod?: "model-visual-estimate";
  reviewNote?: string;
  yearNote?: string;
  yearSource?: Source;
  attribution?: string;
};
export type Region = {
  id: string;
  cpuId: string;
  name: string;
  polygon: Point[];
  explanation: string;
  source: Source;
  kind: "compute" | "register" | "control" | "unclassified";
  annotationMethod?: "model-visual-estimate";
  confidence?: "low" | "medium" | "high";
  confidenceNote?: string;
};
export type Question = {
  id: string;
  cpuId: string;
  regionId: string | null;
  target: Point;
  neighborhood: { left: number; top: number; width: number; height: number };
  tileSource: string;
  width: number;
  height: number;
  procedural?: boolean;
};
export type Catalog = {
  version: number;
  cpus: Cpu[];
  regions: Region[];
  questions: Question[];
};
export type Guess = { cpuId: string; point: Point };
export type ScoreBreakdown = {
  manufacturer: number;
  year: number;
  cpu: number;
  location: number;
};
export type RoundResult = {
  questionId: string;
  guess: Guess;
  score: number;
  breakdown: ScoreBreakdown;
  distanceMm: number | null;
  correctCpu: boolean;
  correctRegion: boolean;
};
export type Session = {
  version: number;
  questionIds: string[];
  // Persist the generated crops so reloads never reroll an expedition.
  questions?: Question[];
  startedAt?: number | null;
  finishedAt?: number | null;
  index: number;
  results: RoundResult[];
  guess: Guess | null;
  phase: "playing" | "reveal" | "complete";
};

// Chronology is shared on X; companies reuse vertical space after their
// photographed collection ends. These spans do not claim corporate lifetimes.
export const YEAR_SPACING = 12;
export const YEAR_START = Math.min(...catalogData.cpus.map(cpu => cpu.year));
export const YEAR_END = Math.max(...catalogData.cpus.map(cpu => cpu.year));
const COMPANY_COLORS: Record<string, string> = {
  Intel: "#49a9ee", AMD: "#ed665c", NVIDIA: "#9bce42", Apple: "#d0d4dd",
  Motorola: "#65b8db", "MOS Technology": "#bb8ce0", Zilog: "#ef8292",
  HP: "#60bfe8", IBM: "#7198ee", DEC: "#df7199", Sun: "#b394ed",
  MIPS: "#f7ac61", IDT: "#e9c368", NEC: "#91a4ed", NexGen: "#dc9b6d",
  Freescale: "#eea252", "Commodore (CSG)": "#72c6c2",
  "WDC / Rockwell": "#b9bc7c", "Centaur / VIA": "#8fcda5",
};
export function makerColor(maker: string) {
  return COMPANY_COLORS[maker] ?? COMPANY_COLORS[maker.split(" / ")[0]] ?? "#b6a6c9";
}
type AtlasCpu = Pick<Cpu, "id" | "year" | "maker" | "widthMm" | "heightMm">;
export function layoutAtlas(cpus: AtlasCpu[], yearStart: number) {
  const positions = new Map<string, {x:number;y:number;width:number;height:number}>();
  const groups = [...new Set(cpus.map(c => c.maker))].map(maker => {
    const members = cpus.filter(c => c.maker === maker).sort((a,b) => a.year-b.year || a.id.localeCompare(b.id));
    const rows: {end:number;height:number;cpus:{cpu:AtlasCpu;x:number}[]}[] = [];
    for (const cpu of members) {
      const x = (cpu.year-yearStart)*YEAR_SPACING-cpu.widthMm/2;
      let row = rows.find(r => r.end + 2 < x);
      if (!row) { row = {end:0,height:0,cpus:[]}; rows.push(row); }
      row.end = x+cpu.widthMm;
      row.height = Math.max(row.height,cpu.heightMm);
      row.cpus.push({cpu,x});
    }
    return {maker, members, rows,
      left:Math.min(...members.map(c => (c.year-yearStart)*YEAR_SPACING-c.widthMm/2))-3,
      right:Math.max(...members.map(c => (c.year-yearStart)*YEAR_SPACING+c.widthMm/2))+3,
      height:rows.reduce((sum,r) => sum+r.height+3,0)+5,
    };
  }).sort((a,b) => a.left-b.left || b.height-a.height || a.maker.localeCompare(b.maker));
  const timelines: {maker:string;color:string;startX:number;endX:number;y:number;top:number;height:number;firstYear:number;lastYear:number}[] = [];
  for (const group of groups) {
    // A company reserves space only within its own recorded date interval.
    const candidates = [0,...timelines.map(t => t.top+t.height+3)].sort((a,b)=>a-b);
    const top = candidates.find(y => timelines.every(t =>
      group.right <= t.startX || group.left >= t.endX ||
      y+group.height+3 <= t.top || y >= t.top+t.height+3,
    ))!;
    let rowTop=top+5;
    for (const row of group.rows) {
      for (const {cpu,x} of row.cpus) positions.set(cpu.id, {
        x,y:rowTop+(row.height-cpu.heightMm)/2,width:cpu.widthMm,height:cpu.heightMm,
      });
      rowTop+=row.height+3;
    }
    timelines.push({maker:group.maker,color:makerColor(group.maker),
      startX:group.left,endX:group.right,y:top+1,top,height:group.height,
      firstYear:group.members[0].year,lastYear:group.members.at(-1)!.year,
    });
  }
  const left=Math.min(...timelines.map(t=>t.startX))-4;
  // Pixel-sized year labels need breathing room at the overview zoom.
  const top=Math.min(...timelines.map(t=>t.top))-30;
  return {positions,timelines,bounds:{x:left,y:top,
    width:Math.max(...timelines.map(t=>t.endX))-left+4,
    height:Math.max(...timelines.map(t=>t.top+t.height))-top+5,
  }};
}
const atlasLayout = layoutAtlas(catalogData.cpus, YEAR_START);
export const MAKER_TIMELINES = atlasLayout.timelines;
export const MAKERS = MAKER_TIMELINES.map(t=>t.maker);
// Kept for callers needing a maker's timeline anchor, rather than a fixed lane.
export const MAKER_Y = Object.fromEntries(MAKER_TIMELINES.map(t=>[t.maker,t.y]));
export const ATLAS_BOUNDS = atlasLayout.bounds;
export function cpuPlacement(cpu: Pick<Cpu, "year" | "maker" | "widthMm" | "heightMm"> & {id?:string}) {
  const position = cpu.id ? atlasLayout.positions.get(cpu.id) : undefined;
  return position ?? {
    x:(cpu.year-YEAR_START)*YEAR_SPACING-cpu.widthMm/2,
    y:(MAKER_Y[cpu.maker] ?? 0)+5,
    width:cpu.widthMm,height:cpu.heightMm,
  };
}
export function dieToWorld(cpu: Cpu, point: Point): Point {
  const p = cpuPlacement(cpu);
  return { x: p.x + point.x * p.width, y: p.y + point.y * p.height };
}
export function atlasDistanceMm(
  question: Question,
  guess: Guess,
  catalog: Catalog,
): number {
  const answerCpu = catalog.cpus.find((cpu) => cpu.id === question.cpuId)!;
  const guessedCpu = catalog.cpus.find((cpu) => cpu.id === guess.cpuId)!;
  const answer = dieToWorld(answerCpu, question.target);
  const pin = dieToWorld(guessedCpu, guess.point);
  return Math.hypot(pin.x - answer.x, pin.y - answer.y);
}
export function formatDistance(mm: number): string {
  return mm < 1 ? `${Math.round(mm * 1000)} µm` : `${mm.toFixed(2)} mm`;
}
export function resultViewport(
  question: Question,
  guess: Guess,
  catalog: Catalog,
) {
  const answerCpu = catalog.cpus.find((cpu) => cpu.id === question.cpuId)!;
  const guessedCpu = catalog.cpus.find((cpu) => cpu.id === guess.cpuId)!;
  const answer = dieToWorld(answerCpu, question.target);
  const pin = dieToWorld(guessedCpu, guess.point);
  if (answerCpu.id === guessedCpu.id) {
    const width = Math.max(
      Math.abs(pin.x - answer.x) * 1.8,
      answerCpu.widthMm * 0.2,
    );
    const height = Math.max(
      Math.abs(pin.y - answer.y) * 1.8,
      answerCpu.heightMm * 0.2,
    );
    return {
      x: (pin.x + answer.x) / 2 - width / 2,
      y: (pin.y + answer.y) / 2 - height / 2,
      width,
      height,
    };
  }
  const a = cpuPlacement(answerCpu),
    g = cpuPlacement(guessedCpu);
  const rawLeft = Math.min(a.x, g.x), rawTop = Math.min(a.y, g.y);
  const rawWidth = Math.max(a.x + a.width, g.x + g.width)-rawLeft;
  const rawHeight = Math.max(a.y + a.height, g.y + g.height)-rawTop;
  // Pin markers occupy screen pixels; a fixed world margin vanishes on a large atlas.
  const padX = Math.max(1.2, rawWidth*0.08), padY = Math.max(1.2, rawHeight*0.08);
  return {
    x:rawLeft-padX, y:rawTop-padY,
    width:rawWidth+2*padX, height:rawHeight+2*padY,
  };
}
export function worldToGuess(cpus: Cpu[], point: Point): Guess | null {
  for (const cpu of cpus) {
    const p = cpuPlacement(cpu);
    if (
      point.x >= p.x &&
      point.x <= p.x + p.width &&
      point.y >= p.y &&
      point.y <= p.y + p.height
    )
      return {
        cpuId: cpu.id,
        point: { x: (point.x - p.x) / p.width, y: (point.y - p.y) / p.height },
      };
  }
  return null;
}
export function inPolygon(point: Point, polygon: Point[]) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i],
      b = polygon[j];
    if (
      a.y > point.y !== b.y > point.y &&
      point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x
    )
      inside = !inside;
  }
  return inside;
}
export function scoreGuess(
  question: Question,
  guess: Guess,
  catalog: Catalog,
): RoundResult {
  const cpu = catalog.cpus.find((c) => c.id === question.cpuId)!;
  const guessedCpu = catalog.cpus.find((c) => c.id === guess.cpuId)!;
  const region = catalog.regions.find((r) => r.id === question.regionId);
  const correctCpu = guess.cpuId === cpu.id;
  const distanceMm = correctCpu
    ? Math.hypot(
        (guess.point.x - question.target.x) * cpu.widthMm,
        (guess.point.y - question.target.y) * cpu.heightMm,
      )
    : null;
  const relative =
    distanceMm === null
      ? Infinity
      : distanceMm / Math.hypot(cpu.widthMm, cpu.heightMm);
  const yearGap = Math.abs(guessedCpu.year - cpu.year);
  const guessedMakers = guessedCpu.maker.split("/").map((name) => name.trim().toLowerCase());
  const sameManufacturer = cpu.maker.split("/").some((name) =>
    guessedMakers.includes(name.trim().toLowerCase()),
  );
  const breakdown: ScoreBreakdown = {
    manufacturer: sameManufacturer ? 1000 : 0,
    // Smooth credit in either direction: half remains after four years.
    year: Math.round(1000 * 2 ** (-yearGap / 4)),
    cpu: correctCpu ? 1000 : 0,
    location: correctCpu
      ? relative <= 0.005
        ? 2000
        : Math.round(2000 * Math.max(0, 1 - relative / 0.25))
      : 0,
  };
  const score = Object.values(breakdown).reduce((sum, points) => sum + points, 0);
  return {
    questionId: question.id,
    guess,
    score,
    breakdown,
    distanceMm,
    correctCpu,
    correctRegion: correctCpu && !!region && inPolygon(guess.point, region.polygon),
  };
}
function questionFromCrop(
  catalog: Catalog,
  cpu: Cpu,
  index: number,
  neighborhood: Question["neighborhood"],
): Question {
  const { left, top, width, height } = neighborhood;
  const target = { x: (left + width / 2) / cpu.width, y: (top + height / 2) / cpu.height };
  const region = catalog.regions.find((r) => r.cpuId === cpu.id && inPolygon(target, r.polygon));
  return {
    id: `random-${index}-${cpu.id}-${left}-${top}-${width}`,
    cpuId: cpu.id,
    regionId: region?.id ?? null,
    target,
    neighborhood,
    tileSource: cpu.tileSource,
    width,
    height,
    procedural: true,
  };
}

export function generateQuestion(catalog: Catalog, cpu: Cpu, index: number, random = Math.random): Question {
  const shortSide = Math.min(cpu.width, cpu.height);
  const side = Math.round(shortSide * (0.16 + random() * 0.12));
  // Keep the whole crop away from outer photo edges and wire bonds.
  const margin = Math.round(shortSide * 0.04);
  const left = margin + Math.floor(random() * (cpu.width - side - margin * 2 + 1));
  const top = margin + Math.floor(random() * (cpu.height - side - margin * 2 + 1));
  return questionFromCrop(catalog, cpu, index, { left, top, width: side, height: side });
}

export function sessionQuestions(session: Session, catalog: Catalog): Question[] {
  return session.questions ?? session.questionIds.map((id) => catalog.questions.find((q) => q.id === id)!);
}

export function newSession(catalog: Catalog, random = Math.random): Session {
  const cpus = [...catalog.cpus];
  for (let i = cpus.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [cpus[i], cpus[j]] = [cpus[j], cpus[i]];
  }
  const questions = cpus.slice(0, 5).map((cpu, i) => generateQuestion(catalog, cpu, i, random));
  return {
    version: catalog.version,
    questionIds: questions.map((q) => q.id),
    questions,
    startedAt: null,
    finishedAt: null,
    index: 0,
    results: [],
    guess: null,
    phase: "playing",
  };
}
export function totalScore(session: Session) {
  return session.results.reduce((sum, r) => sum + r.score, 0);
}
export function elapsedMs(session: Session): number | null {
  return session.startedAt != null && session.finishedAt != null
    ? Math.max(0, session.finishedAt - session.startedAt)
    : null;
}
export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms));
  const hours = Math.floor(total / 3600000);
  const minutes = Math.floor(total / 60000) % 60;
  const seconds = Math.floor(total / 1000) % 60;
  const pad = (n: number, length = 2) => String(n).padStart(length, "0");
  return `${hours ? `${hours}:` : ""}${pad(minutes)}:${pad(seconds)}.${pad(total % 1000, 3)}`;
}
export function formatShareResult(session: Session): string {
  const rows = session.results.map(({ score }) => {
    const filled = Math.floor(score / 1000);
    const partial = score % 1000 > 0 ? 1 : 0;
    return `${"🟩".repeat(filled)}${"🟨".repeat(partial)}${"⬜".repeat(5 - filled - partial)} ${score.toLocaleString("en-US")}`;
  });
  return [
    "CPU Guesser 🧠",
    `🏆 ${totalScore(session).toLocaleString("en-US")} / 25,000`,
    ...(elapsedMs(session) === null ? [] : [`⏱ ${formatDuration(elapsedMs(session)!)}`]),
    "",
    ...rows,
  ].join("\n");
}
export function parseSession(
  value: string | null,
  catalog: Catalog,
): Session | null {
  try {
    if (!value) return null;
    const s = JSON.parse(value) as Session;
    if (
      s.version !== catalog.version ||
      !Array.isArray(s.questionIds) ||
      s.questionIds.length !== 5 ||
      new Set(s.questionIds).size !== 5 ||
      !Number.isInteger(s.index) ||
      s.index < 0 ||
      s.index > 4 ||
      !["playing", "reveal", "complete"].includes(s.phase) ||
      !Array.isArray(s.results)
    )
      return null;
    if (s.questions !== undefined) {
      if (!Array.isArray(s.questions) || s.questions.length !== 5) return null;
      const questions: Question[] = [];
      for (const [i, raw] of s.questions.entries()) {
        const cpu = catalog.cpus.find((c) => c.id === raw.cpuId);
        const n = raw.neighborhood;
        if (!cpu || !cpu.tileSource || !n ||
          ![n.left, n.top, n.width, n.height].every(Number.isInteger) ||
          n.left < 0 || n.top < 0 || n.width !== n.height ||
          n.width < Math.min(cpu.width, cpu.height) * 0.1 ||
          n.width > Math.min(cpu.width, cpu.height) * 0.35 ||
          n.left + n.width > cpu.width || n.top + n.height > cpu.height) return null;
        const q = questionFromCrop(catalog, cpu, i, n);
        if (raw.id !== q.id || s.questionIds[i] !== q.id) return null;
        questions.push(q);
      }
      s.questions = questions;
    } else if (!s.questionIds.every((id) => catalog.questions.some((q) => q.id === id))) return null;
    for (const time of [s.startedAt, s.finishedAt])
      if (time != null && (!Number.isSafeInteger(time) || time < 0)) return null;
    if (s.finishedAt != null && (s.startedAt == null || s.finishedAt < s.startedAt ||
      (s.phase !== "complete" && !(s.phase === "reveal" && s.index === 4)))) return null;
    const validGuess = (g: Guess | null) =>
      g === null ||
      (catalog.cpus.some((c) => c.id === g.cpuId) &&
        Number.isFinite(g.point?.x) &&
        Number.isFinite(g.point?.y) &&
        g.point.x >= 0 &&
        g.point.x <= 1 &&
        g.point.y >= 0 &&
        g.point.y <= 1);
    if (!validGuess(s.guess)) return null;
    const count =
      s.phase === "playing" ? s.index : s.phase === "reveal" ? s.index + 1 : 5;
    if (s.results.length !== count || (s.phase === "complete" && s.index !== 4))
      return null;
    for (let i = 0; i < s.results.length; i++)
      if (
        s.results[i].questionId !== s.questionIds[i] ||
        !s.results[i].guess ||
        !validGuess(s.results[i].guess)
      )
        return null;
    // Recompute scores instead of trusting stale persisted totals.
    s.results = s.results.map((r) =>
      scoreGuess(
        sessionQuestions(s, catalog).find((q) => q.id === r.questionId)!,
        r.guess,
        catalog,
      ),
    );
    return s;
  } catch {
    return null;
  }
}
