"use client";

import { useClock } from "@/components/clock";
import { formatDate, formatMoment, relativeTime } from "@/lib/utils";

/**
 * A timestamp rendered relative to now, with the full moment on hover.
 *
 * Read from the shared clock, so the server and the hydrating browser both
 * measure from the moment the page was rendered and print the same words; the
 * browser's own clock takes over straight after (see `clock.tsx`).
 */
export function RelativeTime({
  value,
  className,
}: {
  value: string | null | undefined;
  className?: string;
}) {
  const clock = useClock();
  const text = !value
    ? relativeTime(value)
    : clock.now === 0
      ? formatDate(value)
      : relativeTime(value, clock.now);

  return (
    <time
      dateTime={value ?? undefined}
      title={value ? formatMoment(value, clock.timeZone) : undefined}
      className={className}
    >
      {text}
    </time>
  );
}
