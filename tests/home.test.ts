import { describe, expect, it } from "vitest";

import { CLINVAR_WIDE } from "@/data/clinvar-wide";
import { MODELLED_HOSPITAL_REPORT } from "@/data/workspace";
import { analyseWorkspace } from "@/lib/analysis";
import { pick, serialiseAnalysis } from "@/lib/dto";
import { MINUTES_PER_MANUAL_CHECK, caseBreakdown, impactSeries, reclassificationShifts } from "@/lib/impact";

const demo = async () => serialiseAnalysis(await analyseWorkspace({ mode: "demo", force: true }));

describe("home: cases surfaced", () => {
  it("is the review queue, so it matches the queue and the top bar", async () => {
    const analysis = await demo();
    const queue = pick(analysis, analysis.reviewableKeys);
    const split = caseBreakdown(queue);
    expect(split.total).toBe(analysis.metrics.openCases);
    expect(split.total).toBe(25);
  });

  it("splits the queue the way the helix legend does: 22 reclassified, 3 conflict or regional", async () => {
    const analysis = await demo();
    const split = caseBreakdown(pick(analysis, analysis.reviewableKeys));
    expect(split).toEqual({ total: 25, reclassified: 22, conflictOrRegional: 3 });
    expect(split.reclassified + split.conflictOrRegional).toBe(split.total);
  });
});

describe("home: ClinVar-wide strip", () => {
  it("carries the ClinVar-wide counts for January 2023 to September 2026", () => {
    expect(CLINVAR_WIDE).toMatchObject({
      from: "2023-01",
      to: "2026-09",
      vusToPathogenic: 5022,
      pathogenicToVus: 1703,
    });
  });

  it("measures the workspace the same way: ClinVar in January 2023 against ClinVar now", async () => {
    const analysis = await demo();
    expect(reclassificationShifts(analysis.assessments)).toEqual({
      compared: 27,
      vusToPathogenic: 14,
      pathogenicToVus: 5,
    });
  });

  it("leaves out the modelled hospital report, which ClinVar did not hold in January 2023", async () => {
    const analysis = await demo();
    const modelled = analysis.assessments.filter(
      (a) => a.variant.historicalSource.kind === MODELLED_HOSPITAL_REPORT.kind,
    );
    expect(modelled.map((a) => a.variant.key)).toEqual(["MYBPC3:c.776delinsTT"]);
    // It moved VUS → likely pathogenic, and is still not counted.
    expect(reclassificationShifts(modelled)).toEqual({ compared: 0, vusToPathogenic: 0, pathogenicToVus: 0 });
  });
});

describe("home: charts beside the figures", () => {
  it("adds up to the figure each chart sits beside", async () => {
    const analysis = await demo();
    const queue = pick(analysis, analysis.reviewableKeys);
    const series = impactSeries(analysis.assessments, queue);
    const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);

    expect(series.genes).toHaveLength(new Set(analysis.assessments.map((a) => a.variant.gene)).size);
    expect(sum(series.findingsPerGene)).toBe(analysis.scan.findingsChecked);
    expect(sum(series.casesPerGene)).toBe(queue.length);
    expect(series.minutesRunning[0]).toBe(0);
    expect(series.minutesRunning.at(-1)).toBe(analysis.scan.findingsChecked * MINUTES_PER_MANUAL_CHECK);
  });

  it("orders the genes as the helix does, by chromosome", async () => {
    const analysis = await demo();
    const { genes } = impactSeries(analysis.assessments, []);
    expect(genes.indexOf("CFTR")).toBeLessThan(genes.indexOf("BRCA2"));
    expect(genes.indexOf("BRCA2")).toBeLessThan(genes.indexOf("BRCA1"));
    expect(genes.at(-1)).toBe("LDLR");
  });
});
