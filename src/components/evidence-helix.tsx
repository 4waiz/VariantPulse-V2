"use client";

/**
 * The interactive helix in the home hero.
 *
 * The drawing is three.js (see `three/helix-scene`), loaded only once the page
 * is in the browser. Until then, and wherever WebGL is unavailable, the
 * illustrated SVG helix stands in, so the hero never shows an empty column.
 *
 * Every monitored finding is a real link laid over its base pair: hovering one
 * or reaching it from the keyboard shows what changed, and choosing it opens
 * the variant. The links form one tab stop, and the arrow keys move between
 * them in genome order, turning the helix to bring each one round.
 */

import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { HeroHelix } from "@/components/hero-helix";
import { ClassificationBadge } from "@/components/ui";
import { useDisplayed } from "@/components/use-displayed";
import type { VariantAssessment } from "@/lib/analysis";
import { CHANGE_TYPES, meta } from "@/lib/classification";
import { inGenomeOrder, locusOf } from "@/lib/genome";
import { SIGNALS, SIGNAL_OF, SIGNAL_ORDER, type Signal } from "@/lib/signal";
import { cn } from "@/lib/utils";

import type { HelixController, HelixPoint } from "./three/helix-scene";

interface Finding {
  key: string;
  assessment: VariantAssessment;
  signal: Signal;
  band: string | null;
}

/** Genome order, so neighbours on the helix are neighbours on the genome. */
function orderFindings(assessments: VariantAssessment[]): Finding[] {
  return inGenomeOrder(assessments).map((assessment) => ({
    key: assessment.variant.key,
    assessment,
    signal: SIGNAL_OF[assessment.changeType],
    band: locusOf(assessment.evidence)?.band ?? null,
  }));
}

const TIP_WIDTH = 262;
const TIP_GAP = 16;

/**
 * Motes drifting round the helix, as on the illustration: a few bright specks
 * and a few out-of-focus discs. Placed in percent of the figure, so they hold
 * the composition at every width. Decorative only.
 */
const MOTES: readonly { x: number; y: number; size: number; tone: "vermilion" | "amber" | "rose"; soft?: boolean; delay: number }[] = [
  { x: 8, y: 18, size: 9, tone: "vermilion", delay: 0 },
  { x: 22, y: 6, size: 5, tone: "amber", delay: 1.4 },
  { x: 4, y: 64, size: 46, tone: "rose", soft: true, delay: 0.6 },
  { x: 30, y: 88, size: 6, tone: "vermilion", delay: 2.2 },
  { x: 47, y: 2, size: 4, tone: "vermilion", delay: 3.1 },
  { x: 62, y: 92, size: 5, tone: "amber", delay: 0.9 },
  { x: 74, y: 10, size: 7, tone: "vermilion", delay: 2.7 },
  { x: 90, y: 58, size: 6, tone: "vermilion", delay: 1.8 },
  { x: 86, y: 84, size: 54, tone: "rose", soft: true, delay: 2.4 },
  { x: 16, y: 40, size: 34, tone: "rose", soft: true, delay: 3.6 },
  { x: 96, y: 26, size: 4, tone: "amber", delay: 0.3 },
];

const MOTE_TONE = {
  vermilion: "bg-vermilion/70",
  amber: "bg-amber/70",
  rose: "bg-[radial-gradient(closest-side,rgba(236,150,172,0.42),rgba(236,150,172,0))]",
} as const;

