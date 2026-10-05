"use client";

/**
 * The clock the interface reads time from.
 *
 * Text that depends on the current moment ("just now", "4y ago", "Today") or on
 * the time zone (a time of day) is a hydration hazard: the server renders it at
 * one instant, in UTC, and the browser hydrates it later, in its own zone. React
 * throws on the difference (minified error #418) and regenerates the page, and
 * where the difference is suppressed it quietly keeps the server's UTC text.
 *
 * So until hydration has finished, time is read from a fixed reference that the
 * server sends with the page (the moment it rendered it) and formatted in UTC,
 * which makes the first client render identical to the server's. Once hydrated,
 * the browser's own clock and time zone take over, and one shared timer keeps
 * every relative time current.
 */

import * as React from "react";

const ReferenceContext = React.createContext<string | null>(null);

/** Supplies the server's render time, the reference used until hydration. */
export function ClockReference({ value, children }: { value: string; children: React.ReactNode }) {
  return <ReferenceContext.Provider value={value}>{children}</ReferenceContext.Provider>;
}

const TICK_MS = 30_000;

let current = 0;
let timer: ReturnType<typeof setInterval> | undefined;
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  if (!timer) {
    current = Date.now();
    timer = setInterval(() => {
      current = Date.now();
      for (const notify of listeners) notify();
    }, TICK_MS);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer) {
      clearInterval(timer);
      timer = undefined;
    }
  };
}

function getSnapshot(): number {
  if (current === 0) current = Date.now();
  return current;
}

const getServerSnapshot = (): null => null;

export interface Clock {
  /** Milliseconds since the epoch: the browser's clock, or the reference before hydration. */
  now: number;
  /** False while rendering on the server and during hydration. */
  live: boolean;
  /** The zone times are shown in: the browser's own once live, UTC before. */
  timeZone: string | undefined;
}

export function useClock(): Clock {
  const live = React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const reference = React.useContext(ReferenceContext);
  return React.useMemo<Clock>(() => {
    if (live !== null) return { now: live, live: true, timeZone: undefined };
    const fixed = reference ? Date.parse(reference) : Number.NaN;
    return { now: Number.isNaN(fixed) ? 0 : fixed, live: false, timeZone: "UTC" };
  }, [live, reference]);
}
