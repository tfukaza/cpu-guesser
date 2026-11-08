"use client";

import { useEffect, useRef, useState } from "react";
import {
  Expand,
  LocateFixed,
  Maximize2,
  Minus,
  Plus,
  Search,
  Shrink,
  X,
} from "lucide-react";
import { DieViewer, type ViewerControls } from "./DieViewer";
import RoundResult from "./RoundResult";
import CpuLibrary from "./CpuLibrary";
import {
  newSession,
  parseSession,
  scoreGuess,
  totalScore,
  atlasDistanceMm,
  formatDistance,
  formatShareResult,
  sessionQuestions,
  elapsedMs,
  formatDuration,
  makerColor,
  type Catalog,
  type Guess,
  type Session,
} from "@/lib/game";

const SESSION_KEY = "cpu-guesser.session.v1";
const BEST_KEY = "cpu-guesser.best.v1";
const number = (n: number) => n.toLocaleString("en-US");

export default function Game({ catalog }: { catalog: Catalog }) {
  const [session, setSession] = useState<Session | null>(null);
  const [best, setBest] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [modal, setModal] = useState<"credits" | null>(null);
  const [search, setSearch] = useState("");
  const [atlasReady, setAtlasReady] = useState(false);
  const [mysteryReady, setMysteryReady] = useState(false);
  const [view, setView] = useState({ zoom: 2, scalePx: 70, scaleMm: 5 });
  const [atlasNotice, setAtlasNotice] = useState("");
  const [shareStatus, setShareStatus] = useState<
    "idle" | "copying" | "copied" | "error"
  >("idle");
  const shareRequest = useRef(0);
  const shareFallback = useRef<HTMLTextAreaElement>(null);
  const atlas = useRef<ViewerControls>(null),
    mystery = useRef<ViewerControls>(null),
    dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    let next: Session | null = null;
    try {
      next = parseSession(localStorage.getItem(SESSION_KEY), catalog);
      const stored = Number(localStorage.getItem(BEST_KEY));
      if (Number.isFinite(stored) && stored >= 0 && stored <= 25000)
        setBest(stored);
    } catch {}
    setSession(next ?? newSession(catalog));
  }, [catalog]);
  useEffect(() => {
    if (!session) return;
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      if (session.phase === "complete") {
        const total = totalScore(session);
        setBest((b) => Math.max(b, total));
        const old = Number(localStorage.getItem(BEST_KEY)) || 0;
        localStorage.setItem(BEST_KEY, String(Math.max(old, total)));
      }
    } catch {}
  }, [session]);
  useEffect(() => {
    if (modal && !dialog.current?.open) dialog.current?.showModal();
    if (!modal && dialog.current?.open) dialog.current.close();
  }, [modal]);
  useEffect(() => {
    if (mysteryReady && atlasReady) {
      setSession((s) => s && s.phase === "playing" && s.startedAt === null
        ? { ...s, startedAt: Date.now() }
        : s);
    }
  }, [mysteryReady, atlasReady, session?.phase]);
  useEffect(() => {
    if (shareStatus === "error") {
      shareFallback.current?.focus();
      shareFallback.current?.select();
    }
  }, [shareStatus]);
  const questions = session ? sessionQuestions(session, catalog) : [];
  const q = session ? questions[session.index] : null;
  const result =
    session?.phase === "reveal" ? session.results[session.index] : null;
  const guessCpu = catalog.cpus.find((c) => c.id === session?.guess?.cpuId);
  const choose = (guess: Guess) => {
    setSession((s) => (s?.phase === "playing" ? { ...s, guess } : s));
    setAtlasNotice("Pin placed.");
  };
  const submit = () => {
    if (!session || !q || !session.guess || session.phase !== "playing") return;
    setSession({
      ...session,
      phase: "reveal",
      finishedAt: session.index === 4 && session.startedAt != null
        ? Math.max(session.startedAt, Date.now())
        : null,
      results: [...session.results, scoreGuess(q, session.guess, catalog)],
    });
    setSearch("");
    setExpanded(false);
  };
  const next = () => {
    if (!session) return;
    if (session.index === 4) setSession({ ...session, phase: "complete" });
    else {
      setSession({
        ...session,
        index: session.index + 1,
        phase: "playing",
        guess: null,
      });
      setExpanded(false);
      setAtlasNotice("");
      atlas.current?.home();
    }
  };
  const restart = () => {
    shareRequest.current++;
    setShareStatus("idle");
    setSession(newSession(catalog));
    setExpanded(false);
    setSearch("");
    setAtlasNotice("");
    setMysteryReady(false);
    atlas.current?.home();
    mystery.current?.home();
  };
  const shareResult = async () => {
    if (session?.phase !== "complete" || shareStatus === "copying") return;
    const request = ++shareRequest.current;
    setShareStatus("copying");
    try {
      await navigator.clipboard.writeText(formatShareResult(session));
      if (request === shareRequest.current) setShareStatus("copied");
    } catch {
      if (request === shareRequest.current) setShareStatus("error");
    }
  };
  const focusCpu = (id: string) => {
    atlas.current?.focusCpu(id);
    setSearch("");
    setAtlasNotice("Processor selected.");
  };
  const query = search.trim().toLowerCase();
  const matchRank = (c: Catalog["cpus"][number]) =>
    c.name.toLowerCase() === query ? 0 :
      `${c.maker} ${c.name}`.toLowerCase().includes(query) ? 1 : 2;
  const filtered = query
    ? catalog.cpus.filter((c) =>
        `${c.maker} ${c.name} ${c.revision}`.toLowerCase().includes(query),
      ).sort((a,b) => matchRank(a)-matchRank(b))
    : [];

  return (
    <main className="game-shell">
      <header className="site-header">
        <div className="header-brand">
          <a href="/" className="brand" aria-label="CPU Guesser home">
            CPU Guesser
          </a>
          <div className="creator-credit">
            <span>Made with 🤖 by Tomoki Fukazawa</span>
            <a href="https://x.com/TomokiFukazawa" target="_blank" rel="noopener noreferrer" aria-label="Tomoki Fukazawa on Twitter / X" title="Twitter / X">
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M18.9 2H22l-6.8 7.8L23.2 22h-6.3L12 14.6 5.5 22H2.3l7.9-9L.8 2h6.5l4.5 6.7L18.9 2Zm-1.1 18h1.7L6.4 3.9H4.6L17.8 20Z" />
              </svg>
            </a>
            <a href="https://github.com/tfukaza" target="_blank" rel="noopener noreferrer" aria-label="Tomoki Fukazawa on GitHub" title="GitHub">
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 .9a11.1 11.1 0 0 0-3.5 21.6c.6.1.8-.2.8-.5v-2.1c-3.2.7-3.9-1.4-3.9-1.4-.5-1.3-1.3-1.6-1.3-1.6-1.1-.8.1-.8.1-.8 1.2.1 1.8 1.2 1.8 1.2 1.1 1.8 2.7 1.3 3.3 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.7 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.2 1.2a11 11 0 0 1 5.8 0C17.3 4.5 18.3 4.8 18.3 4.8c.6 1.6.2 2.8.1 3.1.8.8 1.2 1.8 1.2 3.1 0 4.4-2.7 5.4-5.3 5.7.4.4.8 1.1.8 2.1V22c0 .3.2.6.8.5A11.1 11.1 0 0 0 12 .9Z" />
              </svg>
            </a>
          </div>
        </div>
        <div className="round-status">
          <span>Round {(session?.index ?? 0) + 1} of 5</span>
          <span className="session-score">
            {number(session ? totalScore(session) : 0)} points
          </span>
        </div>
        <nav>
          <button aria-label="Sourcebook" onClick={() => setModal("credits")}>
            Sources
          </button>
        </nav>
      </header>

      <section className="expedition" aria-label="CPU guessing game">
        {q && (
          <DieViewer
            ref={mystery}
            mode="mystery"
            catalog={catalog}
            question={q}
            onReady={() => setMysteryReady(true)}
            onUnavailable={() => setMysteryReady(false)}
          />
        )}
        <div className="image-shade" />

        <div className="microscope-tools">
          <div className="tool-stack">
            <button
              aria-label="Zoom in on mystery"
              onClick={() => mystery.current?.zoom(1.5)}
            >
              <Plus size={19} />
            </button>
            <span />
            <button
              aria-label="Zoom out on mystery"
              onClick={() => mystery.current?.zoom(1 / 1.5)}
            >
              <Minus size={19} />
            </button>
          </div>
          <button
            className="square-button"
            aria-label="Reset mystery view"
            onClick={() => mystery.current?.home()}
          >
            <LocateFixed size={19} />
          </button>
        </div>

        <section
          className={`atlas-card ${expanded ? "atlas-expanded" : ""}`}
          aria-label="Answer atlas"
        >
          <div className="atlas-search">
            <Search size={14} />
            <input
              aria-label="Find a processor on the atlas"
              placeholder={`Find a processor · ${catalog.cpus.length} dies`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && filtered.length)
                  focusCpu(filtered[0].id);
                if (e.key === "Escape") setSearch("");
              }}
            />
            <button
              className="icon-button"
              title={expanded ? "Collapse atlas" : "Expand atlas"}
              aria-label={expanded ? "Collapse atlas" : "Expand atlas"}
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <Shrink size={17} /> : <Expand size={17} />}
            </button>
            {search && (
              <div className="search-results">
                {filtered.length ? (
                  filtered.map((c) => (
                    <button key={c.id} onClick={() => focusCpu(c.id)}>
                      <span>
                        <i className="maker-dot" style={{background:makerColor(c.maker)}} aria-hidden="true" />
                        {c.maker} <strong>{c.name}</strong>
                      </span>
                      <small>{c.year}</small>
                    </button>
                  ))
                ) : (
                  <p>No matching processors.</p>
                )}
              </div>
            )}
          </div>
          <div className="atlas-map">
            <DieViewer
              ref={atlas}
              mode="atlas"
              catalog={catalog}
              question={q ?? undefined}
              guess={session?.guess}
              reveal={false}
              onGuess={choose}
              onReady={() => setAtlasReady(true)}
              onUnavailable={() => setAtlasReady(false)}
              onViewChange={setView}
            />
            <div className="atlas-zoom">
              <button
                aria-label="Zoom in on atlas"
                onClick={() => atlas.current?.zoom(1.7)}
              >
                <Plus size={16} />
              </button>
              <button
                aria-label="Zoom out on atlas"
                onClick={() => atlas.current?.zoom(1 / 1.7)}
              >
                <Minus size={16} />
              </button>
              <button
                aria-label="Fit all CPUs on atlas"
                onClick={() => atlas.current?.home()}
              >
                <Maximize2 size={14} />
              </button>
            </div>
            <div className="atlas-scale">
              <span style={{ width: Math.min(150, view.scalePx) }} />
              {view.scaleMm < 1
                ? `${Math.round(view.scaleMm * 1000)} µm`
                : `${Number(view.scaleMm.toPrecision(2))} mm`}
            </div>
            <div className="atlas-timeline-note" title="Lines show years represented in this collection, not company lifespans or acquisition relationships.">Company colors · collection years</div>
          </div>
          {session?.phase === "playing" && (
            <div className="atlas-bottom">
              <div className="pin-status">
                {guessCpu && (
                  <>
                    <span>{guessCpu.maker}</span>
                    <strong>{guessCpu.name}</strong>
                  </>
                )}
              </div>
              <button
                className="submit-button"
                disabled={
                  !session?.guess ||
                  session?.phase !== "playing" ||
                  !mysteryReady ||
                  !atlasReady
                }
                onClick={submit}
              >
                Guess
              </button>
            </div>
          )}
          <span className="sr-only" aria-live="polite">
            {atlasNotice}
          </span>
        </section>

        {session?.phase === "complete" && (
          <section className="completion-card" aria-label="Expedition results">
            <h2>Round results</h2>
            <div className="final-score">
              {number(totalScore(session))}
              <span>/ 25,000 points</span>
            </div>
            <p className="personal-best">Personal best: {number(best)}</p>
            {elapsedMs(session) !== null && (
              <p className="completion-time">
                <span>Total time</span>
                <strong>{formatDuration(elapsedMs(session)!)}</strong>
              </p>
            )}
            <div className="recap">
              {session.results.map((r, i) => {
                const question = questions.find(
                    (q) => q.id === r.questionId,
                  )!,
                  c = catalog.cpus.find((c) => c.id === question.cpuId)!;
                return (
                  <div key={r.questionId}>
                    <span className="recap-number">{i + 1}</span>
                    <span>
                      <strong>
                        {c.maker} {c.name}
                      </strong>
                      <small>
                        {formatDistance(
                          atlasDistanceMm(question, r.guess, catalog),
                        )}
                      </small>
                    </span>
                    <b>{number(r.score)}</b>
                  </div>
                );
              })}
            </div>
            <div className="completion-actions">
              <button
                className="submit-button"
                onClick={shareResult}
                disabled={shareStatus === "copying"}
              >
                Share Result
              </button>
              <button className="replay-button" onClick={restart}>
                Play again
              </button>
            </div>
            <p className="share-feedback" role="status">
              {shareStatus === "copied"
                ? "Result copied"
                : shareStatus === "copying"
                  ? "Copying…"
                  : shareStatus === "error"
                    ? "Clipboard unavailable. Copy your result below."
                    : ""}
            </p>
            {shareStatus === "error" && (
              <textarea
                ref={shareFallback}
                className="share-fallback"
                aria-label="Result to copy"
                readOnly
                value={formatShareResult(session)}
                onFocus={(event) => event.currentTarget.select()}
              />
            )}
          </section>
        )}
      </section>
      {result && q && (
        <RoundResult
          key={q.id}
          catalog={catalog}
          question={q}
          result={result}
          lastRound={session?.index === 4}
          onNext={next}
        />
      )}
      <dialog
        ref={dialog}
        className="info-dialog sourcebook-dialog"
        onCancel={() => setModal(null)}
        onClick={(e) => {
          if (e.target === dialog.current) setModal(null);
        }}
      >
        <div className="dialog-heading">
          <div>
            <h2>Sources</h2>
          </div>
          <button
            className="icon-button"
            aria-label="Close dialog"
            onClick={() => setModal(null)}
          >
            <X size={22} />
          </button>
        </div>
        <div className="sourcebook-content">
          <p className="dialog-lead">
            Real photographs, circuit studies, visual region estimates, and the people who made them visible.
          </p>
          <p className="source-intro">
            The atlas is a hand-drawn schematic interpretation. Circuit
            boundaries are approximate; decorative routes and pads are
            illustrative. Photos are credited individually below. Introduction
            dates describe processor models, not the manufacturing dates of the
            photographed samples. Newer visual contours are model estimates of visible blocks, labeled generically where circuit function is unknown. Confidence describes outline placement, not a calibrated probability.
          </p>
          {catalog.cpus.map((c) => (
            <article className="source-entry" key={c.id}>
              <div className="source-entry-header">
                <h3>
                  {c.maker} {c.name}
                </h3>
                <span>{c.year}</span>
              </div>
              <p>{c.revision}</p>
              {c.chipType && <p>{c.chipType === "gpu" ? "Discrete GPU die" : c.chipType === "soc" ? "System on a chip (SoC)" : "CPU die"}</p>}
              {c.annotationMethod && <p>Visual region estimates: circuit functions unverified. {c.reviewNote}</p>}
              {c.yearNote && <p>{c.yearNote}</p>}
              {c.attribution && <p>Attribution: {c.attribution}</p>}
              <dl>
                <dt>Photograph</dt>
                <dd>
                  {c.photographer} ·{" "}
                  <a href={c.source.url} target="_blank" rel="noreferrer">
                    Original source
                  </a>
                </dd>
                <dt>License</dt>
                <dd>
                  <a href={c.licenseUrl} target="_blank" rel="noreferrer">
                    {c.license}
                  </a>
                </dd>
                <dt>Edits</dt>
                <dd>{c.modifications}</dd>
                <dt>Die scale</dt>
                <dd>
                  {c.widthMm} × {c.heightMm} mm. {c.dimensionsNote}{" "}
                  <a
                    href={c.dimensionsSource.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Dimension reference
                  </a>
                </dd>
              </dl>
              <div className="source-links">
                {c.resources.map((r, i) => (
                  <a key={i} href={r.url} target="_blank" rel="noreferrer">
                    <span>{r.kind ?? "article"}</span>
                    {r.title}
                  </a>
                ))}
              </div>
            </article>
          ))}
          <CpuLibrary playableIds={catalog.cpus.map(c => c.id)} />
          <article className="source-entry">
            <h3>Tools & additional credits</h3>
            <p>
              Viewer:{" "}
              <a
                href="https://openseadragon.github.io/"
                target="_blank"
                rel="noreferrer"
              >
                OpenSeadragon
              </a>{" "}
              (BSD-3-Clause). Image processing:{" "}
              <a
                href="https://sharp.pixelplumbing.com/"
                target="_blank"
                rel="noreferrer"
              >
                Sharp
              </a>{" "}
              (Apache-2.0). Icons:{" "}
              <a href="https://lucide.dev/" target="_blank" rel="noreferrer">
                Lucide
              </a>{" "}
              (ISC and MIT). App: React (MIT) and Vinext (MIT). Typeface:{" "}
              <a
                href="https://github.com/vercel/geist-font"
                target="_blank"
                rel="noreferrer"
              >
                Geist Mono by Vercel and Basement Studio
              </a>{" "}
              (
              <a href="/fonts/OFL.txt" target="_blank" rel="noreferrer">
                SIL Open Font License 1.1
              </a>
              ).
            </p>
            <p>
              The photograph catalog at{" "}
              <a
                href="https://sheets.works/data-viz/cpu-dies"
                target="_blank"
                rel="noreferrer"
              >
                The Data Drop
              </a>{" "}
              helped locate original sources. Visual6502 research by Greg James,
              Brian Silverman, Barry Silverman, Ijor, Segher Boessenkool, and Ed
              Spittles informs relevant circuit notes; no simulator geometry is
              redistributed.
            </p>
            <a href="/THIRD_PARTY_NOTICES.txt" target="_blank" rel="noreferrer">
              Full software license notices
            </a>
          </article>
        </div>
      </dialog>
    </main>
  );
}
