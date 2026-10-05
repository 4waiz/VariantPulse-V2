/**
 * The impact row on the home dashboard: what one scan covered, and how much
 * manual checking it stands in for.
 *
 * The findings count and the cases surfaced come straight from the analysis.
 * The scan duration is measured around the analysis run itself, on the server,
 * and travels to the browser with the analysis it timed. Only the time saving
 * is an estimate, and it is labelled as one wherever it is shown.
 */

import type { VariantAssessment } from "./analysis";
import { meta } from "./classification";
import { inGenomeOrder } from "./genome";
import { SIGNAL_OF } from "./signal";

/** Assumed minutes a clinician spends looking one finding up in ClinVar by hand. */
export const MINUTES_PER_MANUAL_CHECK = 2;

/**
 * "Cases surfaced": the review queue itself, split the way the helix legend and
 * the variant filters split it, so every count on the page agrees.
 */
export function caseBreakdown(cases: VariantAssessment[]) {
  return {
    total: cases.length,
    reclassified: cases.filter((a) => SIGNAL_OF[a.changeType] === "changed").length,
    conflictOrRegional: cases.filter((a) => SIGNAL_OF[a.changeType] === "review").length,
  };
}

/**
 * How many monitored variants crossed between uncertain significance and the
 * pathogenic band, in each direction, measured as the ClinVar-wide figures are:
 * ClinVar's January 2023 reading against its current one. A classification on
 * record that ClinVar did not hold in January 2023 (the modelled hospital
 * report) is left out of the comparison.
 */
export function reclassificationShifts(assessments: VariantAssessment[]) {
  const dated = assessments.filter((a) => a.variant.historicalSource.kind === "clinvar-release");
  const band = (a: VariantAssessment) => [meta(a.recordedCode).band, meta(a.currentCode).band].join(">");
  return {
    compared: dated.length,
    vusToPathogenic: dated.filter((a) => band(a) === "uncertain>pathogenic").length,
    pathogenicToVus: dated.filter((a) => band(a) === "pathogenic>uncertain").length,
  };
}

export function estimatedHoursSaved(findingsChecked: number): number {
  return (findingsChecked * MINUTES_PER_MANUAL_CHECK) / 60;
}

/**
 * The series drawn beside the impact figures: one value per monitored gene, in
 * genome order, as the helix orders its findings. Each is read from the same
 * analysis as its figure and adds up to it, so a chart never disagrees with
 * the number it sits beside.
 */
export function impactSeries(assessments: VariantAssessment[], cases: VariantAssessment[]) {
  const genes = new Map<string, VariantAssessment[]>();
  for (const assessment of inGenomeOrder(assessments)) {
    const gene = genes.get(assessment.variant.gene);
    if (gene) gene.push(assessment);
    else genes.set(assessment.variant.gene, [assessment]);
  }
  const queued = new Set(cases.map((a) => a.variant.key));
  // A variant's records are the findings the scan matched to it.
  const findingsPerGene = [...genes.values()].map((group) =>
    group.reduce((sum, a) => sum + a.impactedRecordCount, 0),
  );
  let minutes = 0;
  return {
    genes: [...genes.keys()],
    /** Findings checked per gene: adds up to "Findings scanned". */
    findingsPerGene,
    /** Review cases per gene: adds up to "Cases surfaced". */
    casesPerGene: [...genes.values()].map((group) => group.filter((a) => queued.has(a.variant.key)).length),
    /** Estimated minutes saved, a running total gene by gene from zero: ends at the estimate. */
    minutesRunning: [0, ...findingsPerGene.map((n) => (minutes += n * MINUTES_PER_MANUAL_CHECK))],
  };
}

/** Runs `run` and reports how long it took, in milliseconds. */
export async function timed<T>(run: () => Promise<T>): Promise<{ result: T; durationMs: number }> {
  const started = performance.now();
  const result = await run();
  return { result, durationMs: performance.now() - started };
}

/** The Server-Timing metric an analysis run is reported under. */
const SCAN_METRIC = "analysis";

export function scanTimingHeader(durationMs: number): string {
  return `${SCAN_METRIC};dur=${durationMs.toFixed(1)}`;
}

/** The analysis duration from a Server-Timing header, or null when it is absent. */
export function parseScanTiming(header: string | null | undefined): number | null {
  if (!header) return null;
  for (const metric of header.split(",")) {
    const [name, ...params] = metric.split(";").map((part) => part.trim());
    if (name !== SCAN_METRIC) continue;
    const duration = params.find((param) => param.startsWith("dur="));
    const value = duration ? Number(duration.slice(4)) : Number.NaN;
    return Number.isFinite(value) && value >= 0 ? value : null;
  }
  return null;
}

/** `0.04 s`, `1.3 s`; a run too quick to register reads `< 0.01 s`. */
export function formatScanSeconds(durationMs: number): string {
  const seconds = durationMs / 1000;
  if (seconds < 0.005) return "< 0.01 s";
  return `${seconds < 1 ? seconds.toFixed(2) : seconds.toFixed(1)} s`;
}