export function EvidenceHelix({
  assessments,
  leadKey,
  scanning,
  onReadyChange,
  describedBy,
  className,
}: {
  assessments: VariantAssessment[];
  leadKey: string | null;
  scanning: boolean;
  /** Told when the 3D helix is on screen, so a legend outside the figure can show with it. */
  onReadyChange?: (ready: boolean) => void;
  /** Id of the legend that explains the helix. */
  describedBy?: string;
  className?: string;
}) {
  const findings = React.useMemo(() => orderFindings(assessments), [assessments]);
  const [status, setStatus] = React.useState<"loading" | "ready" | "failed">("loading");

  React.useEffect(() => {
    onReadyChange?.(status === "ready");
  }, [status, onReadyChange]);
  const [dragging, setDragging] = React.useState(false);
  const [hoverKey, setHoverKey] = React.useState<string | null>(null);
  const [focusKey, setFocusKey] = React.useState<string | null>(null);
  const [roving, setRoving] = React.useState(0);

  const activeKey = dragging ? null : (hoverKey ?? focusKey);
  const active = findings.find((f) => f.key === activeKey) ?? null;

  const stageRef = React.useRef<HTMLDivElement>(null);
  const interactiveRef = React.useRef<HTMLDivElement>(null);
  const tipRef = React.useRef<HTMLDivElement>(null);
  const controllerRef = React.useRef<HelixController | null>(null);
  const spotRefs = React.useRef(new Map<string, HTMLAnchorElement>());
  const points = React.useRef(new Map<string, HelixPoint>());
  const activeRef = React.useRef<string | null>(null);
  activeRef.current = activeKey;
  // Hidden below the md breakpoint: nothing is loaded until the column is on screen.
  const displayed = useDisplayed(interactiveRef);

  const sceneFindings = React.useMemo(
    () => findings.map(({ key, signal }) => ({ key, signal })),
    [findings],
  );
  const latest = React.useRef({ sceneFindings, leadKey });
  latest.current = { sceneFindings, leadKey };

  /** Lays the tooltip beside its finding, inside the stage, flipping below near the top. */
  const placeTip = React.useCallback(() => {
    const tip = tipRef.current;
    const stage = stageRef.current;
    const key = activeRef.current;
    const point = key ? points.current.get(key) : undefined;
    if (!tip || !stage || !point) return;
    const width = stage.clientWidth;
    const height = tip.offsetHeight;
    const x = Math.min(Math.max(point.x - TIP_WIDTH / 2, -12), width - TIP_WIDTH + 12);
    const above = point.y - height - TIP_GAP;
    // Above the finding when it fits inside the stage, otherwise below it.
    const y = above < 0 ? point.y + TIP_GAP : above;
    tip.style.transform = `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0)`;
  }, []);

  const placeSpot = (key: string, element: HTMLAnchorElement) => {
    const point = points.current.get(key);
    if (!point) return;
    element.style.transform = `translate3d(${point.x}px, ${point.y}px, 0)`;
    // Round the back of the helix a nucleotide is hidden, so it cannot be picked there.
    element.dataset.front = String(point.front);
  };

  // Mount the scene once; later changes reach it through the controller.
  React.useEffect(() => {
    const stageHost = stageRef.current;
    const interactive = interactiveRef.current;
    if (!displayed || !stageHost || !interactive) return;

    let cancelled = false;
    let controller: HelixController | null = null;

    import("./three/helix-scene").then(
      ({ mountHelix }) => {
        if (cancelled) return;
        try {
          controller = mountHelix(stageHost, interactive, {
            findings: latest.current.sceneFindings,
            leadKey: latest.current.leadKey,
            onProject(projected) {
              for (const point of projected) {
                points.current.set(point.key, point);
                const spot = spotRefs.current.get(point.key);
                if (spot) placeSpot(point.key, spot);
              }
              placeTip();
            },
            onReady: () => setStatus("ready"),
            onLost: () => {
              // Nothing is drawn again after a lost context: free it and keep the illustration.
              controller?.dispose();
              controller = null;
              controllerRef.current = null;
              setStatus("failed");
            },
            onDragChange: setDragging,
          });
          controllerRef.current = controller;
        } catch {
          setStatus("failed");
        }
      },
      () => {
        if (!cancelled) setStatus("failed");
      },
    );

    return () => {
      cancelled = true;
      controller?.dispose();
      controllerRef.current = null;
    };
  }, [displayed, placeTip]);

  React.useEffect(() => {
    controllerRef.current?.setFindings(sceneFindings, leadKey);
  }, [sceneFindings, leadKey]);

  React.useEffect(() => {
    controllerRef.current?.setActive(activeKey, hoverKey === null && focusKey !== null);
  }, [activeKey, hoverKey, focusKey]);

  React.useEffect(() => {
    controllerRef.current?.setScanning(scanning);
  }, [scanning, status]);

  React.useLayoutEffect(() => {
    placeTip();
  }, [activeKey, placeTip]);

  const onKeyDown = (event: React.KeyboardEvent) => {
    const moves: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    let next: number | null = null;
    if (event.key in moves) next = (roving + moves[event.key] + findings.length) % findings.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = findings.length - 1;
    if (next === null) return;
    event.preventDefault();
    setRoving(next);
    spotRefs.current.get(findings[next].key)?.focus();
  };

  const ready = status === "ready";

  return (
    <figure className={cn("relative m-0", className)} aria-describedby={describedBy}>
      {/* A blush disc behind the form and motes drifting round it, as on the illustration. */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 aspect-square w-[min(78%,330px)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(240,170,192,0.6),rgba(244,196,212,0.34)_58%,rgba(244,196,212,0)_100%)]" />
        <div className="absolute left-1/2 top-1/2 aspect-square w-[min(56%,236px)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/60 bg-[radial-gradient(closest-side,rgba(255,255,255,0.28),rgba(255,255,255,0))]" />
        {MOTES.map((mote, index) => (
          <span
            key={index}
            className={cn("vp-drift absolute rounded-full", MOTE_TONE[mote.tone], mote.soft ? "" : "blur-[0.4px]")}
            style={{
              left: `${mote.x}%`,
              top: `${mote.y}%`,
              width: mote.size,
              height: mote.size,
              animationDelay: `-${mote.delay}s`,
              animationDuration: `${7 + (index % 4)}s`,
            }}
          />
        ))}
      </div>

      <div
        ref={interactiveRef}
        className={cn(
          "relative h-[250px] touch-pan-y select-none xl:h-[296px]",
          ready && (dragging ? "cursor-grabbing" : "cursor-grab"),
        )}
      >
        {/* The illustration holds the column until the 3D helix has drawn its first frame. */}
        <HeroHelix
          className={cn(
            "pointer-events-none absolute inset-0 m-auto h-[210px] w-full transition-opacity duration-700 xl:h-[250px]",
            ready ? "opacity-0" : "opacity-100",
          )}
        />

        <div
          ref={stageRef}
          className={cn(
            "absolute inset-0 transition-opacity duration-700 [mask-image:radial-gradient(ellipse_72%_68%_at_50%_50%,#000_66%,transparent_100%)]",
            ready ? "opacity-100" : "opacity-0",
          )}
        />

        {ready ? (
          <div
            role="group"
            aria-label="Monitored findings in genome order. Use the arrow keys to move between them."
            onKeyDown={onKeyDown}
            className={cn("absolute inset-0", dragging && "pointer-events-none")}
          >
            {findings.map((finding, index) => {
              const { variant, recordedCode, currentCode } = finding.assessment;
              return (
                <Link
                  key={finding.key}
                  href={`/variants/${encodeURIComponent(finding.key)}`}
                  ref={(element) => {
                    if (element) {
                      spotRefs.current.set(finding.key, element);
                      placeSpot(finding.key, element);
                    } else {
                      spotRefs.current.delete(finding.key);
                    }
                  }}
                  tabIndex={index === roving ? 0 : -1}
                  draggable={false}
                  aria-label={`${variant.gene} ${variant.hgvsCoding}: ${meta(recordedCode).label} on record, ${meta(currentCode).label} now. ${SIGNALS[finding.signal].label}.`}
                  onPointerEnter={() => setHoverKey(finding.key)}
                  onPointerLeave={() => setHoverKey((key) => (key === finding.key ? null : key))}
                  onFocus={(event) => {
                    setRoving(index);
                    // Only keyboard focus turns the helix; a press that starts a drag also focuses the link.
                    if (event.currentTarget.matches(":focus-visible")) setFocusKey(finding.key);
                  }}
                  onBlur={() => setFocusKey((key) => (key === finding.key ? null : key))}
                  className="absolute left-0 top-0 -ml-3 -mt-3 h-6 w-6 cursor-pointer rounded-full focus-visible:outline-offset-0 data-[front=false]:pointer-events-none"
                />
              );
            })}
          </div>
        ) : null}

        {active ? (
          <div
            ref={tipRef}
            aria-hidden
            style={{ width: TIP_WIDTH }}
            className="vp-float pointer-events-none absolute left-0 top-0 z-20 px-3.5 py-3"
          >
            <p className="flex items-baseline justify-between gap-2">
              <span className="min-w-0 truncate text-[13px] font-semibold text-ink">
                {active.assessment.variant.gene}{" "}
                <span className="font-normal text-ink-2">{active.assessment.variant.hgvsCoding}</span>
              </span>
              {active.band ? (
                <span className="shrink-0 text-[12px] text-faint vp-num">{active.band}</span>
              ) : null}
            </p>
            <span className="mt-2 flex flex-wrap items-center gap-1.5">
              <ClassificationBadge code={active.assessment.recordedCode} />
              <ArrowRight className="h-3 w-3 text-faint" />
              <ClassificationBadge code={active.assessment.currentCode} />
            </span>
            <span className="mt-2 flex items-center gap-1.5 text-[12px] text-muted">
              <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", SIGNALS[active.signal].dot)} />
              {CHANGE_TYPES[active.assessment.changeType].label}
              <span className="text-faint">·</span>
              <span className="vp-num">
                {active.assessment.impactedRecordCount} record
                {active.assessment.impactedRecordCount === 1 ? "" : "s"}
              </span>
            </span>
          </div>
        ) : null}
      </div>
    </figure>
  );
}

