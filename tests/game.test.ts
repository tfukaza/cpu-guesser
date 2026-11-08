import test from "node:test";
import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";
import sharp from "sharp";
import catalogJson from "../data/catalog.json";
import {
  cpuPlacement,
  YEAR_START,
  YEAR_SPACING,
  MAKER_TIMELINES,
  layoutAtlas,
  ATLAS_BOUNDS,
  dieToWorld,
  atlasDistanceMm,
  resultViewport,
  formatShareResult,
  worldToGuess,
  newSession,
  sessionQuestions,
  generateQuestion,
  elapsedMs,
  formatDuration,
  scoreGuess,
  parseSession,
  inPolygon,
  type Catalog,
} from "../lib/game";
const catalog = catalogJson as Catalog;

test("all dies use millimeter world units and timeline centers", () => {
  for (const c of catalog.cpus) {
    const p = cpuPlacement(c);
    assert.equal(p.width, c.widthMm);
    assert.equal(p.height, c.heightMm);
    assert.equal(p.x + p.width / 2, (c.year - YEAR_START) * YEAR_SPACING);
  }
  const motorola = catalog.cpus.filter((c) => c.maker === "Motorola");
  assert.equal(
    cpuPlacement(motorola[0]).y + motorola[0].heightMm / 2,
    cpuPlacement(motorola[1]).y + motorola[1].heightMm / 2,
  );
  const z = catalog.cpus.find((c) => c.name === "Z80")!,
    m = catalog.cpus.find((c) => c.name === "68000")!;
  assert.equal(cpuPlacement(m).width / cpuPlacement(z).width, 7.14 / 3.545);
});
test("normalized locations round trip on every die and empty atlas space rejects pins", () => {
  for (const cpu of catalog.cpus)
    for (const point of [
      { x: 0.1, y: 0.2 },
      { x: 0.5, y: 0.5 },
      { x: 0.99, y: 0.98 },
    ]) {
      const guess = worldToGuess(catalog.cpus, dieToWorld(cpu, point));
      assert.equal(guess?.cpuId, cpu.id);
      assert.ok(Math.abs(guess!.point.x - point.x) < 1e-10);
      assert.ok(Math.abs(guess!.point.y - point.y) < 1e-10);
    }
  assert.equal(worldToGuess(catalog.cpus, { x: -100, y: 100 }), null);
});
test("score distinguishes CPU, exact target, tolerance, distant locations, and wrong die", () => {
  const q = catalog.questions[0],
    cpu = catalog.cpus.find((c) => c.id === q.cpuId)!;
  assert.equal(
    scoreGuess(q, { cpuId: q.cpuId, point: q.target }, catalog).score,
    5000,
  );
  const diag = Math.hypot(cpu.widthMm, cpu.heightMm);
  assert.equal(
    scoreGuess(
      q,
      {
        cpuId: q.cpuId,
        point: { x: q.target.x + (0.004 * diag) / cpu.widthMm, y: q.target.y },
      },
      catalog,
    ).score,
    5000,
  );
  assert.equal(
    scoreGuess(
      q,
      { cpuId: q.cpuId, point: { x: q.target.x - 0.5, y: q.target.y } },
      catalog,
    ).score,
    3000,
  );
  const wrongCpu = catalog.cpus.find((c) => c.id !== q.cpuId)!;
  const wrong = scoreGuess(q, { cpuId: wrongCpu.id, point: q.target }, catalog);
  assert.ok(wrong.score > 0);
  assert.equal(wrong.breakdown.cpu, 0);
  assert.equal(wrong.breakdown.location, 0);
  const mid = scoreGuess(
    q,
    {
      cpuId: q.cpuId,
      point: { x: q.target.x + (0.125 * diag) / cpu.widthMm, y: q.target.y },
    },
    catalog,
  );
  assert.equal(mid.score, 4000);
});
test("sessions contain five unique targets and reload data is validated and rescored", () => {
  const s = newSession(catalog, () => 0.5);
  assert.equal(s.questionIds.length, 5);
  assert.equal(new Set(s.questionIds).size, 5);
  assert.deepEqual(parseSession(JSON.stringify(s), catalog), s);
  const q = sessionQuestions(s, catalog)[0];
  const guess = { cpuId: q.cpuId, point: q.target };
  s.results = [{ ...scoreGuess(q, guess, catalog), score: 999999 }];
  s.phase = "reveal";
  s.guess = guess;
  assert.equal(
    parseSession(JSON.stringify(s), catalog)?.results[0].score,
    5000,
  );
  assert.equal(parseSession("{bad", catalog), null);
  assert.equal(
    parseSession(JSON.stringify({ ...s, version: -1 }), catalog),
    null,
  );
  assert.equal(
    parseSession(JSON.stringify({ ...s, index: 20 }), catalog),
    null,
  );
  assert.equal(
    parseSession(
      JSON.stringify({
        ...s,
        guess: { cpuId: q.cpuId, point: { x: 99, y: 0 } },
      }),
      catalog,
    ),
    null,
  );
});
test("all questions have credited sources, valid region interiors, bounded neighborhoods, and complete tile pyramids", async () => {
  assert.ok(catalog.cpus.length >= 60);
  assert.ok(catalog.questions.length >= 250);
  for (const cpu of catalog.cpus) {
    assert.ok(
      cpu.photographer &&
        cpu.licenseUrl &&
        cpu.dimensionsSource.url &&
        cpu.resources.length,
    );
    assert.ok(cpu.width >= 1600 && cpu.height >= 1600);
    assert.ok(catalog.regions.filter((r) => r.cpuId === cpu.id).length >= 3);
    assert.ok(catalog.questions.filter((q) => q.cpuId === cpu.id).length >= 3);
  }
  for (const q of catalog.questions) {
    const cpu = catalog.cpus.find((c) => c.id === q.cpuId)!,
      region = catalog.regions.find((r) => r.id === q.regionId)!;
    assert.equal(region.cpuId, q.cpuId);
    assert.ok(inPolygon(q.target, region.polygon));
    assert.ok(region.source.url);
    const n = q.neighborhood;
    assert.ok(
      n.left >= 0 &&
        n.top >= 0 &&
        n.left + n.width <= cpu.width &&
        n.top + n.height <= cpu.height,
    );
    assert.ok(
      Math.abs(q.target.x - (n.left + n.width / 2) / cpu.width) < 1e-10,
    );
    const dzi = await readFile(`public${q.tileSource}`, "utf8");
    assert.match(dzi, /TileSize="512"/);
    assert.match(dzi, /Overlap="1"/);
    const max = Math.ceil(Math.log2(Math.max(q.width, q.height)));
    const stem = `public${q.tileSource.replace(".dzi", "_files")}`;
    await access(`${stem}/${max}/0_0.jpeg`);
    await access(`${stem}/0/0_0.jpeg`);
  }
});
test("photographic tile pixels are grayscale", async () => {
  for (const q of catalog.questions) {
    const max = Math.ceil(Math.log2(q.width));
    const path = `public${q.tileSource.replace(".dzi", "_files")}/${max}/0_0.jpeg`;
    const { data, info } = await sharp(path)
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    if (info.channels === 1) continue;
    assert.equal(info.channels, 3);
    for (let i = 0; i < data.length; i += 3) {
      assert.equal(data[i], data[i + 1]);
      assert.equal(data[i], data[i + 2]);
    }
  }
});

