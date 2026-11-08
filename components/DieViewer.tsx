"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import type OpenSeadragon from "openseadragon";
import type { Catalog, Guess, Question } from "@/lib/game";
import {
  ATLAS_BOUNDS,
  MAKER_TIMELINES,
  makerColor,
  YEAR_START,
  YEAR_END,
  YEAR_SPACING,
  cpuPlacement,
  dieToWorld,
  worldToGuess,
  resultViewport,
  atlasDistanceMm,
  formatDistance,
} from "@/lib/game";

type OSD = typeof OpenSeadragon;
export type ViewerControls = {
  zoom: (factor: number) => void;
  home: () => void;
  focusCpu: (id: string) => void;
  pinCenter: () => void;
  fitResult: (immediate?: boolean) => void;
};
type Props = {
  mode: "mystery" | "atlas";
  catalog: Catalog;
  question?: Question;
  guess?: Guess | null;
  reveal?: boolean;
  onGuess?: (guess: Guess) => void;
  onReady?: () => void;
  onUnavailable?: () => void;
  onViewChange?: (state: {
    zoom: number;
    scalePx: number;
    scaleMm: number;
  }) => void;
};

export const DieViewer = forwardRef<ViewerControls, Props>(function DieViewer(
  {
    mode,
    catalog,
    question,
    guess,
    reveal,
    onGuess,
    onReady,
    onUnavailable,
    onViewChange,
  },
  ref,
) {
  const element = useRef<HTMLDivElement>(null);
  const viewer = useRef<OpenSeadragon.Viewer | null>(null);
  const osd = useRef<OSD | null>(null);
  const callbacks = useRef({ onGuess, onReady, onUnavailable, onViewChange });
  callbacks.current = { onGuess, onReady, onUnavailable, onViewChange };
  const latest = useRef({ guess, reveal, question });
  latest.current = { guess, reveal, question };
  const redraw = useRef<() => void>(() => {});
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [attempt, setAttempt] = useState(0);
  const zoom = (factor: number) => {
    const v = viewer.current;
    if (v) {
      v.viewport.zoomBy(factor);
      v.viewport.applyConstraints();
    }
  };
  const home = () => {
    const v = viewer.current,
      O = osd.current;
    if (!v || !O) return;
    if (mode === "atlas" && latest.current.reveal) {
      fitResult();
      return;
    }
    if (mode === "atlas")
      v.viewport.fitBounds(
        new O.Rect(
          ATLAS_BOUNDS.x,
          ATLAS_BOUNDS.y,
          ATLAS_BOUNDS.width,
          ATLAS_BOUNDS.height,
        ),
      );
    else {
      v.viewport.goHome(true);
      const center = v.world.getItemAt(0)?.getClippedBounds().getCenter();
      if (center) {
        v.viewport.zoomTo(v.viewport.getHomeZoom() * 2, center, true);
        v.viewport.panTo(center, true);
        v.viewport.applyConstraints(true);
      }
    }
  };
  const pinCenter = () => {
    const v = viewer.current;
    if (!v || mode !== "atlas" || latest.current.reveal) return;
    const g = worldToGuess(catalog.cpus, v.viewport.getCenter());
    if (g) callbacks.current.onGuess?.(g);
  };
  const focusCpu = (id: string) => {
    const cpu = catalog.cpus.find((c) => c.id === id),
      v = viewer.current,
      O = osd.current;
    if (cpu && v && O) {
      const p = cpuPlacement(cpu);
      const paddingX=Math.max(0.5,p.width*0.04);
      const paddingY=Math.max(0.7,p.height*0.08);
      v.viewport.fitBounds(
        new O.Rect(p.x-paddingX,p.y-paddingY,p.width+paddingX*2,p.height+paddingY*2),
      );
    }
  };
  const fitResult = (immediate = false) => {
    const v = viewer.current,
      O = osd.current,
      state = latest.current;
    if (!v || !O || !state.question || !state.guess) return;
    const bounds = resultViewport(state.question, state.guess, catalog);
    v.viewport.fitBounds(
      new O.Rect(bounds.x, bounds.y, bounds.width, bounds.height),
      immediate,
    );
  };
  useImperativeHandle(ref, () => ({
    zoom,
    home,
    focusCpu,
    pinCenter,
    fitResult,
  }));

  useEffect(() => {
    let cancelled = false;
    let v: OpenSeadragon.Viewer | null = null;
    let removeResize = () => {};
    setStatus("loading");
    callbacks.current.onUnavailable?.();
    (async () => {
      const O = (await import("openseadragon")).default;
      if (cancelled || !element.current) return;
      osd.current = O;
      v = O({
        element: element.current,
        showNavigationControl: false,
        showNavigator: false,
        animationTime: 0.45,
        blendTime: 0.15,
        immediateRender: false,
        maxImageCacheCount: 120,
        imageLoaderLimit: 6,
        visibilityRatio: 1,
        constrainDuringPan: mode === "mystery",
        minZoomImageRatio: mode === "mystery" ? 1 : 0.7,
        homeFillsViewer: mode === "mystery",
        maxZoomPixelRatio: 2,
        zoomPerScroll: 1.3,
        gestureSettingsMouse: {
          clickToZoom: false,
          dblClickToZoom: true,
          scrollToZoom: true,
        },
        gestureSettingsTouch: {
          pinchToZoom: true,
          clickToZoom: false,
          dblClickToZoom: true,
        },
        maxZoomLevel: mode === "atlas" ? Math.max(100, ATLAS_BOUNDS.width * 3) : undefined,
        tabIndex: -1,
      });
      viewer.current = v;
      const overlays: HTMLElement[] = [];
      const cpuLabels: {el: HTMLElement; widthMm:number}[] = [];
      const yearLabels: {el: HTMLElement; year:number}[] = [];
      const companyLabels: {el:HTMLElement; span:number; textWidth:number}[] = [];
      const addLabel = (text: string, x: number, y: number, cls: string) => {
        const el = document.createElement("div");
        el.className = cls;
        el.textContent = text;
        v!.addOverlay({
          element: el,
          location: new O.Point(x, y),
          placement: O.Placement.CENTER,
          checkResize: false,
        });
        return el;
      };
      let loaded = 0;
      const expected = 1;
      const ready = () => {
        if (cancelled) return;
        if (++loaded === expected) {
          setStatus("ready");
          home();
          callbacks.current.onReady?.();
        }
      };
      const error = () => {
        if (!cancelled) {
          setStatus("error");
          callbacks.current.onUnavailable?.();
        }
      };
      if (mode === "atlas") {
        // Die sizes remain millimeters; colored company spans share reusable space.
        const svg = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "svg",
        );
        svg.setAttribute("viewBox", `${ATLAS_BOUNDS.x} ${ATLAS_BOUNDS.y} ${ATLAS_BOUNDS.width} ${ATLAS_BOUNDS.height}`);
        svg.classList.add("atlas-grid");
        svg.setAttribute("aria-hidden", "true");
        for (const timeline of MAKER_TIMELINES) {
          const ns = "http://www.w3.org/2000/svg";
          const group = document.createElementNS(ns,"g");
          group.setAttribute("class","company-lineage");
          group.setAttribute("data-maker",timeline.maker);
          group.style.setProperty("--company-color",timeline.color);
          const title = document.createElementNS(ns,"title");
          title.textContent = `${timeline.maker}: photographed collection ${timeline.firstYear}–${timeline.lastYear}; not company lifespan`;
          group.appendChild(title);
          const trunk=document.createElementNS(ns,"path");
          trunk.setAttribute("d",`M ${timeline.startX} ${timeline.y} H ${timeline.endX}`);
          trunk.setAttribute("class","company-trunk");
          group.appendChild(trunk);
          for (const cpu of catalog.cpus.filter(c=>c.maker===timeline.maker)) {
            const p=cpuPlacement(cpu);
            const x=p.x+p.width/2;
            const branch=document.createElementNS(ns,"path");
            branch.setAttribute("d",`M ${x-1} ${timeline.y} Q ${x} ${timeline.y} ${x} ${timeline.y+1} V ${p.y}`);
            branch.setAttribute("class","company-branch");
            group.appendChild(branch);
          }
          svg.appendChild(group);
          const label=addLabel(timeline.maker,(timeline.startX+timeline.endX)/2,timeline.y-1.5,"company-map-label");
          label.style.setProperty("--company-color",timeline.color);
          companyLabels.push({el:label,span:timeline.endX-timeline.startX,textWidth:Math.max(36,timeline.maker.length*6+10)});
        }
        for (let year = YEAR_START; year <= YEAR_END; year++) {
          const x = (year - YEAR_START) * YEAR_SPACING;
          const line = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "line",
          );
          line.setAttribute("x1", String(x));
          line.setAttribute("x2", String(x));
          line.setAttribute("y1", String(ATLAS_BOUNDS.y + 2));
          line.setAttribute("y2", String(ATLAS_BOUNDS.y + ATLAS_BOUNDS.height));
          svg.appendChild(line);
          yearLabels.push({el:addLabel(String(year), x, ATLAS_BOUNDS.y + 15, "year-label"),year});
        }
        const grid = document.createElement("div");
        grid.className = "grid-overlay";
        grid.appendChild(svg);
        v.addOverlay({
          element: grid,
          location: new O.Rect(ATLAS_BOUNDS.x, ATLAS_BOUNDS.y, ATLAS_BOUNDS.width, ATLAS_BOUNDS.height),
          checkResize: false,
        });
        for (const cpu of catalog.cpus) {
          const p = cpuPlacement(cpu);
          const map = document.createElement("div");
          map.className = "cpu-vector-map";
          map.style.setProperty("--company-color",makerColor(cpu.maker));
          map.setAttribute(
            "aria-label",
            `${cpu.maker} ${cpu.name}, approximate circuit floorplan`,
          );
          const drawing = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "svg",
          );
          drawing.setAttribute("viewBox", "0 0 1000 1000");
          drawing.setAttribute("preserveAspectRatio", "none");
          const ns = "http://www.w3.org/2000/svg" as const;
          const base = document.createElementNS(ns, "rect");
          base.setAttribute("x", "8");
          base.setAttribute("y", "8");
          base.setAttribute("width", "984");
          base.setAttribute("height", "984");
          base.setAttribute("rx", "12");
          base.setAttribute("class", "die-outline");
          drawing.appendChild(base);
          // Unlabeled background cells and trunk routes are schematic, never traced photo pixels.
          for (let row = 0; row < (cpu.annotationMethod ? 0 : 4); row++)
            for (let col = 0; col < 4; col++) {
              const block = document.createElementNS(ns, "rect");
              block.setAttribute("x", String(90 + col * 205));
              block.setAttribute("y", String(85 + row * 210));
              block.setAttribute("width", "182");
              block.setAttribute("height", "185");
              block.setAttribute("rx", "6");
              block.setAttribute("class", "unmapped-block");
              drawing.appendChild(block);
            }
          for (const region of catalog.regions.filter(
            (r) => r.cpuId === cpu.id,
          )) {
            const block = document.createElementNS(ns, "polygon");
            block.setAttribute(
              "points",
              region.polygon
                .map((a) => `${a.x * 1000},${a.y * 1000}`)
                .join(" "),
            );
            block.setAttribute("class", `circuit-block circuit-${region.kind}`);
            drawing.appendChild(block);
          }
          for (const path of (cpu.annotationMethod ? [] : [
            "M 60 60 H 940 V 940 H 60 Z",
            "M 76 490 H 924",
            "M 490 76 V 924",
          ])) {
            const route = document.createElementNS(ns, "path");
            route.setAttribute("d", path);
            route.setAttribute("class", "schematic-route");
            drawing.appendChild(route);
          }
          for (let side = 0; side < (cpu.annotationMethod ? 0 : 4); side++)
            for (let i = 0; i < 8; i++) {
              const pad = document.createElementNS(ns, "rect");
              const t = 110 + i * 110;
              pad.setAttribute(
                "x",
                String(side === 0 ? t : side === 1 ? 946 : side === 2 ? t : 24),
              );
              pad.setAttribute(
                "y",
                String(side === 0 ? 24 : side === 1 ? t : side === 2 ? 946 : t),
              );
              pad.setAttribute("width", "30");
              pad.setAttribute("height", "30");
              pad.setAttribute("rx", "3");
              pad.setAttribute("class", "schematic-pad");
              drawing.appendChild(pad);
            }
          map.appendChild(drawing);
          v.addOverlay({
            element: map,
            location: new O.Rect(p.x, p.y, p.width, p.height),
            checkResize: false,
          });
          cpuLabels.push({el:addLabel(
            cpu.name,
            p.x + p.width / 2,
            p.y + p.height + 0.5,
            "cpu-map-label",
          ),widthMm:cpu.widthMm});
        }
        // A transparent world anchor provides navigation bounds; the atlas itself is live SVG.
        v.addTiledImage({
          tileSource: {
            type: "image",
            url:
              "data:image/svg+xml," +
              encodeURIComponent(
                `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="${1000 * ATLAS_BOUNDS.height / ATLAS_BOUNDS.width}"></svg>`,
              ),
          },
          x: ATLAS_BOUNDS.x,
          y: ATLAS_BOUNDS.y,
          width: ATLAS_BOUNDS.width,
          success: ready,
          error,
        });
      } else if (question) {
        const cpu = catalog.cpus.find((c) => c.id === question.cpuId)!;
        const n = question.neighborhood;
        v.addTiledImage({
          tileSource: question.tileSource,
          ...(question.procedural ? {
            clip: new O.Rect(n.left, n.top, n.width, n.height),
            x: -n.left / n.width,
            y: -n.top / n.width,
            width: cpu.width / n.width,
          } : {}),
          success: ready,
          error,
        });
        const marker = document.createElement("div");
        marker.className = "target-crosshair";
        marker.setAttribute("aria-label", "Original location to identify");
        marker.innerHTML = "<i></i><i></i><span></span>";
        v.addOverlay({
          element: marker,
          location: new O.Point(0.5, (question.height / question.width) * 0.5),
          placement: O.Placement.CENTER,
        });
      }
      v.addHandler("tile-load-failed", error);
      const draw = () => {
        if (!v) return;
        for (const el of overlays) v.removeOverlay(el);
        overlays.length = 0;
        if (mode !== "atlas") return;
        const state = latest.current;
        const addPin = (g: Guess, kind: string) => {
          const cpu = catalog.cpus.find((c) => c.id === g.cpuId);
          if (!cpu) return;
          const p = dieToWorld(cpu, g.point);
          const el = document.createElement("div");
          el.className = `map-pin ${kind}`;
          el.innerHTML =
            kind === "answer-pin"
              ? '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12 10 17 19 7" /></svg>'
              : "<span></span>";
          el.setAttribute(
            "aria-label",
            kind === "answer-pin" ? "Actual location" : "Your guess",
          );
          v!.addOverlay({
            element: el,
            location: new O.Point(p.x, p.y),
            placement: O.Placement.CENTER,
          });
          overlays.push(el);
        };
        if (state.guess) addPin(state.guess, "guess-pin");
        if (state.reveal && state.question) {
          const q = state.question;
          addPin({ cpuId: q.cpuId, point: q.target }, "answer-pin");
          const cpu = catalog.cpus.find((c) => c.id === q.cpuId)!,
            region = catalog.regions.find((r) => r.id === q.regionId);
          const p = cpuPlacement(cpu);
          if (region) {
            const div = document.createElement("div");
            div.className = "region-overlay";
            const shape = document.createElementNS(
              "http://www.w3.org/2000/svg",
              "svg",
            );
            shape.setAttribute("viewBox", "0 0 1000 1000");
            shape.setAttribute("preserveAspectRatio", "none");
            const poly = document.createElementNS(
              "http://www.w3.org/2000/svg",
              "polygon",
            );
            poly.setAttribute(
              "points",
              region.polygon.map((a) => `${a.x * 1000},${a.y * 1000}`).join(" "),
            );
            shape.appendChild(poly);
            div.appendChild(shape);
            v.addOverlay({
              element: div,
              location: new O.Rect(p.x, p.y, p.width, p.height),
              checkResize: false,
            });
            overlays.push(div);
          }
          if (state.guess) {
            const guessedCpu = catalog.cpus.find(
              (c) => c.id === state.guess!.cpuId,
            )!;
            const start = dieToWorld(guessedCpu, state.guess.point);
            const end = dieToWorld(cpu, q.target);
            const left = Math.min(start.x, end.x),
              top = Math.min(start.y, end.y);
            const width = Math.max(Math.abs(start.x - end.x), 0.001);
            const height = Math.max(Math.abs(start.y - end.y), 0.001);
            const connection = document.createElement("div");
            connection.className = "guess-connection";
            const svg = document.createElementNS(
              "http://www.w3.org/2000/svg",
              "svg",
            );
            svg.setAttribute("viewBox", "0 0 1000 1000");
            svg.setAttribute("preserveAspectRatio", "none");
            for (const cls of ["connection-outline", "distance-line"]) {
              const line = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "line",
              );
              line.setAttribute(
                "x1",
                String(((start.x - left) / width) * 1000),
              );
              line.setAttribute(
                "y1",
                String(((start.y - top) / height) * 1000),
              );
              line.setAttribute("x2", String(((end.x - left) / width) * 1000));
              line.setAttribute("y2", String(((end.y - top) / height) * 1000));
              line.setAttribute("class", cls);
              svg.appendChild(line);
            }
            connection.appendChild(svg);
            v.addOverlay({
              element: connection,
              location: new O.Rect(left, top, width, height),
              checkResize: false,
            });
            overlays.push(connection);
            const distance = atlasDistanceMm(q, state.guess, catalog);
            const badge = document.createElement("div");
            badge.className = `comparison-distance ${distance < 0.001 ? "same-location" : ""}`;
            const text = document.createElement("span");
            text.textContent = formatDistance(distance);
            badge.appendChild(text);
            v.addOverlay({
              element: badge,
              location: new O.Point(
                (start.x + end.x) / 2,
                (start.y + end.y) / 2,
              ),
              placement: O.Placement.CENTER,
            });
            overlays.push(badge);
          }
        }
      };
      redraw.current = draw;
      draw();
      v.addHandler("canvas-click", (event) => {
        if (mode !== "atlas" || !event.quick || latest.current.reveal) return;
        const p = v!.viewport.pointFromPixel(event.position);
        const g = worldToGuess(catalog.cpus, p);
        if (g) {
          callbacks.current.onGuess?.(g);
          event.preventDefaultAction = true;
        }
      });
      const measure = () => {
        if (!v || !element.current) return;
        const px = v.viewport.deltaPixelsFromPoints(new O.Point(1, 0), true).x;
        for (const label of cpuLabels) label.el.style.visibility = label.widthMm * px >= 34 ? "visible" : "hidden";
        const yearStep = YEAR_SPACING * px >= 40 ? 1 : YEAR_SPACING * px >= 8 ? 5 : 10;
        for (const label of yearLabels) label.el.style.visibility = label.year % yearStep === 0 ? "visible" : "hidden";
        for (const label of companyLabels) label.el.style.visibility = label.span * px >= label.textWidth ? "visible" : "hidden";
        const target = 70 / Math.max(0.001, px);
        const power = 10 ** Math.floor(Math.log10(target));
        const unit = [1, 2, 5, 10].find((n) => n * power >= target) ?? 10;
        const mm = unit * power;
        callbacks.current.onViewChange?.({
          zoom: v.viewport.getZoom() / v.viewport.getHomeZoom(),
          scalePx: mm * px,
          scaleMm: mm,
        });
      };
      v.addHandler("animation", measure);
      v.addHandler("animation-finish", measure);
      v.addHandler("resize", measure);
      v.addHandler("open", measure);
      const observer = new ResizeObserver(() => {
        if (v) {
          v.viewport.resize(
            new O.Point(
              element.current!.clientWidth,
              element.current!.clientHeight,
            ),
            true,
          );
          v.forceRedraw();
          if (mode === "atlas" && latest.current.reveal) fitResult(true);
          measure();
        }
      });
      observer.observe(element.current);
      removeResize = () => observer.disconnect();
    })().catch(() => {
      if (!cancelled) {
        setStatus("error");
        callbacks.current.onUnavailable?.();
      }
    });
    return () => {
      cancelled = true;
      removeResize();
      v?.destroy();
      viewer.current = null;
      redraw.current = () => {};
    };
    // A mystery viewer is rebuilt only when the question changes, not when a guess changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, mode === "mystery" ? question?.id : undefined, catalog, attempt]);
  useEffect(() => {
    redraw.current();
  }, [guess, reveal, question]);

  return (
    <div className={`die-viewer ${mode}-viewer`} data-status={status}>
      <div
        ref={element}
        className="osd-surface"
        tabIndex={0}
        role="application"
        aria-label={
          mode === "atlas"
            ? "CPU atlas. Arrow keys pan, plus and minus zoom, Enter places a pin at the center."
            : "Mystery die. Arrow keys pan, plus and minus zoom, Home resets."
        }
        onKeyDown={(e) => {
          const v = viewer.current,
            O = osd.current;
          if (!v || !O) return;
          const step = v.viewport.getBounds().width * 0.08;
          const directions: Record<string, [number, number]> = {
            ArrowLeft: [-step, 0],
            ArrowRight: [step, 0],
            ArrowUp: [0, -step],
            ArrowDown: [0, step],
          };
          if (directions[e.key]) {
            e.preventDefault();
            v.viewport.panBy(new O.Point(...directions[e.key]));
            v.viewport.applyConstraints();
          } else if (e.key === "+" || e.key === "=") {
            e.preventDefault();
            zoom(1.4);
          } else if (e.key === "-") {
            e.preventDefault();
            zoom(1 / 1.4);
          } else if (e.key === "Home") {
            e.preventDefault();
            home();
          } else if (e.key === "Enter" && mode === "atlas") {
            e.preventDefault();
            pinCenter();
          }
        }}
      />
      {status === "loading" && (
        <div className="viewer-loading">
          <span className="loading-orbit" />
          Loading silicon…
        </div>
      )}
      {status === "error" && (
        <div className="viewer-error">
          <span>Image tiles could not be loaded.</span>
          <button onClick={() => setAttempt((a) => a + 1)}>Retry images</button>
        </div>
      )}
    </div>
  );
});
