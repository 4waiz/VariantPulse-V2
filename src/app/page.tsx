"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  ClipboardList,
  Clock,
  Database,
  Dna,
  FileSearch,
  FileText,
  Globe2,
  History,
  Shield,
  ShieldCheck,
  Users,
} from "lucide-react";

import { ClinVarWideStrip } from "@/components/clinvar-wide";
import { EvidenceHelix, HelixLegend } from "@/components/evidence-helix";
import { ImpactPanel } from "@/components/impact-panel";
import { evidenceModeMeta } from "@/components/story/mode";
import { SyncButton } from "@/components/sync";
import { Badge, Card, EmptyState, StatusDot } from "@/components/ui";
import { REGIONAL_SOURCE } from "@/data/regional";
import type { VariantAssessment } from "@/lib/analysis";
import { meta, type ClassificationCode, type Tone } from "@/lib/classification";
import { pick } from "@/lib/dto";
import { selectStoryAssessment } from "@/lib/story";
import { cn, formatDate } from "@/lib/utils";
import { useWorkspace } from "@/state/workspace";

export default function HomePage() {
  const { analysis, scanMs, sync } = useWorkspace();
  // The headline change the story tests pin down, else the top-ranked case, so
  // the page always shows a change the dataset really holds.
  const lead =
    selectStoryAssessment(analysis.assessments) ?? pick(analysis, analysis.reviewableKeys)[0];

  return (
    <div className="mx-auto w-full max-w-[1360px] space-y-3.5 px-5 pb-3 sm:px-6 lg:px-8">
      <Hero lead={lead} assessments={analysis.assessments} scanning={sync.phase === "running"} />

      <ImpactPanel
        findingsChecked={analysis.scan.findingsChecked}
        assessments={analysis.assessments}
        cases={pick(analysis, analysis.reviewableKeys)}
        scanMs={scanMs}
      />

      <ClinVarWideStrip assessments={analysis.assessments} />

      {lead ? (
        <>
          <HowItWorks lead={lead} />
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.72fr)_minmax(0,1fr)]">
            <RealExample lead={lead} />
            <DataSources mode={analysis.mode} />
          </div>
        </>
      ) : (
        <Card>
          <EmptyState
            icon={<ShieldCheck className="h-5 w-5" />}
            title="No evidence changes right now"
            description="Every result on record still matches current evidence."
          />
        </Card>
      )}

      <Card className="flex flex-wrap items-center gap-4 p-4 sm:flex-nowrap sm:px-5">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
          <ShieldCheck className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1 basis-60">
          <p className="text-[17px] font-semibold text-ink">AI assists. Clinicians decide.</p>
          <p className="mt-0.5 text-[16px] leading-relaxed text-muted">
            VariantPulse highlights changes in scientific evidence to support clinical teams. It does
            not alter patient records and does not make a diagnosis.
          </p>
        </div>
        <Link
          href="/pilot"
          className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-line-2 bg-surface px-3.5 py-2 text-[13px] font-medium text-accent transition-colors hover:bg-canvas"
        >
          How a partner evaluates it
          <ArrowRight className="h-4 w-4" />
        </Link>
        <span className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-line-2 bg-surface px-3.5 py-2 text-[13px] font-medium text-ink-2">
          <Shield className="h-4 w-4 text-muted" />
          Not a diagnosis
        </span>
      </Card>
    </div>
  );
}

/* -- Hero ------------------------------------------------------------------ */

