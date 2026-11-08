import {readFile,writeFile} from 'node:fs/promises';
import sharp from 'sharp';
import {readCpuRecords,evidenceSource} from './cpu-records.mjs';
const records = await readCpuRecords();
const reviews = (await Promise.all(['early','middle','modern','additional','apple','nvidia'].map(async group => {
  try { return JSON.parse(await readFile(`data/visual-regions-${group}.json`,'utf8')); }
  catch(error) { if(error.code==='ENOENT' && !['early','middle','modern'].includes(group))return []; throw error; }
}))).flat();
const expanded = {cpus:[],regions:[],targets:[]};
for(const review of reviews){
  if(!review.regions?.length)continue;
  if(expanded.cpus.some(c=>c.id===review.cpuId))throw Error(`Duplicate reviewed die: ${review.cpuId}`);
  const r = records.find(r=>r.id===review.cpuId);
  if(!r || r.exclusion || r.referenceOnly || !r.widthMm || !r.heightMm || !r.year) throw Error(`Ineligible reviewed die: ${review.cpuId}`);
  const meta = await sharp(`assets/originals/${r.id}.jpg`).metadata();
  if (Math.min(meta.width,meta.height)<1600) throw Error(`Downloaded rendition too small: ${r.id}`);
  let widthMm=r.widthMm, heightMm=r.heightMm;
  const aspect=meta.width/meta.height;
  const originalError=Math.abs(Math.log((widthMm/heightMm)/aspect));
  const swappedError=Math.abs(Math.log((heightMm/widthMm)/aspect));
  const swapped=swappedError+0.05<originalError;
  if(swapped) [widthMm,heightMm]=[heightMm,widthMm];
  const source={title:r.sourceTitle ?? `${r.photographer} — original die photograph`,url:r.sourceUrl,kind:'article'};
  const modifications='Downsampled where necessary, converted to grayscale, contrast normalized (1st–99th percentiles), cropped and tiled for CPU Guesser. Vector region contours estimated visually by language models; functions unverified. Derivative photographs and photo-derived contours retain the linked original license.';
  expanded.cpus.push({
    id:r.id,chipType:r.chipType,name:r.id==='moto_68060'?'68LC060 (68060 family)':(records.filter(c=>c.maker===r.maker&&c.name===r.name).length>1 ? `${r.name} (${r.year ?? r.id})` : r.name),maker:r.maker,year:r.year,
    revision:r.specimenDescription || 'Exact mask revision unconfirmed; see original photograph description.',
    widthMm,heightMm,photographer:r.photographer,source,imageUrl:r.imageUrl,
    originalImageUrl:r.originalImageUrl,license:r.license,licenseUrl:r.licenseUrl,
    attribution:r.attribution,credit:r.credit,modifications,
    dimensionsNote:(r.dimensionsNote ?? 'Provisional discovery-catalog dimensions. Physical size and exact specimen are not independently verified; use this atlas as an approximate educational map.') + (swapped ? ' Width and height swapped to match photographed orientation, inferred from aspect ratio.' : ''),
    dimensionsSource:evidenceSource(r.dimensionsSource, 'Physical scale evidence'),yearNote:r.yearNote,yearSource:evidenceSource(r.yearSource, 'Introduction date evidence'),
    annotationMethod:'model-visual-estimate',reviewNote:review.reviewNote,
    resources:[source,evidenceSource(r.dimensionsSource,'Physical scale evidence'),evidenceSource(r.yearSource,'Introduction date evidence'),...(r.resources ?? [])].filter((v,i,a)=>a.findIndex(t=>t.url===v.url)===i),
  });
  for(const region of review.regions){
    const id=`${r.id}-${region.id}`;
    const {target,...shape}=region;
    expanded.regions.push({...shape,id,cpuId:r.id,source,kind:'unclassified',annotationMethod:'model-visual-estimate',confidenceNote:'Qualitative confidence in visible contour placement, not a calibrated probability or evidence of circuit function.'});
    expanded.targets.push({cpuId:r.id,regionId:id,target,questionId:id});
  }
}
await writeFile('data/expanded-catalog.json',JSON.stringify(expanded,null,2)+'\n');
console.log(`${expanded.cpus.length} visually reviewed dies, ${expanded.regions.length} contours`);
