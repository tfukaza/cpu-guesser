import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import type { Catalog } from "../../lib/game";
const catalog = JSON.parse(
  readFileSync(new URL("../../data/catalog.json", import.meta.url), "utf8"),
) as Catalog;
async function ready(page: Page) {
  await expect(page.locator(".mystery-viewer")).toHaveAttribute(
    "data-status",
    "ready",
  );
  await expect(page.locator(".atlas-card .atlas-viewer")).toHaveAttribute(
    "data-status",
    "ready",
  );
}
async function place(page: Page, cpuId: string, point = { x: 0.5, y: 0.5 }) {
  const cpu = catalog.cpus.find((c) => c.id === cpuId)!;
  await page.getByRole("textbox", { name: "Find a processor" }).fill(cpu.name);
  await page
    .locator(".search-results button")
    .filter({ hasText: cpu.maker })
    .first()
    .click();
  const map = page.locator(
    `.cpu-vector-map[aria-label^="${cpu.maker} ${cpu.name},"]`,
  );
  await expect(map).toBeVisible();
  // Wait for the actual viewport animation to settle before mapping image coordinates.
  await expect
    .poll(async () => {
      const a = await map.boundingBox();
      await page.waitForTimeout(100);
      const b = await map.boundingBox();
      return a && b ? Math.abs(a.x - b.x) + Math.abs(a.width - b.width) : 10;
    })
    .toBeLessThan(0.2);
  const box = (await map.boundingBox())!;
  await page.mouse.click(
    box.x + box.width * point.x,
    box.y + box.height * point.y,
  );
  await expect(page.locator(".guess-pin")).toBeVisible();
}
test("five rounds, pin placement, reveal, reload recovery, recap and replay", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const requests: string[] = [];
  page.on("request", (r) => requests.push(r.url()));
  await page.goto("/");
  await ready(page);
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("cpu-guesser.session.v1")!).startedAt)).toEqual(expect.any(Number));
  await expect(page.locator(".completion-time")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Guess" })).toBeDisabled();
  let finishedAt: number | null = null;
  for (let i = 0; i < 5; i++) {
    const state = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("cpu-guesser.session.v1")!),
    );
    const q = state.questions[i];
    await place(page, q.cpuId, q.target);
    await expect(page.getByRole("button", { name: "Guess" })).toBeEnabled();
    if (i === 0) {
      await page.reload();
      await ready(page);
      await expect(page.locator(".guess-pin")).toBeVisible();
      expect(await page.evaluate(() => JSON.parse(localStorage.getItem("cpu-guesser.session.v1")!).questions[0])).toEqual(q);
    }
    await page.getByRole("button", { name: "Guess" }).click();
    await expect(
      page.getByRole("dialog", { name: "Round result" }),
    ).toBeVisible();
    await expect(page.locator(".result-map .atlas-viewer")).toHaveAttribute(
      "data-status",
      "ready",
    );
    await expect(page.locator(".result-map .guess-pin")).toBeVisible();
    await expect(page.locator(".result-map .distance-line")).toHaveCount(1);
    await expect(
      page.locator(".result-map .comparison-distance"),
    ).toContainText(/µm|mm/);
    await expect(page.locator(".answer-pin")).toBeVisible();
    await expect(page.locator(".result-distance strong")).toContainText(
      /µm|mm/,
    );
    await expect(page.locator(".reveal-card")).toContainText("+5,000");
    if (q.regionId === null) await expect(page.locator('.reveal-title h3')).toHaveText('Unidentified circuitry');
    if (i === 4) finishedAt = await page.evaluate(() => JSON.parse(localStorage.getItem("cpu-guesser.session.v1")!).finishedAt);
    if (i === 0) {
      await page.reload();
      await ready(page);
      await expect(
        page.getByRole("dialog", { name: "Round result" }),
      ).toBeVisible();
      await expect(page.locator(".result-map .atlas-viewer")).toHaveAttribute(
        "data-status",
        "ready",
      );
      await expect(page.locator(".result-map .guess-pin")).toBeVisible();
      await expect(page.locator(".result-map .distance-line")).toHaveCount(1);
      await expect(
        page.locator(".result-map .comparison-distance"),
      ).toContainText(/µm|mm/);
      await expect(page.locator(".answer-pin")).toBeVisible();
      await expect(page.locator(".result-distance strong")).toContainText(
        /µm|mm/,
      );
    }
    await page
      .getByRole("button", {
        name: i === 4 ? "Results" : "Next Level",
      })
      .click();
    if (i < 4) await ready(page);
  }
  await expect(
    page.getByRole("region", { name: "Expedition results" }),
  ).toContainText("25,000");
  await expect(page.locator(".recap>div")).toHaveCount(5);
  const timing = await page.evaluate(() => JSON.parse(localStorage.getItem("cpu-guesser.session.v1")!));
  expect(timing.finishedAt).toBe(finishedAt);
  const duration = await page.locator(".completion-time strong").innerText();
  expect(duration).toMatch(/^\d{2}:\d{2}\.\d{3}$/);
  expect(timing.finishedAt).toBeGreaterThan(timing.startedAt);
  await expect(page.locator(".completion-time strong")).toHaveText(duration);
  await page.reload();
  await expect(page.locator(".completion-time strong")).toHaveText(duration);
  await page.getByRole("button", { name: "Share Result", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText("Result copied");
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toBe(
    [
      "CPU Guesser 🧠",
      "🏆 25,000 / 25,000",
      `⏱ ${duration}`,
      "",
      ...Array(5).fill("🟩🟩🟩🟩🟩 5,000"),
    ].join("\n"),
  );
  await page.evaluate(() => {
    Object.defineProperty(navigator.clipboard, "writeText", {
      configurable: true,
      value: async () => {
        throw new DOMException("Clipboard denied", "NotAllowedError");
      },
    });
  });
  await page.getByRole("button", { name: "Share Result", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Clipboard unavailable");
  await expect(
    page.getByRole("textbox", { name: "Result to copy" }),
  ).toHaveValue(copied);
  await expect(
    page.getByRole("textbox", { name: "Result to copy" }),
  ).toBeFocused();
  await page.getByRole("button", { name: "Play again" }).click();
  await ready(page);
  await expect(page.locator(".completion-card")).toHaveCount(0);
  await expect(page.locator(".completion-time")).toHaveCount(0);
  await expect(
    page.getByRole("textbox", { name: "Result to copy" }),
  ).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Guess" })).toBeDisabled();
  expect(errors).toEqual([]);
  expect(requests.some((r) => r.includes("/tiles/"))).toBeTruthy();
  expect(
    requests.some((r) => r.includes("/originals/") || r.includes("/previews/")),
  ).toBeFalsy();
});
test("atlas is SVG only, keeps physical size ratios, and supports keyboard pinning and dialogs", async ({
  page,
}) => {
  await page.goto("/");
  await ready(page);
  await expect(page.locator(".cpu-vector-map svg")).toHaveCount(catalog.cpus.length);
  await expect(page.locator(".atlas-map img")).toHaveCount(0);
  await expect(page.locator(".atlas-map")).not.toContainText(
    "Instruction decode",
  );
  const z = (await page
    .locator('.cpu-vector-map[aria-label^="Zilog Z80,"]')
    .boundingBox())!;
  const m = (await page
    .locator('.cpu-vector-map[aria-label^="Motorola 68000,"]')
    .boundingBox())!;
  expect(m.width / z.width).toBeCloseTo(7.14 / 3.545, 1);
  await page.getByRole("button", { name: "Expand atlas", exact: true }).click();
  await expect(page.locator(".atlas-card")).toHaveClass(/atlas-expanded/);
  await page.getByRole("button", { name: "Collapse atlas" }).click();
  await page.getByRole("textbox", { name: "Find a processor" }).fill("68000");
  await page.locator(".search-results button").click();
  await page.waitForTimeout(700);
  await page.locator(".atlas-viewer .osd-surface").focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".guess-pin")).toBeVisible();
  await expect(page.getByRole("button", { name: "How to play" })).toHaveCount(
    0,
  );
  await expect(page.locator(".mission, .view-hint")).toHaveCount(0);
  await page.evaluate(() => document.fonts.ready);
  expect(
    await page.evaluate(() => document.fonts.check('14px "Geist Mono"')),
  ).toBeTruthy();
  await expect(page.locator("body")).toHaveCSS("font-family", /Geist Mono/);
  await page.getByRole("button", { name: "Sourcebook" }).click();
  await expect(page.getByRole("dialog")).toContainText("John McMaster");
  await expect(page.getByRole("dialog")).toContainText("ZeptoBars");
  await expect(page.getByRole("dialog")).toContainText("unverified");
  await expect(
    page
      .getByRole("dialog")
      .getByRole("link", { name: /Reverse Engineering the MOS 6502/ }),
  ).toHaveAttribute("href", /media.ccc.de/);
});
test("failed mystery asset can be retried", async ({ page }) => {
  let fail = true;
  await page.route("**/tiles/*.dzi", (r) =>
    fail
      ? r.fulfill({ status: 503, body: "Temporarily unavailable" })
      : r.continue(),
  );
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Retry images" }),
  ).toBeVisible();
  fail = false;
  await page.getByRole("button", { name: "Retry images" }).click();
  await ready(page);
});
test("mobile atlas expands, accepts touch pins and preserves the mystery bounds", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  await page.goto("/");
  await ready(page);
  await page.getByRole("button", { name: "Expand atlas", exact: true }).tap();
  await expect(page.locator(".atlas-card")).toHaveClass(/atlas-expanded/);
  await page.getByRole("textbox", { name: "Find a processor" }).fill("Z80");
  await page.getByRole("button", {name:"Zilog Z80 1976", exact:true}).tap();
  await page.waitForTimeout(700);
  const map = (await page
    .locator('.cpu-vector-map[aria-label^="Zilog Z80,"]')
    .boundingBox())!;
  await page.touchscreen.tap(map.x + map.width * 0.7, map.y + map.height * 0.6);
  await expect(page.locator(".guess-pin")).toBeVisible();
  await page.getByRole("button", { name: "Collapse atlas" }).tap();
  await page.getByRole("button", { name: "Guess" }).tap();
  await expect(
    page.getByRole("dialog", { name: "Round result" }),
  ).toBeVisible();
  await expect(page.locator(".result-map .atlas-viewer")).toHaveAttribute(
    "data-status",
    "ready",
  );
  await expect(page.locator(".result-map .guess-pin")).toBeVisible();
  await expect(page.locator(".result-map .distance-line")).toHaveCount(1);
  await expect(page.locator(".result-map .comparison-distance")).toContainText(
    /µm|mm/,
  );
  const box = (await page.locator(".reveal-card").boundingBox())!;
  expect(box.y).toBeGreaterThanOrEqual(10);
  expect(box.y + box.height).toBeLessThanOrEqual(844);
  await context.close();
});