function Hero({
  lead,
  assessments,
  scanning,
}: {
  lead: VariantAssessment | undefined;
  assessments: VariantAssessment[];
  scanning: boolean;
}) {
  const [helixReady, setHelixReady] = React.useState(false);
  const legendId = React.useId();

  return (
    <section className="grid items-center gap-4 md:grid-cols-[minmax(0,1fr)_minmax(250px,0.8fr)] xl:grid-cols-[minmax(0,1fr)_340px] min-[90rem]:grid-cols-[minmax(0,1fr)_288px_276px]">
      {/* Above the helix, which reaches back under the end of the heading. */}
      <div className="relative z-10 pb-3 pt-6 md:pt-9 min-[90rem]:pl-3">
        <h1 className="text-[32px] font-bold leading-[1.08] tracking-[-0.04em] text-ink min-[400px]:text-[36px] md:text-[clamp(34px,3.7vw,54px)]">
          The same DNA.
          <span className="block text-accent">A different meaning.</span>
        </h1>
        <p className="mt-3 max-w-[30rem] text-[16px] leading-[1.5] text-muted xl:text-[17px]">
          VariantPulse watches old genetic test results and flags when new scientific evidence
          changes what they mean.
        </p>
        <HelixLegend
          id={legendId}
          assessments={assessments}
          ready={helixReady}
          className="mt-6 hidden md:block"
        />
      </div>

      <EvidenceHelix
        assessments={assessments}
        leadKey={lead?.variant.key ?? null}
        scanning={scanning}
        onReadyChange={setHelixReady}
        describedBy={legendId}
        className="hidden md:-ml-8 md:block xl:-ml-16 min-[90rem]:-ml-24"
      />

      {/* Only the widest screens have room for this card beside the helix. */}
      <Link
        href={lead ? `/variants/${encodeURIComponent(lead.variant.key)}` : "/variants"}
        className="vp-glass-blush group relative z-10 hidden p-5 transition-shadow hover:shadow-[0_28px_54px_-28px_rgba(72,26,39,0.5)] min-[90rem]:block"
      >
        <span className="flex items-start gap-3">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[radial-gradient(closest-side,rgba(240,196,210,0.75),rgba(240,196,210,0))] text-accent">
            <Dna className="h-8 w-8" strokeWidth={1.6} />
          </span>
          <span className="min-w-0 flex-1 pt-1 text-[16px] font-semibold leading-snug tracking-tight text-ink">
            Your DNA didn&rsquo;t change.
            <span className="mt-0.5 block text-[21px] font-bold tracking-[-0.025em] text-accent">
              Science did.
            </span>
          </span>
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface text-accent shadow-[0_6px_16px_-8px_rgba(72,26,39,0.45)] transition-transform group-hover:translate-x-0.5">
            <ArrowRight className="h-4 w-4" />
          </span>
        </span>
        <span className="mt-4 block text-[15px] leading-relaxed text-muted">
          We monitor scientific evidence so patients can benefit from new knowledge.
        </span>
      </Link>
    </section>
  );
}

/* -- How it works ---------------------------------------------------------- */

function HowItWorks({ lead }: { lead: VariantAssessment }) {
  const { variant, recordedCode, currentCode, impactedRecordCount, caseId } = lead;

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionTitle
          inline
          title="How it works"
          subtitle="From new scientific evidence to a clinical review, automatically."
        />
        <SyncButton size="sm" variant="soft" className="h-9 rounded-[12px] px-3.5 text-[13px]" />
      </div>

      <ol className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4 xl:gap-6">
        <Step number={1} title="Historical result" when={recordedWhen(lead)}>
          <StepIcon tone="muted">
            <FileText className="h-5 w-5" />
          </StepIcon>
          <VariantAndCode gene={variant.gene} hgvs={variant.hgvsCoding} code={recordedCode} />
        </Step>

        <Step number={2} title="New evidence detected" when={currentWhen(lead)}>
          <StepIcon>
            <FileSearch className="h-5 w-5" />
          </StepIcon>
          <VariantAndCode gene={variant.gene} hgvs={variant.hgvsCoding} code={currentCode} />
        </Step>

        <Step number={3} title="Patient impact">
          <StepIcon round>
            <Users className="h-5 w-5" />
          </StepIcon>
          <span className="min-w-0">
            <span className="block text-[24px] font-semibold leading-none text-accent vp-num">
              {impactedRecordCount}
            </span>
            <span className="mt-1 block text-[14px] leading-snug text-muted">
              affected patient record{impactedRecordCount === 1 ? "" : "s"} identified
            </span>
          </span>
        </Step>

        <Step number={4} title="Clinical review" href={caseId ? `/review/${caseId}` : "/review"} last>
          <StepIcon>
            <ClipboardList className="h-5 w-5" />
          </StepIcon>
          <span className="text-[14px] leading-snug text-muted">
            A named owner, a documented decision and approved follow-up, every step on record
          </span>
        </Step>
      </ol>
    </Card>
  );
}

function Step({
  number,
  title,
  when,
  href,
  last = false,
  children,
}: {
  number: number;
  title: string;
  when?: string;
  href?: string;
  last?: boolean;
  children: React.ReactNode;
}) {
  const body = (
    <>
      <span className="flex items-start gap-3">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-tile-rose text-[13px] font-semibold text-accent vp-num">
          {number}
        </span>
        <span className="min-w-0 pt-0.5">
          <span className="block text-[15px] font-semibold leading-tight text-ink">{title}</span>
          {when ? <span className="mt-1 block text-[13px] text-muted vp-num">{when}</span> : null}
        </span>
      </span>
      <span className="mt-3.5 flex items-center gap-3">{children}</span>
    </>
  );

  const tile =
    "h-full rounded-[18px] border border-line/80 bg-gradient-to-b from-surface to-surface-2 p-4 shadow-[0_12px_26px_-22px_rgba(72,26,39,0.35)]";
  return (
    <li className="relative">
      {href ? (
        <Link
          href={href}
          className={cn(tile, "block transition-colors hover:border-accent-ring hover:from-accent-soft/40")}
        >
          {body}
        </Link>
      ) : (
        <div className={tile}>{body}</div>
      )}
      {!last ? (
        <ArrowRight
          aria-hidden
          className="absolute -right-5 top-1/2 hidden h-4 w-4 -translate-y-1/2 text-accent xl:block"
        />
      ) : null}
    </li>
  );
}

