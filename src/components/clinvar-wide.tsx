"use client";

/**
 * The scale of the problem beside this workspace's share of it: how many
 * variants crossed between uncertain significance and the pathogenic band
 * across all of ClinVar, and how many of the monitored variants did the same.
 *
 * The ClinVar-wide half is a fixed, cited count (`data/clinvar-wide`). The
 * workspace half is computed here from the analysis, over the variants whose
 * classification on record is ClinVar's own January 2023 reading, so both halves
 * compare the same two things. The modelled hospital report is left out because
 * ClinVar held no classification for it in January 2023.
 */

import { ArrowRight, ExternalLink } from "lucide-react";

import { Badge, Card } from "@/components/ui";
import { CLINVAR_WIDE } from "@/data/clinvar-wide";
import type { VariantAssessment } from "@/lib/analysis";
import { meta } from "@/lib/classification";
import { reclassificationShifts } from "@/lib/impact";
import { cn, formatNumber } from "@/lib/utils";

export function ClinVarWideStrip({
  assessments,
  className,
}: {
  assessments: VariantAssessment[];
  className?: string;
}) {
  const own = reclassificationShifts(assessments);

  return (
    <Card
      role="group"
      aria-label="Reclassification across ClinVar and in this workspace"
      className={cn("grid divide-y divide-line md:grid-cols-2 md:divide-x md:divide-y-0", className)}
    >
      <Half
        tag="ClinVar-wide"
        tagTone="neutral"
        period={`${CLINVAR_WIDE.fromLabel} → ${CLINVAR_WIDE.toLabel}`}
        up={CLINVAR_WIDE.vusToPathogenic}
        down={CLINVAR_WIDE.pathogenicToVus}
        scope="variants in ClinVar"
        note={
          <>
            Every variant in ClinVar that crossed between VUS and pathogenic or likely pathogenic (P/LP),
            from its archived releases. Not this workspace.{" "}
            <a
              href={CLINVAR_WIDE.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-medium text-accent hover:underline"
            >
              ClinVar archive
              <ExternalLink aria-hidden className="h-3 w-3" />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          </>
        }
      />
      <Half
        tag="This workspace"
        tagTone="accent"
        period={`${CLINVAR_WIDE.fromLabel} → now`}
        up={own.vusToPathogenic}
        down={own.pathogenicToVus}
        scope="monitored variants"
        note={`The same comparison for the ${formatNumber(own.compared)} monitored variants ClinVar classified in January 2023, against its current reading.`}
      />
    </Card>
  );
}

function Half({
  tag,
  tagTone,
  period,
  up,
  down,
  scope,
  note,
}: {
  tag: string;
  tagTone: "neutral" | "accent";
  period: string;
  up: number;
  down: number;
  /** What was counted, for the spoken label: "variants in ClinVar". */
  scope: string;
  note: React.ReactNode;
}) {
  return (
    <div className="min-w-0 px-5 py-3.5">
      <p className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
        <span
          className={cn(
            "rounded-full border px-2.5 py-1 text-[12px] font-semibold uppercase leading-none tracking-[0.07em]",
            tagTone === "accent"
              ? "border-accent-ring bg-accent-soft text-accent"
              : "border-info-border bg-info-soft text-info",
          )}
        >
          {tag}
        </span>
        <span className="text-[12px] text-muted vp-num">{period}</span>
      </p>
      <div className="mt-2.5 flex flex-wrap items-center gap-x-7 gap-y-2">
        <Shift value={up} from="VUS" to="P/LP" spoken={`${formatNumber(up)} ${scope} moved from uncertain significance to pathogenic or likely pathogenic`} />
        <Shift value={down} from="P/LP" to="VUS" spoken={`${formatNumber(down)} ${scope} moved the other way, from pathogenic or likely pathogenic to uncertain significance`} />
      </div>
      <p className="mt-2 text-[12px] leading-snug text-muted">{note}</p>
    </div>
  );
}

const PILL_TONE = { VUS: meta("VUS").tone, "P/LP": meta("PATHOGENIC").tone } as const;
const PILL_TITLE = { VUS: "Variant of uncertain significance", "P/LP": "Pathogenic or likely pathogenic" } as const;

function Shift({
  value,
  from,
  to,
  spoken,
}: {
  value: number;
  from: keyof typeof PILL_TONE;
  to: keyof typeof PILL_TONE;
  spoken: string;
}) {
  return (
    <p className="flex items-center gap-2.5">
      <span className="sr-only">{spoken}</span>
      <span aria-hidden className="text-[18px] font-semibold leading-tight tracking-tight text-ink vp-num">
        {formatNumber(value)}
      </span>
      <span aria-hidden className="inline-flex items-center gap-1.5">
        <Badge tone={PILL_TONE[from]} title={PILL_TITLE[from]}>
          {from}
        </Badge>
        <ArrowRight className="h-3.5 w-3.5 text-faint" />
        <Badge tone={PILL_TONE[to]} title={PILL_TITLE[to]}>
          {to}
        </Badge>
      </span>
    </p>
  );
}