test("result distance is available on the same die and across the timeline atlas", () => {
  const question = {
    ...catalog.questions.find((q) => q.cpuId === "intel_8008")!,
    target: { x: 0.5, y: 0.5 },
  };
  assert.equal(
    atlasDistanceMm(
      question,
      { cpuId: "intel_8008", point: { x: 0.5, y: 0.5 } },
      catalog,
    ),
    0,
  );
  assert.equal(
    atlasDistanceMm(
      question,
      { cpuId: "moto_6800", point: { x: 0.5, y: 0.5 } },
      catalog,
    ),
    (() => {
      const a=dieToWorld(catalog.cpus.find(c=>c.id==='intel_8008')!,{x:0.5,y:0.5});
      const b=dieToWorld(catalog.cpus.find(c=>c.id==='moto_6800')!,{x:0.5,y:0.5});
      return Math.hypot(a.x-b.x,a.y-b.y);
    })(),
  );
});

test("result framing contains both pins for close, coincident, and cross-CPU guesses", () => {
  const q = catalog.questions[0];
  for (const guess of [
    { cpuId: q.cpuId, point: q.target },
    { cpuId: q.cpuId, point: { x: 0.05, y: 0.05 } },
    { cpuId: "moto_68000", point: { x: 0.9, y: 0.9 } },
  ]) {
    const frame = resultViewport(q, guess, catalog);
    assert.ok(frame.width > 0 && frame.height > 0);
    const a = dieToWorld(catalog.cpus.find((c) => c.id === q.cpuId)!, q.target),
      g = dieToWorld(
        catalog.cpus.find((c) => c.id === guess.cpuId)!,
        guess.point,
      );
    for (const p of [a, g]) {
      assert.ok(p.x > frame.x && p.x < frame.x + frame.width);
      assert.ok(p.y > frame.y && p.y < frame.y + frame.height);
    }
  }
});