function StepIcon({
  tone = "accent",
  round = false,
  children,
}: {
  tone?: "accent" | "muted";
  round?: boolean;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "grid h-11 w-11 shrink-0 place-items-center",
        round ? "rounded-full" : "rounded-[14px]",
        tone === "accent" ? "bg-tile-rose text-accent" : "bg-surface-3 text-muted",
      )}
    >
      {children}
    </span>
  );
}

function VariantAndCode({ gene, hgvs, code }: { gene: string; hgvs: string; code: ClassificationCode }) {
  return (
    <span className="min-w-0">
      <span className="block truncate text-[14px] text-ink">
        <span className="font-semibold">{gene}</span> {hgvs}
      </span>
      <ClassificationPill code={code} className="mt-2" />
    </span>
  );
}

/* -- Real example ---------------------------------------------------------- */

function RealExample({ lead }: { lead: VariantAssessment }) {
  const { variant, recordedCode, currentCode, evidence } = lead;

  return (
    <Card className="flex flex-col p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <SectionTitle
          title="Real example"
          subtitle={`${variant.gene} ${variant.hgvsCoding}: the same DNA, a different meaning.`}
        />
        {evidence.lastEvaluated ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-2 px-3 py-1.5 text-[12px] text-muted">
            <Clock className="h-3.5 w-3.5" />
            Evidence updated {formatDate(evidence.lastEvaluated)}
          </span>
        ) : null}
      </div>

      <div className="mt-4 grid flex-1 gap-3 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
        <ExamplePanel
          label="Then"
          when={recordedWhen(lead)}
          assessment={lead}
          code={recordedCode}
          note={`Reported ${formatDate(variant.recordedOn)}`}
        />
        <div className="flex items-center justify-center gap-2 sm:flex-col sm:px-1">
          {/* The knowledge-change moment: vermilion, and the one pulse on the page. */}
          <span className="relative grid h-9 w-9 place-items-center">
            <span
              aria-hidden
              className="absolute inset-0 rounded-full border border-vermilion/50 [animation:vp-pulse-ring_2.8s_cubic-bezier(0.22,1,0.36,1)_infinite]"
            />
            <span className="relative grid h-9 w-9 place-items-center rounded-full border border-vermilion/40 bg-vermilion-soft text-vermilion">
              <ArrowRight className="h-4 w-4 rotate-90 sm:rotate-0" />
            </span>
          </span>
          <span className="text-[12px] font-semibold uppercase tracking-[0.12em] text-muted sm:text-center">
            Science
            <br className="hidden sm:block" /> changed
          </span>
        </div>
        <ExamplePanel
          label="Now"
          when={currentWhen(lead)}
          assessment={lead}
          code={currentCode}
          note={lead.confidence.label}
          current
        />
      </div>
    </Card>
  );
}

function ExamplePanel({
  label,
  when,
  assessment,
  code,
  note,
  current = false,
}: {
  label: string;
  when: string;
  assessment: VariantAssessment;
  code: ClassificationCode;
  note: string;
  current?: boolean;
}) {
  const { gene, hgvsCoding, proteinChange } = assessment.variant;
  return (
    <div
      className={cn(
        "flex flex-col items-start rounded-2xl border p-4",
        current ? "border-accent-ring/70 bg-accent-soft/60" : "border-line bg-surface-2",
      )}
    >
      <p className="flex items-baseline gap-2">
        <span
          className={cn(
            "text-[12px] font-bold uppercase tracking-[0.08em]",
            current ? "text-accent" : "text-ink",
          )}
        >
          {label}
        </span>
        {when ? <span className="text-[12px] text-muted vp-num">{when}</span> : null}
      </p>
      <p className="mt-2.5 text-[14px] leading-snug text-ink">
        <span className="font-semibold">{gene}</span>{" "}
        <span className="text-ink-2">
          {hgvsCoding}
          {proteinChange ? ` (${proteinChange})` : ""}
        </span>
      </p>
      <ClassificationPill code={code} className="mt-2.5" />
      <p className="mt-auto pt-2.5 text-[12px] text-muted">{note}</p>
    </div>
  );
}

