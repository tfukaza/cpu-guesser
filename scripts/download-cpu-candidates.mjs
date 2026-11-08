import {writeFile,mkdir,access,rename,unlink} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import sharp from 'sharp';
import {readCpuRecords} from './cpu-records.mjs';
const records=await readCpuRecords();
const baseline = new Set(['intel_8008','moto_6800','mos_6502','zilog_z80','moto_68000']);
const eligible=records.filter(r=>r.widthMm&&r.heightMm&&r.year&&!r.exclusion&&!r.referenceOnly&&Math.min(r.sourceWidth,r.sourceHeight)>=2000&&!baseline.has(r.id));
await mkdir('assets/originals',{recursive:true});await mkdir('scripts/research/review',{recursive:true});
await writeFile('data/research/visual-review-queue.json',JSON.stringify(eligible,null,2)+'\n');
const results=[];
for (const r of eligible){
  const path=`assets/originals/${r.id}.jpg`;
  try {
    try {await access(path);} catch {
      execFileSync('curl',['--fail','--location','--retry','2','--max-time','90','--silent','--show-error','--user-agent','CPU-Guesser/0.2 (educational die photo research)',r.imageUrl,'--output',path+'.part']);
      await rename(path+'.part',path);
    }
    const meta=await sharp(path).metadata();
    if (Math.min(meta.width,meta.height)<1600) throw Error(`Downloaded image too small: ${meta.width}x${meta.height}`);
    await sharp(path).resize({width:1200,withoutEnlargement:true}).jpeg({quality:90}).toFile(`scripts/research/review/${r.id}.jpg`);
    results.push({id:r.id,status:'ready',width:meta.width,height:meta.height});
    console.log(`Ready ${results.length}/${eligible.length}: ${r.id}`);
  } catch(e){results.push({id:r.id,status:'failed',error:String(e)});console.error(r.id,String(e));try{await unlink(path+'.part');}catch{}}
  await writeFile('data/research/download-status.json',JSON.stringify(results,null,2)+'\n');
}
