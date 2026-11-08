"use client";

import { useEffect, useRef } from "react";
import { Maximize2, Minus, Plus } from "lucide-react";
import { DieViewer, type ViewerControls } from "./DieViewer";
import {
  atlasDistanceMm,
  formatDistance,
  type Catalog,
  type Question,
  type RoundResult as Result,
} from "@/lib/game";

export default function RoundResult({
  catalog,
  question,
  result,
  lastRound,
  onNext,
}: {
  catalog: Catalog;
  question: Question;
  result: Result;
  lastRound: boolean;
  onNext: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const map = useRef<ViewerControls>(null);
  const nextButton = useRef<HTMLButtonElement>(null);
  const cpu = catalog.cpus.find((c) => c.id === question.cpuId)!;
  const guessedCpu = catalog.cpus.find((c) => c.id === result.guess.cpuId)!;
  const region = catalog.regions.find((r) => r.id === question.regionId);
  const distance = formatDistance(
    atlasDistanceMm(question, result.guess, catalog),
  );
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    nextButton.current?.focus({ preventScroll: true });
    return () => {
      element?.close();
    };
  }, []);

  return (
    <dialog
      ref={dialog}
      className="result-dialog reveal-card"
      aria-label="Round result"
      onCancel={(e) => e.preventDefault()}
    >
      <div
        className="result-map"
        aria-label="Guess and correct location comparison"
      >
        <DieViewer
          ref={map}
          mode="atlas"
          catalog={catalog}
          question={question}
          guess={result.guess}
          reveal
          onReady={() => map.current?.fitResult()}
        />
        <div className="comparison-legend">
          <span>
            <i className="guess-key" />
            Your guess
          </span>
          <span>
            <i className="answer-key" />
            Correct location
          </span>
        </div>
        <div className="atlas-zoom">
          <button
            aria-label="Zoom in on result map"
            onClick={() => map.current?.zoom(1.7)}
          >
            <Plus size={16} />
          </button>
          <button
            aria-label="Zoom out on result map"
            onClick={() => map.current?.zoom(1 / 1.7)}
          >
            <Minus size={16} />
          </button>
          <button
            aria-label="Fit guess and correct location"
            onClick={() => map.current?.fitResult()}
          >
            <Maximize2 size={14} />
          </button>
        </div>
      </div>
      <div className="result-body">
        <div className="result-overview">
          <div className="reveal-title">
            <span>
              {cpu.maker} · {cpu.year}
            </span>
            <h2>{cpu.name}</h2>
            <h3>{region?.name ?? "Unidentified circuitry"}</h3>
          </div>
          <div className="result-facts">
            <div className="result-distance">
              <span>{result.correctCpu ? "Distance" : "Atlas distance"}</span>
              <strong>{distance}</strong>
            </div>
            <div className="result-score">
              <span>Score</span>
              <strong>+{result.score.toLocaleString("en-US")}</strong>
            </div>
          </div>
        </div>
        {!result.correctCpu && (
          <p className="wrong-cpu">
            Your guess: {guessedCpu.maker} {guessedCpu.name} ({guessedCpu.year})
          </p>
        )}
        <div className="result-footer">
          <details className="circuit-details">
            <summary>Details & sources</summary>
            <dl className="score-breakdown" aria-label="Score breakdown">
              <div>
                <dt>Manufacturer</dt>
                <dd>{result.breakdown.manufacturer.toLocaleString("en-US")}</dd>
              </div>
              <div>
                <dt>Year</dt>
                <dd>{result.breakdown.year.toLocaleString("en-US")}</dd>
              </div>
              <div>
                <dt>Exact CPU</dt>
                <dd>{result.breakdown.cpu.toLocaleString("en-US")}</dd>
              </div>
              <div>
                <dt>Location</dt>
                <dd>{result.breakdown.location.toLocaleString("en-US")}</dd>
              </div>
            </dl>
            <p>{region?.explanation ?? "This random location falls outside the annotated regions. Its circuit function has not been identified."}</p>
            {region?.annotationMethod && (
              <p>
                Model visual estimate · {region.confidence} contour confidence.
                Function unverified; confidence is qualitative.
              </p>
            )}
            <p>
              {region ? "Approximate region boundary. " : ""}
              <a href={cpu.source.url} target="_blank" rel="noreferrer">
                Photo: {cpu.photographer}
              </a>
            </p>
            {region && <a href={region.source.url} target="_blank" rel="noreferrer">
              {region.annotationMethod
                ? "Original image evidence"
                : "Circuit notes"}
            </a>}
          </details>
          <button
            ref={nextButton}
            className="submit-button next-level"
            onClick={onNext}
          >
            {lastRound ? "Results" : "Next Level"}
          </button>
        </div>
      </div>
    </dialog>
  );
}