test("result modal frames distant guesses, dims the background, and advances with Next Level", async ({
  page,
}) => {
  await page.goto("/");
  await ready(page);
  const state = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("cpu-guesser.session.v1")!),
  );
  const q = state.questions[0];
  const wrongCpu = catalog.cpus.find((c) => c.id !== q.cpuId)!;
  await place(page, wrongCpu.id);
  await page.getByRole("button", { name: "Guess", exact: true }).click();
  const popup = page.getByRole("dialog", { name: "Round result" });
  await expect(popup).toBeVisible();
  await expect(page.locator(".result-map .atlas-viewer")).toHaveAttribute(
    "data-status",
    "ready",
  );
  await expect(page.locator(".comparison-legend")).toContainText("Your guess");
  await expect(page.locator(".comparison-legend")).toContainText(
    "Correct location",
  );
  await expect
    .poll(() => popup.evaluate((el) => el.matches(":modal")))
    .toBeTruthy();
  expect(
    await popup.evaluate(
      (el) => getComputedStyle(el, "::backdrop").backgroundColor,
    ),
  ).not.toBe("rgba(0, 0, 0, 0)");
  const map = page.locator(".result-map");
  await expect
    .poll(async () => {
      const frame = (await map.boundingBox())!;
      for (const selector of [".guess-pin", ".answer-pin"]) {
        const pin = (await map.locator(selector).boundingBox())!;
        if (
          pin.x < frame.x ||
          pin.y < frame.y ||
          pin.x + pin.width > frame.x + frame.width ||
          pin.y + pin.height > frame.y + frame.height
        )
          return false;
      }
      return true;
    })
    .toBeTruthy();
  await expect(map.locator(".distance-line")).toHaveCount(1);
  await expect(map.locator(".comparison-distance")).toHaveText(
    await page.locator(".result-distance strong").innerText(),
  );
  await page.keyboard.press("Escape");
  await expect(popup).toBeVisible();
  await page.getByRole("button", { name: "Next Level", exact: true }).click();
  await expect(popup).toHaveCount(0);
  await ready(page);
  await expect(page.locator(".round-status")).toContainText("Round 2 of 5");
});