test("share results contain a spoiler-free five-round emoji scorecard", () => {
  const session = newSession(catalog);
  const q = catalog.questions[0];
  const base = scoreGuess(q, { cpuId: q.cpuId, point: q.target }, catalog);
  session.results = [5000, 4500, 3000, 1000, 0].map((score) => ({
    ...base,
    score,
  }));
  session.phase = "complete";
  assert.equal(
    formatShareResult(session),
    [
      "CPU Guesser 🧠",
      "🏆 13,500 / 25,000",
      "",
      "🟩🟩🟩🟩🟩 5,000",
      "🟩🟩🟩🟩🟨 4,500",
      "🟩🟩🟩⬜⬜ 3,000",
      "🟩⬜⬜⬜⬜ 1,000",
      "⬜⬜⬜⬜⬜ 0",
    ].join("\n"),
  );
  for (const cpu of catalog.cpus)
    assert.ok(!formatShareResult(session).includes(cpu.name));
});

test("expanded atlas contains every die with separate hitboxes for contemporary variants", () => {
  assert.ok(catalog.cpus.some(c => c.maker === "AMD"));
  assert.ok(catalog.cpus.some(c => c.year >= 2024));
  const positions = catalog.cpus.map(c => ({id:c.id,...cpuPlacement(c)}));
  for (const a of positions) {
    assert.ok(a.x >= ATLAS_BOUNDS.x && a.y >= ATLAS_BOUNDS.y, a.id);
    assert.ok(a.x+a.width <= ATLAS_BOUNDS.x+ATLAS_BOUNDS.width, a.id);
    assert.ok(a.y+a.height <= ATLAS_BOUNDS.y+ATLAS_BOUNDS.height, a.id);
    for (const b of positions.filter(b => b.id > a.id)) {
      assert.ok(a.x+a.width <= b.x || b.x+b.width <= a.x || a.y+a.height <= b.y || b.y+b.height <= a.y, `${a.id} overlaps ${b.id}`);
    }
  }
});

