import { describe, expect, it } from "vitest";

import { analyseWorkspace } from "@/lib/analysis";
import { serialiseAnalysis } from "@/lib/dto";
import { seedActivity } from "@/lib/trail";
import { formatMoment, relativeTime } from "@/lib/utils";

const demo = async () => serialiseAnalysis(await analyseWorkspace({ mode: "demo", force: true }));

describe("seeded audit trail", () => {
  it("stamps every entry with the evidence read's own time, never an invented offset", async () => {
    const analysis = await demo();
    const trail = seedActivity(analysis);
    expect(trail).toHaveLength(1 + 3 * analysis.reviewableKeys.length);
    expect(new Set(trail.map((entry) => entry.at))).toEqual(new Set([analysis.checkedAt]));
  });

  it("keeps the working order, newest first: the last case raised on top, the sync at the bottom", async () => {
    const trail = seedActivity(await demo());
    expect(trail[0].title).toBe("Clinical review case VP-R-2026-025 created");
    expect(trail.slice(0, 3).map((entry) => entry.kind)).toEqual(["case", "impact", "detection"]);
    expect(trail.at(-1)?.title).toBe("Evidence sync completed");
  });

  it("dates each detection with the date its source gives for the change", async () => {
    const trail = seedActivity(await demo());
    const lead = trail.find((entry) => entry.id === "seed-detect-BRCA1:c.5056C>T");
    expect(lead?.detail).toBe("BRCA1 c.5056C>T · ClinVar last evaluated 18 Aug 2025");
  });
});

describe("hydration-safe time", () => {
  it("prints a moment identically on any server: in UTC, with the zone named", () => {
    expect(formatMoment("2026-10-04T12:53:52.454Z", "UTC")).toBe("4 Oct 2026, 12:53:52 UTC");
  });

  it("shows the same moment in the reader's zone once hydrated", () => {
    expect(formatMoment("2026-10-04T12:53:52.454Z", "Asia/Dubai")).toMatch(/^4 Oct 2026, 16:53:52 /);
  });

  it("measures relative time from a fixed reference, so the server and browser agree", () => {
    const rendered = Date.parse("2026-10-05T09:00:00Z");
    expect(relativeTime("2026-10-05T08:59:40Z", rendered)).toBe("just now");
    expect(relativeTime("2022-11-02", rendered)).toBe("4y ago");
  });
});