/**
 * What the helix's colours mean, counted from the same findings it draws. It
 * sits under the hero text rather than under the helix, and shows only once
 * the 3D helix is on screen: the illustration that stands in before then does
 * not mark findings.
 */
export function HelixLegend({
  assessments,
  ready,
  id,
  className,
}: {
  assessments: VariantAssessment[];
  ready: boolean;
  id?: string;
  className?: string;
}) {
  const counts = SIGNAL_ORDER.map((signal) => ({
    signal,
    count: assessments.filter((a) => SIGNAL_OF[a.changeType] === signal).length,
  })).filter((c) => c.count > 0);

  return (
    <div
      id={id}
      className={cn("transition-opacity duration-700", ready ? "opacity-100" : "opacity-0", className)}
    >
      <p className="flex flex-wrap items-center gap-x-6 gap-y-1 text-[14px] text-muted">
        {counts.map(({ signal, count }) => (
          <span key={signal} className="inline-flex items-center gap-2 whitespace-nowrap">
            <span className={cn("h-2.5 w-2.5 rounded-full", SIGNALS[signal].dot)} />
            <span>
              <span className="vp-num">{count}</span> {SIGNALS[signal].label.toLowerCase()}
            </span>
          </span>
        ))}
      </p>
      <p className="mt-1.5 text-[12.5px] text-faint">Genome order, not to scale · drag to turn</p>
    </div>
  );
}