test("company spans reuse space after earlier collections end without colliding", () => {
  const chip=(id:string,maker:string,year:number) => ({id,maker,year,widthMm:8,heightMm:6});
  const result=layoutAtlas([
    chip('early','Earlier',1980),chip('early-last','Earlier',1984),
    chip('overlap','Contemporary',1982),chip('later','Later',2000),
  ],1980);
  const earlier=result.timelines.find(t=>t.maker==='Earlier')!;
  const later=result.timelines.find(t=>t.maker==='Later')!;
  const contemporary=result.timelines.find(t=>t.maker==='Contemporary')!;
  assert.equal(earlier.top,later.top);
  assert.notEqual(earlier.top,contemporary.top);
  for(const t of MAKER_TIMELINES) {
    assert.match(t.color,/^#[0-9a-f]{6}$/i);
    assert.equal(t.firstYear,Math.min(...catalog.cpus.filter(c=>c.maker===t.maker).map(c=>c.year)));
    assert.equal(t.lastYear,Math.max(...catalog.cpus.filter(c=>c.maker===t.maker).map(c=>c.year)));
  }
  // The previous global largest-die spacing created a mostly empty rectangle.
  const oldYearSpacing=Math.max(6,...catalog.cpus.map(c=>c.widthMm+4));
  const oldLaneSpacing=Math.max(9,...catalog.cpus.map(c=>c.heightMm+4));
  const oldMinimumArea=(Math.max(...catalog.cpus.map(c=>c.year))-YEAR_START)*oldYearSpacing*MAKER_TIMELINES.length*oldLaneSpacing;
  assert.ok(ATLAS_BOUNDS.width*ATLAS_BOUNDS.height < oldMinimumArea*0.6);
});

test("visual annotations disclose uncertainty and every reference retains primary credits", async () => {
  const ids = catalog.cpus.map(c => c.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(new Set(catalog.questions.map(q=>q.id)).size,catalog.questions.length);
  for (const r of catalog.regions.filter(r => r.annotationMethod)) {
    assert.equal(r.kind,"unclassified");
    assert.ok(["low","medium","high"].includes(r.confidence!));
    assert.match(r.explanation,/unverified|unknown|not.*(?:identif|verif)|no.*function/i);
    assert.ok(r.polygon.length >= 3);
    assert.ok(r.polygon.every(p => Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.x>=0&&p.x<=1&&p.y>=0&&p.y<=1));
  }
  const library = JSON.parse(await readFile("data/cpu-library.json","utf8"));
  assert.ok(library.entries.length >= 250);
  assert.equal(new Set(library.entries.map((c: {id:string})=>c.id)).size,library.entries.length);
  for (const c of library.entries) {
    assert.ok(c.photo.creator && /^https:\/\/(commons\.wikimedia\.org\/wiki\/File:|www\.flickr\.com\/photos\/)/.test(c.photo.sourceUrl));
    assert.match(c.photo.license,/CC BY|CC0|Public domain/);
    assert.ok(c.photo.licenseUrl && c.verifiedAt && c.labelNote);
    assert.equal(c.status,ids.includes(c.id)?"playable":"reference");
  }
});


test("manufacturer and year independently earn partial credit on the wrong CPU", () => {
  const q = catalog.questions[0];
  const cpu = catalog.cpus.find(c => c.id === q.cpuId)!;
  const score = (maker: string, gap: number) => {
    const candidate = {...cpu, id:"scoring-test-cpu", maker, year:cpu.year + gap};
    return scoreGuess(q, {cpuId:candidate.id, point:q.target}, {...catalog, cpus:[cpu,candidate]});
  };
  assert.equal(score(cpu.maker, 0).score, 2000);
  assert.equal(score("Different manufacturer", 0).score, 1000);
  assert.equal(score(cpu.maker, 4).score, 1500);
  assert.equal(score("Different manufacturer", 4).score, 500);
  assert.equal(score(cpu.maker, 100).score, 1000);
  const expected = [1000,841,707,595,500,420,354,297,250];
  for (let years=0; years<expected.length; years++) {
    const early = score("Different manufacturer", -years);
    const late = score("Different manufacturer", years);
    assert.equal(late.breakdown.year, expected[years]);
    assert.equal(early.breakdown.year, late.breakdown.year);
    assert.equal(late.score, expected[years]);
    if(years>0) assert.ok(late.score < score("Different manufacturer", years-1).score);
  }
  assert.deepEqual(score(cpu.maker,0).breakdown, {manufacturer:1000, year:1000, cpu:0, location:0});
  for(const [actualMaker,guessMaker,expected] of [["AMD","AMD / Microsoft",1000],["MIPS / IDT","IDT",1000],["Intel","Intergraph",0]] as const) {
    const actual = {...cpu,maker:actualMaker};
    const candidate = {...cpu,id:"joint-maker-test",maker:guessMaker};
    const scored = scoreGuess(q,{cpuId:candidate.id,point:q.target},{...catalog,cpus:[actual,candidate]});
    assert.equal(scored.breakdown.manufacturer,expected);
  }

});

test("saved guesses are rescored with manufacturer and year credits", () => {
  const session = newSession(catalog);
  const q = sessionQuestions(session, catalog)[0];
  const answer = catalog.cpus.find(c => c.id === q.cpuId)!;
  const cpu = catalog.cpus.find(c => c.id !== q.cpuId && c.maker === answer.maker) ?? answer;
  const guess = {cpuId:cpu.id, point:{x:.5,y:.5}};
  session.guess = guess;
  session.phase = "reveal";
  session.results = [{...scoreGuess(q,guess,catalog),score:0}];
  const restored = parseSession(JSON.stringify(session),catalog)!;
  assert.ok(restored.results[0].score > 0);
  assert.equal(restored.results[0].score, scoreGuess(q,guess,catalog).score);
  assert.equal(restored.results[0].score, Object.values(restored.results[0].breakdown).reduce((a,b)=>a+b,0));
});

test("procedural sessions need no presets, choose distinct CPUs, and preserve crops on reload", () => {
  const noPresets = { ...catalog, questions: [] };
  const session = newSession(noPresets);
  assert.equal(session.questions?.length, 5);
  assert.equal(new Set(session.questions!.map(q => q.cpuId)).size, 5);
  assert.deepEqual(parseSession(JSON.stringify(session), noPresets), session);
  for (const cpu of catalog.cpus) {
    for (const r of [0, 0.5, 0.999999]) {
      const q = generateQuestion(noPresets, cpu, 0, () => r);
      const n = q.neighborhood;
      assert.equal(q.tileSource, cpu.tileSource);
      assert.ok(q.procedural);
      assert.ok(n.left >= 0 && n.top >= 0 && n.left + n.width <= cpu.width && n.top + n.height <= cpu.height);
      assert.equal(q.target.x, (n.left + n.width / 2) / cpu.width);
      assert.equal(q.target.y, (n.top + n.height / 2) / cpu.height);
      if (q.regionId) assert.ok(inPolygon(q.target, catalog.regions.find(r => r.id === q.regionId)!.polygon));
      assert.equal(scoreGuess(q, {cpuId:cpu.id, point:q.target}, noPresets).score, 5000);
    }
  }
  const tampered = structuredClone(session);
  tampered.questions![0].neighborhood.left = -1;
  assert.equal(parseSession(JSON.stringify(tampered), catalog), null);
  const untrusted = structuredClone(session);
  untrusted.questions![0].tileSource = "https://example.com/untrusted.dzi";
  untrusted.questions![0].target = {x:0,y:0};
  const restored = parseSession(JSON.stringify(untrusted), catalog)!;
  assert.deepEqual(restored.questions, session.questions);
  assert.notDeepEqual(newSession(noPresets).questions, session.questions);
});

test("legacy preset sessions still resume with their original questions", () => {
  const session = newSession(catalog);
  delete session.questions;
  session.questionIds = catalog.questions.slice(0,5).map(q => q.id);
  assert.deepEqual(parseSession(JSON.stringify(session), catalog), session);
});

test("elapsed time retains milliseconds, survives reload, and resets for a new game", () => {
  assert.equal(formatDuration(0), "00:00.000");
  assert.equal(formatDuration(83407), "01:23.407");
  assert.equal(formatDuration(3600001), "1:00:00.001");
  const s = newSession(catalog);
  assert.equal(elapsedMs(s), null);
  s.startedAt = 100000;
  assert.equal(elapsedMs(s), null);
  s.finishedAt = 183407;
  s.index = 4;
  s.phase = "complete";
  s.results = s.questions!.map(q => scoreGuess(q, {cpuId:q.cpuId,point:q.target}, catalog));
  assert.equal(elapsedMs(parseSession(JSON.stringify(s), catalog)!), 83407);
  assert.ok(formatShareResult(s).includes("⏱ 01:23.407"));
  assert.equal(parseSession(JSON.stringify({...s,finishedAt:99999}), catalog), null);
  assert.equal(elapsedMs(newSession(catalog)), null);
});

test("every full-die pyramid exists at original scale and is grayscale", async () => {
  for (const cpu of catalog.cpus) {
    assert.ok(cpu.tileSource);
    const dzi = await readFile(`public${cpu.tileSource}`, "utf8");
    assert.match(dzi, new RegExp(`Width="${cpu.width}"`));
    assert.match(dzi, new RegExp(`Height="${cpu.height}"`));
    const max = Math.ceil(Math.log2(Math.max(cpu.width,cpu.height)));
    const stem = `public${cpu.tileSource.replace(".dzi", "_files")}`;
    await access(`${stem}/0/0_0.jpeg`);
    const {data,info} = await sharp(`${stem}/${max}/0_0.jpeg`).removeAlpha().raw().toBuffer({resolveWithObject:true});
    if(info.channels === 1) continue;
    for(let i=0;i<data.length;i+=3) {
      assert.equal(data[i],data[i+1]);
      assert.equal(data[i],data[i+2]);
    }
  }
});
