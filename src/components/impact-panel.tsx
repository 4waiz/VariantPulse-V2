"use client";

/**
 * The figures row on the home dashboard: what the scan covered and what it
 * stands in for. The first two figures are read from the analysis and the scan
 * time is measured; the third is an estimate and says so beneath it.
 *
 * "Cases surfaced" is the review queue itself, so it always matches the queue
 * and the alert count in the top bar, split the way the helix legend splits it.
 *
 * Each figure has a small chart of the series behind it (see `impactSeries`),
 * shown wherever its card is wide enough to keep the figure clear of it.
 */

import * as React from "react";
import { Clock, Database, FileText } from "lucide-react";

import { MiniArea, MiniBars } from "@/components/mini-chart";
import { Card } from "@/components/ui";
import type { VariantAssessment } from "@/lib/analysis";
import {
  MINUTES_PER_MANUAL_CHECK,
  caseBreakdown,
  estimatedHoursSaved,
  formatScanSeconds,
  impactSeries,
} from "@/lib/impact";
import { cn, formatNumber } from "@/lib/utils";

export function ImpactPanel({
  findingsChecked,
  assessments,
  cases,
  scanMs,
  className,
}: {
  findingsChecked: number;
  /** Every monitored variant's assessment, for the per-gene series. */
  assessments: VariantAssessment[];
  /** Every assessment that opens a review case: the queue. */
  cases: VariantAssessment[];
  /** Measured duration of the analysis run, when known. */
  scanMs: number | null;
  className?: string;
}) {
  const hours = estimatedHoursSaved(findingsChecked);
  const split = caseBreakdown(cases);
  const series = React.useMemo(() => impactSeries(assessments, cases), [assessments, cases]);

  return (
    <div role="group" aria-label="Impact" className={cn("grid gap-3.5 sm:grid-cols-3", className)}>
      <ImpactStat
        icon={<Database className="h-[22px] w-[22px]" strokeWidth={1.75} />}
        tile="bg-tile-rose text-accent"
        label="Findings scanned"
        value={formatNumber(findingsChecked)}
        detail={scanMs === null ? "At the last evidence sync" : `Scanned in ${formatScanSeconds(scanMs)}`}
        chart={
          <MiniBars
            values={series.findingsPerGene}
            title={`Findings checked per gene, in genome order: ${series.genes.join(", ")}`}
            className="text-accent"
          />
        }
      />
      <ImpactStat
        icon={<FileText className="h-[22px] w-[22px]" strokeWidth={1.75} />}
        tile="bg-tile-amber text-warn"
        label="Cases surfaced"
        value={formatNumber(split.total)}
        detail={`${formatNumber(split.reclassified)} reclassified · ${formatNumber(split.conflictOrRegional)} conflict or regional`}
        chart={
          <MiniBars
            values={series.casesPerGene}
            title={`Review cases per gene, in genome order: ${series.genes.join(", ")}`}
            className="text-amber"
          />
        }
      />
      <ImpactStat
        icon={<Clock className="h-[22px] w-[22px]" strokeWidth={1.75} />}
        tile="bg-tile-green text-ok"
        label="Estimated clinician time saved"
        value={
          hours < 1.5
            ? `${formatNumber(Math.round(hours * 60))} minutes`
            : `${formatNumber(Math.round(hours))} hours`
        }
        detail={`Estimate · assumes ~${MINUTES_PER_MANUAL_CHECK} min manual ClinVar lookup per finding`}
        chart={
          <MiniArea
            values={series.minutesRunning}
            title={`Estimated minutes saved, adding up gene by gene in genome order: ${series.genes.join(", ")}`}
            className="text-ok"
          />
        }
      />
    </div>
  );
}

function ImpactStat({
  icon,
  tile,
  label,
  value,
  detail,
  chart,
}: {
  icon: React.ReactNode;
  /** Background and icon colour of the tile. */
  tile: string;
  label: string;
  value: string;
  detail: string;
  chart: React.ReactNode;
}) {
  return (
    <Card className="@container min-w-0 px-5 py-[18px]">
      <div className="flex items-center gap-3.5">
        <span
          aria-hidden
          className={cn("hidden h-12 w-12 shrink-0 place-items-center rounded-2xl @min-[16rem]:grid", tile)}
        >
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-faint">{label}</p>
          <div className="relative mt-1.5 @min-[18rem]:pr-[84px]">
            <p className="text-[24px] font-bold leading-[30px] tracking-[-0.03em] text-ink vp-num @min-[16rem]:text-[26px] @min-[20rem]:text-[28px]">
              {value}
            </p>
            <div className="absolute right-0 top-1/2 hidden -translate-y-1/2 @min-[18rem]:block">{chart}</div>
          </div>
          <p className="mt-2 text-[13px] leading-snug text-muted">{detail}</p>
        </div>
      </div>
    </Card>
  );
}
