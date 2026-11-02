import { describe, expect, it } from "vitest";
import { rangeToDates } from "../utils/dateRanges.js";
import { buildStatCards, parseSections } from "../utils/summary.js";
import { ageFromDOB, initials, patientMeta } from "../utils/format.js";
import { numberOrUndefined } from "../utils/data.js";
import { painLevelFromSlider, parseBP, sliderFromPainLevel } from "../components/dailylog/helpers.js";

describe("rangeToDates", () => {
  const days = (r) => {
    const { startDate, endDate } = rangeToDates(r);
    return Math.round((new Date(endDate) - new Date(startDate)) / 86400000);
  };
  it("matches the backend's windows (7 / 30 / 181 days inclusive)", () => {
    expect(days("week")).toBe(6);
    expect(days("month")).toBe(29);
    expect(days("6months")).toBe(180);
  });
  it("uses a very early start for 'all'", () => {
    expect(rangeToDates("all").startDate).toBe("2000-01-01");
  });
});

describe("parseBP", () => {
  it("accepts systolic/diastolic", () => {
    expect(parseBP("120/80")).toEqual({ systolic: 120, diastolic: 80 });
    expect(parseBP(" 128 / 82 ")).toEqual({ systolic: 128, diastolic: 82 });
  });
  it("rejects anything else", () => {
    for (const bad of ["128-82", "abc", "12080", "1/2", "120/", ""]) expect(parseBP(bad)).toBeNull();
  });
});

describe("pain slider mapping", () => {
  it("buckets 0–10 into the backend's four levels", () => {
    expect([0, 1, 3, 4, 6, 7, 10].map(painLevelFromSlider)).toEqual(["None", "Mild", "Mild", "Moderate", "Moderate", "Severe", "Severe"]);
  });
  it("round-trips each level to a slider value in the same bucket", () => {
    for (const level of ["None", "Mild", "Moderate", "Severe"]) expect(painLevelFromSlider(sliderFromPainLevel(level))).toBe(level);
  });
});

describe("parseSections", () => {
  it("splits on the six known headers, tolerating markdown decoration", () => {
    const s = parseSections("## Overall Overview\nGood.\n\n**Vital Trends**\nStable.\n3. Suggested Discussion Points:\nAsk.");
    expect(s.map((x) => x.title)).toEqual(["Overall Overview", "Vital Trends", "Suggested Discussion Points"]);
    expect(s[1].body.join("").trim()).toBe("Stable.");
  });
  it("falls back to a single Summary section when no header matches", () => {
    const s = parseSections("Just a paragraph.");
    expect(s).toHaveLength(1);
    expect(s[0].title).toBe("Summary");
  });
  it("keeps text that precedes the first header", () => {
    expect(parseSections("Intro line\nOverall Overview\nBody")[0]).toMatchObject({ title: "Summary" });
  });
});

describe("buildStatCards", () => {
  it("skips missing aggregates", () => {
    const cards = buildStatCards({ totalRecords: 2, averageHeartRate: 74.4 });
    expect(cards.map((c) => c.num)).toEqual([2, "74 bpm"]);
  });
  it("is empty without data", () => expect(buildStatCards(undefined)).toEqual([]));
});

describe("format helpers", () => {
  it("initials / age / meta", () => {
    expect(initials("Asha Rao Kumar")).toBe("AR");
    expect(ageFromDOB(null)).toBeNull();
    expect(patientMeta({ gender: "female", bloodGroup: "O+" })).toBe("female · O+");
  });
  it("numberOrUndefined", () => {
    expect([numberOrUndefined(""), numberOrUndefined(null), numberOrUndefined("x"), numberOrUndefined("36.5"), numberOrUndefined(0)]).toEqual([undefined, undefined, undefined, 36.5, 0]);
  });
});
