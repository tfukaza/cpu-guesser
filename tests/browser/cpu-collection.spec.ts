import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
const catalog = JSON.parse(readFileSync(new URL('../../data/catalog.json',import.meta.url),'utf8'));

test('modern inferred regions can be selected and their creator credits are searchable', async ({page}) => {
  await page.goto('/');
  await expect(page.locator('.atlas-viewer')).toHaveAttribute('data-status','ready');
  const cpu = catalog.cpus.find((c: {id:string}) => c.id === 'amd_zen5_ccd');
  await page.getByRole('textbox',{name:'Find a processor on the atlas'}).fill('Zen 5');
  await page.locator('.search-results button').filter({hasText:cpu.name}).click();
  const die=page.locator(`.cpu-vector-map[aria-label^="AMD ${cpu.name},"]`);
  await expect(die).toBeVisible();
  await expect(die.locator('.circuit-unclassified')).toHaveCount(catalog.regions.filter((r: {cpuId:string})=>r.cpuId===cpu.id).length);
  await expect(die.locator('.unmapped-block')).toHaveCount(0);
  const outline = die.locator('.circuit-unclassified').first();
  await expect(outline).toHaveCSS('vector-effect','none');
  const screenStroke = () => outline.evaluate(el => {
    const matrix = (el as SVGGraphicsElement).getScreenCTM()!;
    return parseFloat(getComputedStyle(el).strokeWidth) * Math.hypot(matrix.a,matrix.b);
  });
  // Wait for search focus to finish before comparing zoom levels.
  await expect.poll(async () => {
    const a = await die.boundingBox();
    await page.waitForTimeout(100);
    const b = await die.boundingBox();
    return Math.abs(a!.width-b!.width);
  }).toBeLessThan(.1);
  const before = await screenStroke();
  await page.getByRole('button',{name:'Zoom in on atlas',exact:true}).click();
  await expect.poll(screenStroke).toBeGreaterThan(before * 1.5);
  await page.getByRole('button',{name:'Zoom out on atlas',exact:true}).click();
  await expect.poll(screenStroke).toBeLessThan(before * 1.1);
  await page.getByRole('button',{name:'Sourcebook',exact:true}).click();
  await expect(page.getByRole('dialog')).toContainText(/functions? unverified/i);
  const credit=page.locator('.source-entry').filter({has:page.getByRole('heading',{name:`AMD ${cpu.name}`,exact:true})});
  await expect(credit).toContainText(cpu.photographer);
  await expect(credit.getByRole('link',{name:cpu.license,exact:true})).toHaveAttribute('href',cpu.licenseUrl);
  await page.locator('.reference-library summary').click();
  await page.getByRole('textbox',{name:'Search CPU reference collection'}).fill('Cyrix');
  await expect(page.locator('.reference-library .source-entry').first()).toContainText('Cyrix');
  await expect(page.locator('.reference-library .source-entry').first().getByRole('link',{name:'Original source'})).toHaveAttribute('href',/commons.wikimedia.org/);
});

test('company timelines and famous GPU/SoC dies remain usable on the compact atlas', async ({page}) => {
  await page.goto('/');
  await expect(page.locator('.atlas-viewer')).toHaveAttribute('data-status','ready');
  await expect(page.locator('.company-lineage')).toHaveCount(new Set(catalog.cpus.map((c:{maker:string})=>c.maker)).size);
  await expect(page.locator('.lane-label')).toHaveCount(0);
  await expect(page.locator('.company-lineage[data-maker="NVIDIA"] .company-trunk')).toHaveCSS('stroke-width','4px');
  await expect(page.locator('.atlas-timeline-note')).toContainText('collection years');
  const gpu=catalog.cpus.find((c:{chipType?:string;name:string})=>c.chipType==='gpu' && c.name.includes('4090'));
  const apple=catalog.cpus.find((c:{id:string})=>c.id==='apple_m1');
  expect(gpu).toBeTruthy();
  expect(apple).toBeTruthy();
  for(const cpu of [gpu,apple]) {
    await page.getByRole('textbox',{name:'Find a processor on the atlas'}).fill(cpu.name);
    await page.locator('.search-results button').filter({hasText:cpu.name}).first().click();
    await expect(page.locator(`.cpu-vector-map[aria-label^="${cpu.maker} ${cpu.name},"]`)).toBeVisible();
  }
  await page.getByRole('button',{name:'Sourcebook',exact:true}).click();
  for(const cpu of [gpu,apple]) {
    const credit=page.locator('.source-entry').filter({has:page.getByRole('heading',{name:`${cpu.maker} ${cpu.name}`,exact:true})});
    await expect(credit).toContainText(cpu.photographer);
    await expect(credit.getByRole('link',{name:cpu.license,exact:true})).toHaveAttribute('href',cpu.licenseUrl);
  }
});
