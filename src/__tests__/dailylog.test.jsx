import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { mockApi } from "../test/mockApi.js";
import { renderApp } from "../test/renderApp.jsx";

const posts = (calls, path) => calls.filter((c) => c.method === "POST" && c.path === path);
const writes = (calls) => calls.filter((c) => ["POST", "PATCH"].includes(c.method));
const openLog = async () => {
  const utils = renderApp("/patients/p1/log");
  await screen.findByRole("heading", { name: "Daily log — Asha Rao" });
  return utils;
};

describe("daily log — layout", () => {
  it("shows the five sections with a skip control on the three that can be skipped", async () => {
    mockApi();
    await openLog();
    for (const title of [/Medications/, /Vitals/, /Physiotherapy/, /Wellness/, /Notes \(optional\)/]) {
      expect(screen.getByText(title, { selector: ".section-card-title" })).toBeInTheDocument();
    }
    expect(screen.getAllByRole("button", { name: "Skip today" })).toHaveLength(3);
  });

  it("lists each current prescription with Taken / Skipped buttons", async () => {
    mockApi();
    await openLog();
    expect(screen.getByText("Metformin · 500mg")).toBeInTheDocument();
    expect(screen.getByText("Aspirin · 75mg")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Taken" })).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: "Skipped" })).toHaveLength(2);
  });

  it("has a sticky save bar with Discard and Save", async () => {
    mockApi();
    await openLog();
    const bar = document.querySelector(".sticky-action-bar");
    expect(within(bar).getByRole("button", { name: "Discard" })).toBeInTheDocument();
    expect(within(bar).getByRole("button", { name: "Save log" })).toBeInTheDocument();
  });

  it("tells you when today is already logged, and pre-fills the form", async () => {
    mockApi([
      { method: "GET", path: "/patients/p1/logs/today", reply: { data: { _id: "log1", medicinesTaken: true, exerciseDone: true, waterIntake: 5, sleepHours: 8, appetite: "Good", mood: "Very Good", notes: "Slept well" } } },
    ]);
    await openLog();
    expect(screen.getByText("Today is already logged — saving will update it.")).toBeInTheDocument();
    expect(screen.getByLabelText("Notes")).toHaveValue("Slept well");
    expect(screen.getByText("5", { selector: "#water-value" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Good" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: /Very Good/ })).toHaveAttribute("aria-pressed", "true");
    for (const b of screen.getAllByRole("button", { name: "Taken" })) expect(b).toHaveAttribute("aria-pressed", "true");
  });
});

describe("daily log — blood pressure validation", () => {
  it("flags a malformed value immediately, and clears when fixed", async () => {
    mockApi();
    const user = userEvent.setup();
    await openLog();
    const error = screen.getByText("Enter as two numbers separated by a slash, like 120/80.");
    expect(error).not.toBeVisible();

    const bp = screen.getByLabelText("Blood pressure");
    await user.type(bp, "128-82");
    expect(error).toBeVisible();
    expect(bp).toHaveAttribute("aria-invalid", "true");

    await user.clear(bp);
    await user.type(bp, "128/82");
    expect(error).not.toBeVisible();
    expect(bp).toHaveAttribute("aria-invalid", "false");
  });

  it("blocks Save with a message, and saves nothing", async () => {
    const { calls } = mockApi();
    const user = userEvent.setup();
    await openLog();
    await user.type(screen.getByLabelText("Blood pressure"), "abc");
    await user.click(screen.getByRole("button", { name: "Save log" }));
    expect(await screen.findByText(/Fix the blood pressure format before saving/)).toBeInTheDocument();
    expect(writes(calls)).toHaveLength(0);
    expect(screen.getByLabelText("Blood pressure")).toHaveFocus();
  });

  it("lets you save with a bad value if Vitals is skipped", async () => {
    const { calls } = mockApi();
    const user = userEvent.setup();
    await openLog();
    await user.type(screen.getByLabelText("Blood pressure"), "abc");
    await user.click(screen.getAllByRole("button", { name: "Skip today" })[1]);
    await user.click(screen.getByRole("button", { name: "Save log" }));
    expect(await screen.findByText("Today's care logged")).toBeInTheDocument();
    expect(posts(calls, "/patients/p1/vitals")).toHaveLength(0);
  });
});

describe("daily log — skip today", () => {
  it("says in words that the other sections still save, and can be undone", async () => {
    mockApi();
    const user = userEvent.setup();
    await openLog();
    await user.click(screen.getAllByRole("button", { name: "Skip today" })[1]); // vitals
    expect(screen.getByText("⚠ Vitals skipped for today — your other sections will still save normally.")).toBeInTheDocument();
    expect(document.getElementById("vitals-section")).toHaveClass("is-skipped");
    expect(screen.getByRole("button", { name: "Undo skip" })).toHaveAttribute("aria-pressed", "true");

    await user.click(screen.getByRole("button", { name: "Click to undo" }));
    expect(screen.queryByText(/Vitals skipped for today/)).toBeNull();
    expect(document.getElementById("vitals-section")).not.toHaveClass("is-skipped");
  });
});

describe("daily log — controls & accessibility", () => {
  it("pain slider shows its bucket live and exposes it as aria-valuetext", async () => {
    mockApi();
    await openLog();
    const slider = screen.getByRole("slider", { name: "Pain level" });
    expect(screen.getByText("None", { selector: "#pain-label" })).toBeInTheDocument();
    fireEvent.change(slider, { target: { value: "5" } });
    expect(screen.getByText("Moderate", { selector: "#pain-label" })).toBeInTheDocument();
    expect(slider).toHaveAttribute("aria-valuetext", "Moderate");
    expect(document.querySelectorAll("#pain-ticks option")).toHaveLength(11);
  });

  it("toggles expose aria-pressed", async () => {
    mockApi();
    const user = userEvent.setup();
    await openLog();
    const toggle = screen.getByRole("button", { name: "Exercise done" });
    expect(toggle).toHaveAttribute("aria-pressed", "false");
    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-pressed", "true");
    expect(toggle).toHaveClass("is-on");
  });

  it("steppers change heart rate, SpO2, water and duration", async () => {
    mockApi();
    const user = userEvent.setup();
    await openLog();
    await user.click(screen.getByRole("button", { name: "Increase heart rate" }));
    expect(screen.getByText("70", { selector: "#hr-value" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Decrease heart rate" }));
    expect(screen.getByText("69", { selector: "#hr-value" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Increase SpO2" }));
    expect(screen.getByText("98", { selector: "#spo2-value" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Increase water intake" }));
    expect(screen.getByText("1", { selector: "#water-value" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Increase duration" }));
    expect(screen.getByText("20", { selector: "#dur-value" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Decrease water intake" }));
    await user.click(screen.getByRole("button", { name: "Decrease water intake" }));
    expect(screen.getByText("0", { selector: "#water-value" })).toBeInTheDocument(); // never below zero
  });
});

describe("daily log — saving", () => {
  it("saves the log, vitals and a physiotherapy session, then goes to the weekly summary", async () => {
    const { calls } = mockApi();
    const user = userEvent.setup();
    await openLog();

    for (const b of screen.getAllByRole("button", { name: "Taken" })) await user.click(b);
    await user.type(screen.getByLabelText("Blood pressure"), "120/80");
    await user.click(screen.getByRole("button", { name: "Increase heart rate" }));
    fireEvent.change(screen.getByRole("slider", { name: "Pain level" }), { target: { value: "5" } });
    await user.click(screen.getByRole("button", { name: /Very Good/ }));
    await user.click(screen.getByRole("button", { name: "Save log" }));

    expect(await screen.findByRole("heading", { name: "Asha Rao — weekly dashboard" })).toBeInTheDocument();
    expect(screen.getByText("Today's care logged")).toBeInTheDocument();

    const log = posts(calls, "/patients/p1/logs")[0].body;
    expect(log).toMatchObject({ medicinesTaken: true, physiotherapyDone: true, appetite: "Normal", mood: "Very Good", waterIntake: 0 });
    expect(log.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    expect(posts(calls, "/patients/p1/vitals")[0].body).toMatchObject({ bloodPressureSystolic: 120, bloodPressureDiastolic: 80, heartRate: 70 });
    const physio = posts(calls, "/patients/p1/physiotherapy")[0].body;
    expect(physio.exercises).toEqual([{ exerciseName: "Prescribed exercises", duration: 15, completed: true, painLevel: "Moderate", difficulty: "Moderate" }]);
  });

  it("records medicines as NOT fully taken unless every one is marked Taken", async () => {
    const { calls } = mockApi();
    const user = userEvent.setup();
    await openLog();
    await user.click(screen.getAllByRole("button", { name: "Taken" })[0]);
    await user.click(screen.getAllByRole("button", { name: "Skipped" })[1]);
    await user.click(screen.getByRole("button", { name: "Save log" }));
    await screen.findByText("Today's care logged");
    expect(posts(calls, "/patients/p1/logs")[0].body.medicinesTaken).toBe(false);
  });

  it("does not create an empty vitals record when no vitals were entered", async () => {
    const { calls } = mockApi();
    const user = userEvent.setup();
    await openLog();
    await user.click(screen.getByRole("button", { name: "Save log" }));
    await screen.findByText("Today's care logged");
    expect(posts(calls, "/patients/p1/logs")).toHaveLength(1);
    expect(posts(calls, "/patients/p1/vitals")).toHaveLength(0);
    expect(posts(calls, "/patients/p1/physiotherapy")).toHaveLength(1);
  });

  it("skipping Vitals and Physiotherapy saves only the log, with physiotherapyDone false", async () => {
    const { calls } = mockApi();
    const user = userEvent.setup();
    await openLog();
    const skips = screen.getAllByRole("button", { name: "Skip today" });
    await user.click(skips[1]);
    await user.click(skips[2]);
    await user.click(screen.getByRole("button", { name: "Save log" }));
    await screen.findByText("Today's care logged");
    expect(writes(calls).map((c) => c.path)).toEqual(["/patients/p1/logs"]);
    expect(posts(calls, "/patients/p1/logs")[0].body.physiotherapyDone).toBe(false);
  });

  it("updates (PATCH) existing records for today instead of creating duplicates", async () => {
    const { calls } = mockApi([
      { method: "GET", path: "/patients/p1/logs/today", reply: { data: { _id: "log1", medicinesTaken: false } } },
      { method: "GET", path: "/patients/p1/vitals/today", reply: { data: { _id: "vit1", bloodPressureSystolic: 118, bloodPressureDiastolic: 76, heartRate: 70 } } },
      { method: "GET", path: "/patients/p1/physiotherapy/today", reply: { data: { _id: "phy1", exercises: [{ exerciseName: "Knee bends", duration: 20, completed: false, painLevel: "Mild", difficulty: "Easy" }] } } },
    ]);
    const user = userEvent.setup();
    await openLog();
    expect(screen.getByLabelText("Blood pressure")).toHaveValue("118/76");
    await user.click(screen.getByRole("button", { name: "Save log" }));
    await screen.findByText("Today's care logged");

    expect(writes(calls).map((c) => `${c.method} ${c.path}`).sort()).toEqual(["PATCH /logs/log1", "PATCH /physiotherapy/phy1", "PATCH /vitals/vit1"]);
    // keeps what was there: the exercise's own name and difficulty
    expect(calls.find((c) => c.path === "/physiotherapy/phy1").body.exercises[0]).toMatchObject({ exerciseName: "Knee bends", difficulty: "Easy", completed: false, painLevel: "Mild" });
  });

  it("when one save fails, keeps the others and a retry updates instead of re-creating them", async () => {
    let attempts = 0;
    const { calls } = mockApi([
      { method: "POST", path: "/patients/p1/vitals", reply: () => (++attempts === 1 ? { status: 500, message: "Vitals exploded" } : { data: { _id: "vit1" } }) },
    ]);
    const user = userEvent.setup();
    await openLog();
    await user.type(screen.getByLabelText("Blood pressure"), "120/80");
    await user.click(screen.getByRole("button", { name: "Save log" }));

    expect(await screen.findByText("Vitals: Vitals exploded")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Daily log — Asha Rao" })).toBeInTheDocument(); // stayed put
    expect(screen.getByRole("button", { name: "Save log" })).toBeEnabled();

    await user.click(screen.getByRole("button", { name: "Save log" }));
    expect(await screen.findByRole("heading", { name: "Asha Rao — weekly dashboard" })).toBeInTheDocument();

    expect(posts(calls, "/patients/p1/logs")).toHaveLength(1); // not created twice
    expect(calls.some((c) => c.method === "PATCH" && c.path === "/logs/log1")).toBe(true);
    expect(posts(calls, "/patients/p1/physiotherapy")).toHaveLength(1);
    expect(calls.some((c) => c.method === "PATCH" && c.path === "/physiotherapy/phy1")).toBe(true);
    expect(posts(calls, "/patients/p1/vitals")).toHaveLength(2); // failed once, succeeded on retry
  });

  it("Discard goes back without saving", async () => {
    const { calls } = mockApi();
    const user = userEvent.setup();
    await openLog();
    await user.click(screen.getByRole("button", { name: "Discard" }));
    expect(await screen.findByRole("heading", { name: "Asha Rao — weekly dashboard" })).toBeInTheDocument();
    expect(writes(calls)).toHaveLength(0);
  });
});
