/**
 * The small charts beside the home dashboard's figures.
 *
 * Each draws the series behind the figure it sits beside, never an ornament
 * standing in for data, and its title says what it plots (shown on hover).
 * The figure itself carries the information, so the chart is hidden from
 * assistive technology. Colour comes from the CSS `color` of the chart, so the
 * caller picks the tone with a text class.
 *
 * Coordinates are rounded before they reach the DOM, so the server and the
 * browser write identical markup.
 */

import * as React from "react";

import { cn } from "@/lib/utils";

const round = (value: number) => Math.round(value * 100) / 100;

/** A gradient id that is safe inside `url(#…)`. */
function useGradientId(prefix: string): string {
  return `${prefix}-${React.useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
}

export function MiniBars({
  values,
  title,
  width = 76,
  height = 40,
  barWidth,
  gap,
  fade = true,
  className,
}: {
  values: number[];
  title: string;
  width?: number;
  height?: number;
  /** Fixed bar width; by default the bars share the width evenly. */
  barWidth?: number;
  gap?: number;
  /** Fades the bars in from the left, as the figure's own colour rises. */
  fade?: boolean;
  className?: string;
}) {
  const gradient = useGradientId("vp-bars");
  const max = Math.max(1, ...values);
  const pitch = barWidth !== undefined ? barWidth + (gap ?? barWidth / 2) : width / Math.max(values.length, 1);
  const bar = barWidth ?? Math.max(1.5, Math.min(pitch * 0.62, 10));
  // Fixed-width bars are centred; shared-width bars fill the box.
  const offset = (width - pitch * values.length + (pitch - bar)) / 2;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      className={cn("block overflow-visible", className)}
      aria-hidden
      focusable="false"
    >
      <title>{title}</title>
      <defs>
        <linearGradient id={gradient} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2={width} y2="0">
          <stop offset="0%" stopColor="currentColor" stopOpacity={fade ? 0.14 : 0.5} />
          <stop offset="100%" stopColor="currentColor" stopOpacity={fade ? 0.62 : 0.5} />
        </linearGradient>
      </defs>
      <g fill={`url(#${gradient})`}>
        {values.map((value, index) => {
          if (value <= 0) return null;
          const h = Math.max(3, (value / max) * height);
          return (
            <rect
              key={index}
              x={round(offset + index * pitch)}
              y={round(height - h)}
              width={round(bar)}
              height={round(h)}
              rx={round(Math.min(bar / 2, 3))}
            />
          );
        })}
      </g>
    </svg>
  );
}

export function MiniArea({
  values,
  title,
  width = 76,
  height = 40,
  className,
}: {
  values: number[];
  title: string;
  width?: number;
  height?: number;
  className?: string;
}) {
  const gradient = useGradientId("vp-area");
  const max = Math.max(1, ...values);
  const step = width / Math.max(values.length - 1, 1);
  // A little headroom so the stroke is not clipped at the top.
  const points = values.map((value, index): [number, number] => [index * step, height - (value / max) * (height - 2)]);
  const line = monotonePath(points);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      className={cn("block overflow-visible", className)}
      aria-hidden
      focusable="false"
    >
      <title>{title}</title>
      <defs>
        <linearGradient id={gradient} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2={height}>
          <stop offset="0%" stopColor="currentColor" stopOpacity={0.3} />
          <stop offset="100%" stopColor="currentColor" stopOpacity={0} />
        </linearGradient>
      </defs>
      {line ? (
        <>
          <path d={`${line}L${round(width)},${height}L0,${height}Z`} fill={`url(#${gradient})`} />
          <path d={line} fill="none" stroke="currentColor" strokeOpacity={0.5} strokeWidth={1.5} strokeLinecap="round" />
        </>
      ) : null}
    </svg>
  );
}

/** One bar split into parts by their share of the whole, each part its own colour. */
export function MiniSplit({
  parts,
  title,
  className,
}: {
  parts: { value: number; className: string }[];
  title: string;
  className?: string;
}) {
  return (
    <span aria-hidden title={title} className={cn("flex h-1.5 gap-[3px]", className)}>
      {parts.map((part, index) =>
        part.value > 0 ? (
          <span
            key={index}
            className={cn("h-full min-w-1.5 rounded-full", part.className)}
            style={{ flex: `${part.value} 1 0` }}
          />
        ) : null,
      )}
    </span>
  );
}

/**
 * A smooth path through the points that never overshoots them (monotone cubic
 * interpolation, Fritsch and Carlson), so a running total never appears to dip.
 */
function monotonePath(points: [number, number][]): string {
  const n = points.length;
  if (n < 2) return "";
  const slopes: number[] = [];
  for (let i = 0; i < n - 1; i += 1) {
    slopes.push((points[i + 1][1] - points[i][1]) / (points[i + 1][0] - points[i][0]));
  }
  const tangents = points.map((_, i) => {
    if (i === 0) return slopes[0];
    if (i === n - 1) return slopes[n - 2];
    return slopes[i - 1] * slopes[i] <= 0 ? 0 : (slopes[i - 1] + slopes[i]) / 2;
  });
  for (let i = 0; i < n - 1; i += 1) {
    if (slopes[i] === 0) {
      tangents[i] = 0;
      tangents[i + 1] = 0;
      continue;
    }
    const a = tangents[i] / slopes[i];
    const b = tangents[i + 1] / slopes[i];
    const s = a * a + b * b;
    if (s > 9) {
      const k = 3 / Math.sqrt(s);
      tangents[i] = k * a * slopes[i];
      tangents[i + 1] = k * b * slopes[i];
    }
  }

  let d = `M${round(points[0][0])},${round(points[0][1])}`;
  for (let i = 0; i < n - 1; i += 1) {
    const [x0, y0] = points[i];
    const [x1, y1] = points[i + 1];
    const h = (x1 - x0) / 3;
    d += `C${round(x0 + h)},${round(y0 + tangents[i] * h)} ${round(x1 - h)},${round(y1 - tangents[i + 1] * h)} ${round(x1)},${round(y1)}`;
  }
  return d;
}