/* -- Data sources ---------------------------------------------------------- */

function DataSources({ mode }: { mode: string }) {
  const clinvar = evidenceModeMeta(mode);
  const clinvarName =
    clinvar.mode === "live"
      ? "Live ClinVar evidence"
      : clinvar.mode === "demo"
        ? "ClinVar demo snapshot"
        : "Cached ClinVar evidence";

  return (
    <Card className="p-5">
      <SectionTitle title="Our data sources" subtitle="Trusted, complementary evidence." />
      <ul className="mt-4 space-y-2">
        <SourceRow
          icon={<Database className="h-[18px] w-[18px]" />}
          tile="bg-ok-soft text-ok"
          name={clinvarName}
          description="Current classifications"
          status={clinvar.label}
          tone={clinvar.tone}
          pulse={clinvar.pulse}
        />
        <SourceRow
          icon={<History className="h-[18px] w-[18px]" />}
          tile="bg-accent-soft text-accent"
          name="Jan 2023 snapshot"
          description="Classification history"
          status="Archived release"
        />
        <SourceRow
          icon={<Globe2 className="h-[18px] w-[18px]" />}
          tile="bg-warn-soft text-warn"
          name={REGIONAL_SOURCE.name}
          description="gnomAD v4 Middle Eastern, CTGA"
          status="Bundled"
        />
        <SourceRow
          icon={<Building2 className="h-[18px] w-[18px]" />}
          tile="bg-info-soft text-info"
          name="Synthetic hospital records"
          description="Demonstration data"
          status="Synthetic"
        />
      </ul>
    </Card>
  );
}

function SourceRow({
  icon,
  tile,
  name,
  description,
  status,
  tone = "muted",
  pulse = false,
}: {
  icon: React.ReactNode;
  tile: string;
  name: string;
  description: string;
  status: string;
  tone?: Tone;
  pulse?: boolean;
}) {
  return (
    <li className="flex items-center gap-3">
      <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-xl", tile)}>{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-semibold text-ink">{name}</span>
        <span className="block truncate text-[12px] text-muted">{description}</span>
      </span>
      <span
        className={cn(
          "inline-flex shrink-0 items-center gap-1.5 text-[12px]",
          tone === "positive" && "font-medium text-ok",
          tone === "warning" && "font-medium text-warn",
          tone === "neutral" && "font-medium text-info",
          tone === "critical" && "font-medium text-crit",
          tone === "muted" && "text-muted",
        )}
      >
        <StatusDot tone={tone} pulse={pulse} />
        {status}
      </span>
    </li>
  );
}

/* -- Shared pieces --------------------------------------------------------- */

function SectionTitle({
  title,
  subtitle,
  inline = false,
}: {
  title: string;
  subtitle: string;
  inline?: boolean;
}) {
  return (
    <div className="flex min-w-0 items-start gap-3">
      <span aria-hidden className="mt-[3px] h-[22px] w-1 shrink-0 rounded-full bg-accent" />
      <div className={cn("min-w-0", inline && "flex flex-wrap items-baseline gap-x-3.5 gap-y-0.5")}>
        <h2 className="text-[19px] font-bold tracking-[-0.025em] text-ink">{title}</h2>
        <p className={cn("text-[14px] text-muted", !inline && "mt-0.5")}>{subtitle}</p>
      </div>
    </div>
  );
}

function ClassificationPill({ code, className }: { code: ClassificationCode; className?: string }) {
  const info = meta(code);
  return (
    <Badge
      tone={info.tone}
      title={info.label}
      className={cn("px-3.5 py-[7px] text-[13px] font-semibold", className)}
    >
      {info.short}
    </Badge>
  );
}

const MONTH = new Intl.DateTimeFormat("en-GB", { month: "short", year: "numeric", timeZone: "UTC" });

/** `2023-03-14` as `Mar 2023`. */
function monthLabel(value: string): string {
  const date = new Date(`${value.slice(0, 10)}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? "" : MONTH.format(date);
}

/** When the result on file was reported. */
function recordedWhen(assessment: VariantAssessment): string {
  return monthLabel(assessment.variant.recordedOn);
}

/**
 * When ClinVar last evaluated today's reading. Left blank when that predates the
 * report, where a date would read as time running backwards.
 */
function currentWhen(assessment: VariantAssessment): string {
  const evaluated = assessment.evidence.lastEvaluated;
  return evaluated && evaluated.slice(0, 7) >= assessment.variant.recordedOn.slice(0, 7)
    ? monthLabel(evaluated)
    : "";
}
