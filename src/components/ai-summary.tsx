"use client";

/**
 * The drafted evidence summary at the top of a case, joined to its source.
 *
 * The text is editable, because it is a draft for a clinician to check and
 * correct, not a finding. "Use in brief" files the text, as edited, in the case
 * trail, where the evidence brief picks it up. If the summary route cannot be
 * reached at all, the same deterministic summary the server would have fallen
 * back to is composed here, so the panel never shows an error.
 *
 * Beneath the draft, in the same block and joined to it by a thread, sits what
 * it was written from: the evidence summary composed from the cited records,
 * and the case file entry behind every source tag a draft sentence can end with.
 * The draft and its source read as one thing, and every tag can be checked.
 */

import * as React from "react";
import { Check, ClipboardCopy, ExternalLink, FileText, Sparkles } from "lucide-react";

import { Badge, Button, Card, SectionHeading, Skeleton } from "@/components/ui";
import type { VariantAssessment } from "@/lib/analysis";
import { composeFallbackSummary, summaryFacts, type SummaryFacts, type SummaryResult } from "@/lib/summary";
import { cn, formatDate, formatNumber } from "@/lib/utils";

/** A little past the server's own model timeout, so the server gets to answer first. */
const REQUEST_TIMEOUT_MS = 12_000;

type Draft = Pick<SummaryResult, "source" | "model">;

export function AiSummaryPanel({
  assessment,
  onUseInBrief,
}: {
  assessment: VariantAssessment;
  onUseInBrief: (text: string) => void;
}) {
  const caseId = assessment.caseId ?? assessment.variant.key;
  const [draft, setDraft] = React.useState<Draft | null>(null);
  const [text, setText] = React.useState("");
  const [filed, setFiled] = React.useState(false);

  React.useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    setDraft(null);

    fetch("/api/summary", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ caseId }),
      signal: controller.signal,
    })
      .then((response) => (response.ok ? (response.json() as Promise<SummaryResult>) : null))
      .catch(() => null)
      .then((result) => {
        if (!active) return;
        const usable = result && Array.isArray(result.sentences) && result.sentences.length > 0;
        const sentences = usable ? result.sentences : composeFallbackSummary(summaryFacts(assessment));
        setText(sentences.join("\n"));
        setDraft(usable ? { source: result.source, model: result.model } : { source: "fallback" });
      })
      .finally(() => window.clearTimeout(timer));

    return () => {
      active = false;
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [caseId, assessment]);

  React.useEffect(() => {
    if (!filed) return;
    const timer = window.setTimeout(() => setFiled(false), 2400);
    return () => window.clearTimeout(timer);
  }, [filed]);

  const useInBrief = () => {
    const body = text.trim();
    if (!body) return;
    onUseInBrief(body);
    setFiled(true);
  };

  const facts = React.useMemo(() => summaryFacts(assessment), [assessment]);
  const sourceId = `${caseId}-summary-source`;
  // The tags the draft leans on as it stands, edits included.
  const cited = React.useMemo(() => new Set(text.match(/\[[^\]]+\]/g) ?? []), [text]);

  return (
    <Card className="p-5">
      <SectionHeading
        title="Evidence summary draft"
        icon={<Sparkles className="h-4 w-4" />}
        description="The draft, and the evidence summary it was written from."
        action={
          <Badge tone="warning" dot>
            AI draft · clinician must review
          </Badge>
        }
      />

      <ol className="mt-4">
        <li className="relative grid grid-cols-[24px_minmax(0,1fr)] gap-x-3.5">
          {/* The thread joining the draft to its source. */}
          <span aria-hidden className="absolute -bottom-4 left-[11.5px] top-6 w-px bg-line-2" />
          <StepMark tone="draft">
            <Sparkles className="h-3 w-3" />
          </StepMark>
          <div className="min-w-0">
            <StepLabel
              label="Draft"
              note={
                draft === null
                  ? "Drafting from the source below"
                  : draft.source === "ai"
                    ? "Written by Claude from the source below, and nothing else"
                    : "Composed by a fixed template from the source below"
              }
            />
            {draft === null ? (
              <div className="mt-2.5 space-y-2" aria-busy="true" aria-label="Drafting the summary">
                <Skeleton className="h-3.5 w-full" />
                <Skeleton className="h-3.5 w-[92%]" />
                <Skeleton className="h-3.5 w-[96%]" />
                <Skeleton className="h-3.5 w-[70%]" />
              </div>
            ) : (
              <>
                <textarea
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  rows={6}
                  aria-label="Evidence summary draft"
                  aria-describedby={sourceId}
                  className="mt-2.5 w-full resize-y rounded-xl border border-line bg-surface-2 px-3.5 py-2.5 text-[13px] leading-relaxed text-ink outline-none transition-colors focus:border-accent-ring focus:bg-surface"
                />
                <div className="mt-2.5 flex flex-wrap items-center justify-between gap-3">
                  <p className="max-w-xl text-[11.5px] leading-relaxed text-faint">
                    Each sentence ends with the tag of its source. Check it against that entry below.
                  </p>
                  <Button size="sm" onClick={useInBrief} disabled={!text.trim()}>
                    {filed ? <Check className="h-3.5 w-3.5" /> : <ClipboardCopy className="h-3.5 w-3.5" />}
                    {filed ? "Added to case note" : "Use in brief"}
                  </Button>
                </div>
              </>
            )}
          </div>
        </li>

        <li className="relative mt-4 grid grid-cols-[24px_minmax(0,1fr)] gap-x-3.5">
          <StepMark tone="source">
            <FileText className="h-3 w-3" />
          </StepMark>
          <section id={sourceId} aria-label="Source of the draft: evidence summary" className="min-w-0">
            <StepLabel label="Source" note="Evidence summary, composed from the records cited on this page" />
            <div className="mt-2.5 rounded-xl border border-line bg-surface-2 px-4 py-3.5">
              <p className="text-[14px] leading-relaxed text-ink-2">{assessment.summary}</p>
              <SourceEntries facts={facts} cited={cited} />
              <p className="mt-3 border-t border-line pt-3 text-[11.5px] leading-relaxed text-faint">
                Composed from the structured fields of the cited records by fixed templates. Requires
                clinical verification before it informs any decision.
              </p>
            </div>
          </section>
        </li>
      </ol>
    </Card>
  );
}

