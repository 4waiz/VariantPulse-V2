"use client";

/**
 * One compact row on the home dashboard: what the scan covered and what it
 * stands in for. The first two figures are read from the analysis and the scan
 * time is measured; the third is an estimate and says so beneath it.
 *
 * "Cases surfaced" is the review queue itself, so it always matches the queue
 * and the alert count in the top bar, split the way the helix legend splits it.
 */

import * as React from "react";

import { Card } from "@/components/ui";
import type { VariantAssessment } from "@/lib/analysis";
import { MINUTES_PER_MANUAL_CHECK, caseBreakdown, estimatedHoursSaved, formatScanSeconds } from "@/lib/impact";
import { cn, formatNumber } from "@/lib/utils";

export function ImpactPanel({
  findingsChecked,
  cases,
  scanMs,
  className,
}: {
  findingsChecked: number;
  /** Every assessment that opens a review case: the queue. */
  cases: VariantAssessment[];
  /** Measured duration of the analysis run, when known. */
  scanMs: number | null;
  className?: string;
}) {
  const hours = estimatedHoursSaved(findingsChecked);
  const split = caseBreakdown(cases);

  return (
    <Card
      role="group"
      aria-label="Impact"
      className={cn(
        "grid divide-y divide-line sm:grid-cols-3 sm:divide-x sm:divide-y-0",
        className,
      )}
    >
      <ImpactStat
        label="Findings scanned"
        value={formatNumber(findingsChecked)}
        detail={scanMs === null ? "At the last evidence sync" : `Scanned in ${formatScanSeconds(scanMs)}`}
      />
      <ImpactStat
        label="Cases surfaced"
        value={formatNumber(split.total)}
        detail={`${formatNumber(split.reclassified)} reclassified · ${formatNumber(split.conflictOrRegional)} conflict or regional`}
      />
      <ImpactStat
        label="Estimated clinician time saved"
        value={
          hours < 1.5
            ? `${formatNumber(Math.round(hours * 60))} minutes`
            : `${formatNumber(Math.round(hours))} hours`
        }
        detail={`Estimate · assumes ~${MINUTES_PER_MANUAL_CHECK} min manual ClinVar lookup per finding`}
      />
    </Card>
  );
}

function ImpactStat({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="min-w-0 px-5 py-3">
      <p className="text-[10.5px] font-medium uppercase tracking-[0.07em] text-faint">{label}</p>
      <p className="mt-1 text-[18px] font-semibold leading-tight tracking-tight text-ink vp-num">
        {value}
      </p>
      <p className="mt-0.5 text-[11.5px] leading-snug text-muted">{detail}</p>
    </div>
  );
}
