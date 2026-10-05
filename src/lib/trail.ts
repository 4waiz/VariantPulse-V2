/**
 * The audit trail's entries, and the ones the engine's own work seeds it with.
 *
 * Kept apart from the session state so the seed is a plain function of the
 * analysis, testable without a browser.
 */

import type { VariantAssessment } from "./analysis";
import type { ClientAnalysis } from "./dto";
import { EVIDENCE_MODES } from "./evidence-mode";
import { composeReviewReason } from "./narrative";
import { formatDate } from "./utils";
import { REGIONAL_SOURCE } from "@/data/regional";

export interface ActivityEntry {
  id: string;
  at: string;
  title: string;
  detail?: string;
  /** Who performed the action: a named person, or VariantPulse for engine events. */
  actor: string;
  /** The actor's role at the time. */
  role?: string;
  caseId?: string;
  kind:
    | "sync"
    | "detection"
    | "impact"
    | "case"
    | "assignment"
    | "note"
    | "evidence-request"
    | "follow-up"
    | "approval"
    | "review"
    | "escalation"
    | "closure"
    | "import"
    | "pilot"
    | "session";
}

export const SYSTEM_ACTOR = "VariantPulse";
export const SYSTEM_ROLE = "System";

/** The source's own date behind a detection: when the evidence itself last moved. */
function evidenceDated(assessment: VariantAssessment): string | null {
  if (assessment.changeType === "REGIONAL_CONFLICT") {
    return assessment.regional
      ? `${REGIONAL_SOURCE.catalogueShortName} listing since ${formatDate(assessment.regional.lastUpdated)}`
      : null;
  }
  return assessment.evidence.lastEvaluated
    ? `ClinVar last evaluated ${formatDate(assessment.evidence.lastEvaluated)}`
    : null;
}

/**
 * Seeds the trail with the work the engine has already done.
 *
 * Every entry carries the moment of the evidence read that produced it, which
 * is the only time the data holds for these steps; nothing is spaced out with
 * invented offsets. Within that one moment the entries keep their working order,
 * newest first: the last case raised at the top, the sync itself at the bottom.
 * A detection also names the date its source gives for the change.
 */
export function seedActivity(analysis: ClientAnalysis): ActivityEntry[] {
  const at = analysis.checkedAt;

  const reviewable = analysis.assessments
    .filter((a) => a.caseId)
    .sort((a, b) => (a.caseId ?? "").localeCompare(b.caseId ?? ""));

  const perCase = reviewable.flatMap((assessment): ActivityEntry[] => {
    const caseId = assessment.caseId ?? undefined;
    const label = `${assessment.variant.gene} ${assessment.variant.hgvsCoding}`;
    const dated = evidenceDated(assessment);
    return [
      {
        id: `seed-detect-${assessment.variant.key}`,
        at,
        kind: "detection",
        actor: SYSTEM_ACTOR,
        role: SYSTEM_ROLE,
        caseId,
        title: composeReviewReason(assessment.changeType, assessment.variant.gene),
        detail: dated ? `${label} · ${dated}` : label,
      },
      {
        id: `seed-impact-${assessment.variant.key}`,
        at,
        kind: "impact",
        actor: SYSTEM_ACTOR,
        role: SYSTEM_ROLE,
        caseId,
        title: `${assessment.impactedRecordCount} historical record${assessment.impactedRecordCount === 1 ? "" : "s"} mapped`,
        detail: label,
      },
      {
        id: `seed-case-${assessment.variant.key}`,
        at,
        kind: "case",
        actor: SYSTEM_ACTOR,
        role: SYSTEM_ROLE,
        caseId,
        title: `Clinical review case ${assessment.caseId} created`,
        detail: `Priority ${assessment.priority.level.toLowerCase()}`,
      },
    ];
  });

  return [
    ...perCase.reverse(),
    {
      id: "seed-sync",
      at,
      kind: "sync",
      actor: SYSTEM_ACTOR,
      role: SYSTEM_ROLE,
      title: "Evidence sync completed",
      detail: `${analysis.scan.findingsChecked.toLocaleString("en-US")} findings checked against ${EVIDENCE_MODES[analysis.mode].noun} evidence`,
    },
  ];
}