function StepMark({ tone, children }: { tone: "draft" | "source"; children: React.ReactNode }) {
  return (
    <span
      aria-hidden
      className={cn(
        "relative z-10 grid h-6 w-6 place-items-center rounded-full border",
        tone === "draft" ? "border-warn-border bg-warn-soft text-warn" : "border-info-border bg-info-soft text-info",
      )}
    >
      {children}
    </span>
  );
}

function StepLabel({ label, note }: { label: string; note: string }) {
  return (
    <p className="flex min-h-6 flex-wrap items-baseline gap-x-2 gap-y-0.5 pt-[3px]">
      <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-2">{label}</span>
      <span className="text-[12px] text-muted">{note}</span>
    </p>
  );
}

interface SourceEntry {
  tag: string;
  text: React.ReactNode;
  /** A linked publication: listed only when the draft cites it, else folded away. */
  publication?: boolean;
}

/**
 * What each source tag in the draft stands for, from the case file the draft
 * was given. Tags the draft cites are marked; publications it does not cite
 * are folded away, since the case file offers more than a draft uses.
 */
function SourceEntries({ facts, cited }: { facts: SummaryFacts; cited: Set<string> }) {
  const { record, clinvar, regional, citations } = facts;
  const entries: SourceEntry[] = [
    {
      tag: record.tag,
      text: `${record.classification} on file, reported ${formatDate(record.recordedOn)}`,
    },
    {
      tag: clinvar.tag,
      text: `${clinvar.accession}: ${clinvar.classification}, ${clinvar.reviewStatus}, ${formatNumber(clinvar.submissions)} submission${clinvar.submissions === 1 ? "" : "s"}, last evaluated ${formatDate(clinvar.lastEvaluated)}`,
    },
  ];
  if (regional?.ctgaTag) {
    entries.push({ tag: regional.ctgaTag, text: `${regional.assertion}, as recorded by ${regional.source}` });
  }
  entries.push({
    tag: "[Regional index]",
    text: regional
      ? `${regional.assertion}; ${formatNumber(regional.observations)} observation${regional.observations === 1 ? "" : "s"} in a cohort of ${formatNumber(regional.cohortSize)}`
      : "No regional record is held for this variant",
  });
  for (const citation of citations) {
    entries.push({
      tag: citation.tag,
      publication: true,
      text: (
        <a
          href={`https://pubmed.ncbi.nlm.nih.gov/${citation.pmid}/`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent hover:underline"
        >
          {citation.title.replace(/\.$/, "")} ({citation.journal}, {citation.year})
          <ExternalLink aria-hidden className="ml-1 inline h-3 w-3 align-[-1px]" />
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      ),
    });
  }

  const shown = entries.filter((entry) => !entry.publication || cited.has(entry.tag));
  const folded = entries.filter((entry) => entry.publication && !cited.has(entry.tag));

  return (
    <>
      <EntryList entries={shown} cited={cited} className="mt-3" />
      {folded.length > 0 ? (
        <details className="group mt-2">
          <summary className="cursor-pointer list-none text-[12px] font-medium text-accent hover:underline [&::-webkit-details-marker]:hidden">
            {folded.length} more linked publication{folded.length === 1 ? "" : "s"} in the case file, not cited
            in the draft
          </summary>
          <EntryList entries={folded} cited={cited} className="mt-2" />
        </details>
      ) : null}
    </>
  );
}

function EntryList({
  entries,
  cited,
  className,
}: {
  entries: SourceEntry[];
  cited: Set<string>;
  className?: string;
}) {
  return (
    <dl className={cn("grid gap-x-3 gap-y-1.5 sm:grid-cols-[minmax(0,9.5rem)_minmax(0,1fr)]", className)}>
      {entries.map((entry) => (
        <div key={entry.tag} className="contents">
          <dt
            className={cn(
              "font-mono text-[11.5px] [overflow-wrap:anywhere]",
              cited.has(entry.tag) ? "font-semibold text-info" : "font-medium text-faint",
            )}
          >
            {entry.tag}
            {cited.has(entry.tag) ? <span className="sr-only"> (cited in the draft)</span> : null}
          </dt>
          <dd className="text-[12.5px] leading-snug text-ink-2 [overflow-wrap:anywhere]">{entry.text}</dd>
        </div>
      ))}
    </dl>
  );
}
