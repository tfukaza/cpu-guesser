import {readFile} from 'node:fs/promises';

// Supplements retain independently researched evidence when the discovery
// catalog is refreshed. A later record explicitly overrides the same identity.
export async function readCpuRecords() {
  const records = new Map();
  for (const file of ['commons-cpus','additional-cpus','apple-cpus','nvidia-cpus']) {
    let rows;
    try { rows=JSON.parse(await readFile(`data/research/${file}.json`,'utf8')); }
    catch(error) { if(error.code==='ENOENT' && file!=='commons-cpus') continue; throw error; }
    for(const row of rows) records.set(row.id,{...records.get(row.id),...row});
  }
  return [...records.values()];
}
export function evidenceSource(value, fallbackTitle) {
  return typeof value === 'object' && value ? value : {title:fallbackTitle,url:value,kind:'article'};
}
