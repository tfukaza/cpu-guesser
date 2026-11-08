"use client";

import { useState } from "react";
import library from "@/data/cpu-library.json";

export default function CpuLibrary({ playableIds }: { playableIds: string[] }) {
  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(30);
  const entries = library.entries.filter(c => !playableIds.includes(c.id));
  const query = search.trim().toLowerCase();
  const matches = entries.filter(c => `${c.maker} ${c.name} ${c.specimen}`.toLowerCase().includes(query));
  return (
    <details className="reference-library">
      <summary>Die reference collection · {entries.length} additional dies</summary>
      <p>These photographs have verified creator and license records. They await visual review, usable scale, or suitable imagery before becoming questions. Dates and dimensions from the discovery catalog remain provisional.</p>
      <input aria-label="Search CPU reference collection" placeholder="Search manufacturers, models, or specimens…" value={search} onChange={e => { setSearch(e.target.value); setLimit(30); }} />
      <p>{matches.length} matching entries. Original photographs open on their source websites.</p>
      {matches.slice(0, limit).map(c => (
        <article className="source-entry" key={c.id}>
          <h3>{c.maker} {c.name}</h3>
          <p>{c.specimen}</p>
          {c.remainingResearch.length > 0 && <p>Not yet playable: {c.remainingResearch[0]}</p>}
          <p>Photograph: {c.photo.creator}. <a href={c.photo.sourceUrl} target="_blank" rel="noreferrer">Original source</a> · <a href={c.photo.licenseUrl} target="_blank" rel="noreferrer">{c.photo.license}</a></p>
          {c.photo.attribution && <p>Attribution: {c.photo.attribution}</p>}
          <p>Introduction year: {c.introductionYear ?? "unknown"}. {c.introductionYearStatus} <a href={c.catalogSource.url} target="_blank" rel="noreferrer">Year evidence</a></p>
          <p>{c.photo.modifications}</p>
        </article>
      ))}
      {matches.length > limit && <button className="secondary-button" onClick={() => setLimit(n => n + 30)}>Show 30 more entries</button>}
    </details>
  );
}