test("a different CPU earns manufacturer and gradual year credits in the result and session total", async ({page}) => {
  const target=catalog.questions.find(q=>q.cpuId==='moto_68000')!;
  const session={version:catalog.version,questionIds:[target.id,...catalog.questions.filter(q=>q.id!==target.id).slice(0,4).map(q=>q.id)],index:0,results:[],guess:null,phase:'playing'};
  await page.addInitScript(session=>{if(!localStorage.getItem('cpu-guesser.session.v1'))localStorage.setItem('cpu-guesser.session.v1',JSON.stringify(session));},session);
  await page.goto('/');await ready(page);
  await place(page,'moto_6800');
  await page.getByRole('button',{name:'Guess',exact:true}).click();
  await expect(page.getByRole('dialog',{name:'Round result'})).toBeVisible();
  await expect(page.locator('.result-score strong')).toHaveText('+1,420');
  await expect(page.locator('.reveal-title > span')).toContainText('1979');
  await expect(page.locator('.wrong-cpu')).toContainText('1974');
  await page.getByText('Details & sources',{exact:true}).click();
  await expect(page.locator('.score-breakdown > div').filter({hasText:'Manufacturer'})).toContainText('1,000');
  await expect(page.locator('.score-breakdown > div').filter({hasText:'Year'})).toContainText('420');
  await page.reload();await ready(page);
  await expect(page.locator('.result-score strong')).toHaveText('+1,420');
  await page.getByRole('button',{name:'Next Level',exact:true}).click();await ready(page);
  await expect(page.locator('.session-score')).toHaveText('1,420 points');
});
