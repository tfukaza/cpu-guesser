import { chromium } from "@playwright/test";
import { readFile, writeFile, mkdir } from "node:fs/promises";

// Original vector artwork: no third-party die photography is used in this card.
const font = await readFile("public/fonts/geist-mono-latin.woff2");
const arrays = [];
for (const [x, y, width, height] of [[747, 149, 118, 127], [888, 149, 118, 127], [747, 299, 118, 176]]) {
  arrays.push(`<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="2" fill="#363636" stroke="#777"/>`);
  for (let row = y + 10; row < y + height - 5; row += 10) {
    arrays.push(`<path d="M${x + 8} ${row}h${width - 16}" stroke="#8b8b8b" stroke-width="2"/>`);
  }
  for (let col = x + 16; col < x + width - 8; col += 20) {
    arrays.push(`<path d="M${col} ${y + 6}v${height - 12}" stroke="#242424" stroke-width="3"/>`);
  }
}
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <style>@font-face{font-family:Geist Mono;src:url(data:font/woff2;base64,${font.toString("base64")}) format('woff2');font-weight:100 900}text{font-family:Geist Mono,monospace}</style>
    <pattern id="grid" width="28" height="28" patternUnits="userSpaceOnUse"><path d="M28 0H0V28" fill="none" stroke="#242424" stroke-width="1"/></pattern>
    <linearGradient id="fade"><stop stop-color="#141414"/><stop offset="1" stop-color="#141414" stop-opacity="0"/></linearGradient>
  </defs>
  <rect width="1200" height="630" fill="#141414"/>
  <rect x="590" width="610" height="630" fill="url(#grid)"/>
  <rect x="540" width="190" height="630" fill="url(#fade)"/>
  <rect x="48" y="48" width="1104" height="534" rx="10" fill="none" stroke="#454545"/>
  <text x="88" y="215" fill="#f3f3f3" font-size="94" font-weight="500" letter-spacing="-5">CPU</text>
  <text x="84" y="323" fill="#f3f3f3" font-size="94" font-weight="500" letter-spacing="-5">Guesser</text>
  <path d="M88 362H164" stroke="#777"/>
  <text x="88" y="411" fill="#a8a8a8" font-size="24">Know your silicon.</text>
  <text x="88" y="536" fill="#777" font-size="18">cpu-guesser.vercel.app</text>
  <g transform="rotate(-7 876 316)">
    <rect x="705" y="111" width="342" height="404" rx="9" fill="#202020" stroke="#aaa" stroke-width="2"/>
    <rect x="719" y="125" width="314" height="376" rx="3" fill="none" stroke="#555"/>
    ${arrays.join("\n")}
    <rect x="888" y="299" width="118" height="76" rx="2" fill="#666" stroke="#aaa"/>
    <path d="M899 310h96m-96 10h96m-96 10h96m-96 10h96m-96 10h96m-96 10h96" stroke="#999" stroke-width="2"/>
    <rect x="888" y="397" width="118" height="78" rx="2" fill="#3b3b3b" stroke="#888"/>
    <path d="M876 139v346M737 287h279M737 386h279M876 432h12" fill="none" stroke="#888" stroke-width="2"/>
    <path d="M696 211h35m-17-17v34M1022 421h35m-17-17v34" stroke="#555"/>
  </g>
  <circle cx="954" cy="326" r="41" fill="#151515dd" stroke="#f3f3f3" stroke-width="2"/>
  <circle cx="954" cy="326" r="6" fill="#f3f3f3"/>
  <path d="M954 273v24m0 58v24m-53-53h24m58 0h24" stroke="#f3f3f3" stroke-width="2"/>
</svg>`;

await mkdir("assets/design", { recursive: true });
await writeFile("assets/design/social-card.svg", svg);
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await page.setContent(`<html><body style="margin:0">${svg}</body></html>`);
  await page.evaluate(() => document.fonts.ready);
  await page.locator("svg").screenshot({ path: "public/social-preview.png" });
} finally {
  await browser.close();
}
console.log("Saved public/social-preview.png (1200 × 630) and assets/design/social-card.svg");
