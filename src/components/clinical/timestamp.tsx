"use client";

import { useClock } from "@/components/clock";
import { formatMoment } from "@/lib/utils";

/**
 * An absolute timestamp for the audit trail, with its time zone named. The
 * server and the hydrating browser both print it in UTC, so they agree; the
 * browser then shows it in the reader's own zone (see `clock.tsx`).
 */
export function Timestamp({ value, className }: { value: string; className?: string }) {
  const { timeZone } = useClock();
  return (
    <time dateTime={value} className={className}>
      {formatMoment(value, timeZone)}
    </time>
  );
}
