import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { mockApi } from "../test/mockApi.js";
import { renderApp } from "../test/renderApp.jsx";

describe("trends", () => {
  it("charts vitals with reference bands and computes adherence from the logs in range", async () => {
    const { calls } = mockApi();
    renderApp("/patients/p1/trends");
    expect(await screen.findByText("Medication adherence")).toBeInTheDocument();
    expect(screen.getByText("50%")).toBeInTheDocument(); // 1 of 2 logged days
    expect(screen.getByText(/Based on 2 logged days/)).toBeInTheDocument();
    expect(screen.getByText(/Vitals logged: 3 readings/)).toBeInTheDocument();
    expect(screen.getByText("Typical systolic range")).toBeInTheDocument();
    expect(screen.getByText("Typical resting range")).toBeInTheDocument();
    expect(screen.getByText(/Latest: 124\/82 mmHg/)).toBeInTheDocument();
    expect(screen.getByText(/not a personalized target/)).toBeInTheDocument();
    expect(document.querySelectorAll("polyline").length).toBeGreaterThanOrEqual(4); // BP×2, HR, SpO2

    const logsCall = calls.find((c) => c.path === "/patients/p1/logs");
    expect(logsCall.query).toHaveProperty("startDate");
    expect(logsCall.query).toHaveProperty("endDate");
  });

  it("reloads for the chosen range", async () => {
    const { calls } = mockApi();
    const user = userEvent.setup();
    renderApp("/patients/p1/trends");
    await screen.findByText("Medication adherence");
    expect(screen.getByRole("button", { name: "Week" })).toHaveAttribute("aria-pressed", "true");

    await user.click(screen.getByRole("button", { name: "Month" }));
    await waitFor(() => expect(calls.some((c) => c.path === "/patients/p1/vitals/analytics" && c.query.range === "month")).toBe(true));
    expect(await screen.findByText("Medication adherence")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Month" })).toHaveAttribute("aria-pressed", "true");
  });

  it("copes with a patient who has no data at all", async () => {
    mockApi([
      { method: "GET", path: "/patients/p1/vitals/analytics", reply: { data: { range: "week", summary: { totalRecords: 0 }, history: [] } } },
      { method: "GET", path: "/patients/p1/logs", reply: { data: [] } },
      { method: "GET", path: "/patients/p1/physiotherapy", reply: { data: [] } },
    ]);
    renderApp("/patients/p1/trends");
    expect(await screen.findByText(/No daily logs in this range/)).toBeInTheDocument();
    expect(screen.getAllByText("No data in this range").length).toBeGreaterThanOrEqual(3);
  });

  it("shows an error if analytics fail", async () => {
    mockApi([{ method: "GET", path: "/patients/p1/vitals/analytics", reply: { status: 500, message: "Analytics broke" } }]);
    renderApp("/patients/p1/trends");
    expect(await screen.findByText("Analytics broke")).toBeInTheDocument();
  });
});

describe("recovery summary", () => {
  const generate = async (user) => {
    renderApp("/patients/p1/summary");
    await user.click(await screen.findByRole("button", { name: "Generate summary" }));
    await screen.findByText("Overall Overview");
  };

  it("generates a summary for the chosen range, split into its sections", async () => {
    const { calls } = mockApi();
    const user = userEvent.setup();
    renderApp("/patients/p1/summary");
    await user.click(await screen.findByRole("button", { name: "6 Months" }));
    await user.click(screen.getByRole("button", { name: "Generate summary" }));

    expect(await screen.findByText("Overall Overview")).toBeInTheDocument();
    expect(screen.getByText("Vital Trends")).toBeInTheDocument();
    expect(screen.getByText("Suggested Discussion Points")).toBeInTheDocument();
    expect(screen.getByText("Asha is recovering steadily.")).toBeInTheDocument();
    expect(screen.getByText(/not a diagnosis/)).toBeInTheDocument();
    expect(calls.find((c) => c.method === "POST" && c.path === "/patients/p1/summary").query.range).toBe("6months");
    expect(calls.find((c) => c.path === "/patients/p1/vitals/analytics").query.range).toBe("6months");
  });

  it("shows progress while generating and disables the button", async () => {
    let release;
    mockApi([{ method: "POST", path: "/patients/p1/summary", reply: () => new Promise((r) => (release = r)) }]);
    // a reply function may not return a promise in our mock — emulate a slow response instead
    globalThis.fetch.mockImplementation(
      ((orig) => async (url, init) => {
        if (init?.method === "POST" && String(url).includes("/summary")) await new Promise((r) => (release = r));
        return orig(url, init);
      })(globalThis.fetch.getMockImplementation())
    );
    const user = userEvent.setup();
    renderApp("/patients/p1/summary");
    await user.click(await screen.findByRole("button", { name: "Generate summary" }));
    expect(await screen.findByText("Generating your summary…")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Generate summary" })).toBeDisabled();
    expect(screen.getByText("Reviewing physiotherapy sessions")).toBeInTheDocument();
    release();
  });

  it("explains what the summary is based on, collapsed until opened", async () => {
    mockApi();
    const user = userEvent.setup();
    await generate(user);
    const stat = screen.getByText("Vital readings used");
    expect(stat).not.toBeVisible();
    const toggle = screen.getByRole("button", { name: /Based on: week/ });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    await user.click(toggle);
    expect(stat).toBeVisible();
    expect(screen.getByText("Avg blood pressure")).toBeVisible();
    expect(screen.getByText("122/81")).toBeVisible();
    expect(screen.getByText("74 bpm")).toBeVisible();
  });

  it("copies the summary to the clipboard", async () => {
    mockApi();
    const user = userEvent.setup();
    await generate(user);
    await user.click(screen.getByRole("button", { name: /Copy summary/ }));
    expect(await screen.findByText("Summary copied to clipboard")).toBeInTheDocument();
    const copied = await navigator.clipboard.readText();
    expect(copied).toContain("Overall Overview\nAsha is recovering steadily.");
    expect(copied).toContain("Suggested Discussion Points");
  });

  it("downloads the summary as a text file", async () => {
    mockApi();
    const user = userEvent.setup();
    await generate(user);
    URL.createObjectURL = vi.fn(() => "blob:summary");
    URL.revokeObjectURL = vi.fn();
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    await user.click(screen.getByRole("button", { name: /Download as text/ }));
    expect(click).toHaveBeenCalledTimes(1);
    expect(URL.createObjectURL.mock.calls[0][0]).toBeInstanceOf(Blob);
  });

  it("says so when read-aloud isn't supported", async () => {
    mockApi();
    const user = userEvent.setup();
    await generate(user);
    await user.click(screen.getByRole("button", { name: /Read aloud/ }));
    expect(await screen.findByText("Read-aloud isn't supported in this browser")).toBeInTheDocument();
  });

  it("reads aloud and stops when supported", async () => {
    mockApi();
    const speak = vi.fn();
    const cancel = vi.fn();
    window.speechSynthesis = { speak, cancel };
    window.SpeechSynthesisUtterance = function (text) { this.text = text; };
    const user = userEvent.setup();
    await generate(user);
    await user.click(screen.getByRole("button", { name: /Read aloud/ }));
    expect(speak).toHaveBeenCalledTimes(1);
    expect(speak.mock.calls[0][0].text).toContain("Overall Overview");
    await user.click(screen.getByRole("button", { name: /Stop reading/ }));
    expect(cancel).toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /Read aloud/ })).toBeInTheDocument();
    delete window.speechSynthesis;
    delete window.SpeechSynthesisUtterance;
  });

  it("links to the trends for the same patient", async () => {
    mockApi();
    const user = userEvent.setup();
    await generate(user);
    await user.click(screen.getByRole("button", { name: /View trends for this period/ }));
    expect(await screen.findByRole("heading", { name: /Trends — Asha Rao/ })).toBeInTheDocument();
  });

  it("shows the backend's error if generation fails", async () => {
    mockApi([{ method: "POST", path: "/patients/p1/summary", reply: { status: 500, message: "Gemini unavailable" } }]);
    const user = userEvent.setup();
    renderApp("/patients/p1/summary");
    await user.click(await screen.findByRole("button", { name: "Generate summary" }));
    expect(await screen.findByText("Gemini unavailable")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Generate summary" })).toBeEnabled();
  });
});

describe("vitals", () => {
  it("records a reading with numeric values", async () => {
    const { calls } = mockApi();
    const user = userEvent.setup();
    renderApp("/patients/p1/vitals");
    await screen.findByText("Record today's reading");
    await user.type(screen.getByLabelText("BP systolic"), "118");
    await user.type(screen.getByLabelText("BP diastolic"), "76");
    await user.type(screen.getByLabelText("Temperature (°C)"), "36.6");
    await user.click(screen.getByRole("button", { name: "Save reading" }));

    expect(await screen.findByText("Vitals saved")).toBeInTheDocument();
    const body = calls.find((c) => c.method === "POST" && c.path === "/patients/p1/vitals").body;
    expect(body).toMatchObject({ bloodPressureSystolic: 118, bloodPressureDiastolic: 76, temperature: 36.6 });
    expect(body.heartRate).toBeUndefined();
  });

  it("lists the last seven days", async () => {
    mockApi();
    renderApp("/patients/p1/vitals");
    expect(await screen.findByText(/BP 120\/80 · HR 72/)).toBeInTheDocument();
  });

  it("shows the backend error on a failed save", async () => {
    mockApi([{ method: "POST", path: "/patients/p1/vitals", reply: { status: 400, message: "Temperature out of range" } }]);
    const user = userEvent.setup();
    renderApp("/patients/p1/vitals");
    await screen.findByText("Record today's reading");
    await user.type(screen.getByLabelText("Temperature (°C)"), "99");
    await user.click(screen.getByRole("button", { name: "Save reading" }));
    expect(await screen.findByText("Temperature out of range")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save reading" })).toBeEnabled();
  });
});

describe("physiotherapy log", () => {
  it("won't save an unnamed exercise", async () => {
    const { calls } = mockApi();
    const user = userEvent.setup();
    renderApp("/patients/p1/physiotherapy");
    await user.click(await screen.findByRole("button", { name: "Save session" }));
    expect(await screen.findByText("Add at least one exercise with a name.")).toBeInTheDocument();
    expect(calls.filter((c) => c.method === "POST")).toHaveLength(0);
  });

  it("saves several named exercises, and can add and remove rows", async () => {
    const { calls } = mockApi();
    const user = userEvent.setup();
    renderApp("/patients/p1/physiotherapy");
    await user.type(await screen.findByLabelText("Exercise name"), "Walk");
    await user.click(screen.getByRole("button", { name: "+ Add exercise" }));
    expect(screen.getAllByLabelText("Exercise name")).toHaveLength(2);
    await user.type(screen.getAllByLabelText("Exercise name")[1], "Stretch");
    await user.selectOptions(screen.getAllByLabelText("Pain level")[1], "Severe");
    await user.click(screen.getAllByRole("button", { name: "Remove" })[0]);
    expect(screen.getAllByLabelText("Exercise name")).toHaveLength(1);
    await user.click(screen.getByRole("button", { name: "+ Add exercise" }));
    await user.type(screen.getAllByLabelText("Exercise name")[1], "Lunges");
    await user.click(screen.getByRole("button", { name: "Save session" }));

    expect(await screen.findByText("Physiotherapy session saved")).toBeInTheDocument();
    const body = calls.find((c) => c.method === "POST" && c.path === "/patients/p1/physiotherapy").body;
    expect(body.exercises.map((e) => e.exerciseName)).toEqual(["Stretch", "Lunges"]);
    expect(body.exercises[0]).toMatchObject({ painLevel: "Severe", duration: 15, completed: true });
  });
});

describe("prescriptions", () => {
  it("lists current medicines", async () => {
    mockApi();
    renderApp("/patients/p1/prescriptions");
    expect(await screen.findByText("Metformin · 500mg")).toBeInTheDocument();
    expect(screen.getByText(/Twice daily · Oral · Dr. Shah/)).toBeInTheDocument();
  });

  it("warns about medicines expiring soon", async () => {
    mockApi([{ method: "GET", path: "/patients/p1/prescriptions/expiring", reply: { data: [{ _id: "m1" }, { _id: "m2" }] } }]);
    renderApp("/patients/p1/prescriptions");
    expect(await screen.findByText("2 medicines are expiring within 7 days.")).toBeInTheDocument();
  });

  it("adds a prescription through the modal", async () => {
    const { calls } = mockApi([{ method: "POST", path: "/patients/p1/prescriptions", reply: { data: { _id: "m3" } } }]);
    const user = userEvent.setup();
    renderApp("/patients/p1/prescriptions");
    await user.click(await screen.findByRole("button", { name: "+ Add prescription" }));
    const dialog = screen.getByRole("dialog", { name: "Add prescription" });
    await user.type(within(dialog).getByLabelText("Medicine name"), "Atorvastatin");
    await user.type(within(dialog).getByLabelText("Dosage"), "40mg");
    await user.type(within(dialog).getByLabelText("Frequency"), "Night");
    fireEvent.change(within(dialog).getByLabelText("Start date"), { target: { value: "2026-10-01" } });
    await user.click(within(dialog).getByRole("button", { name: "Add" }));

    expect(await screen.findByText("Prescription added")).toBeInTheDocument();
    expect(calls.find((c) => c.method === "POST" && c.path === "/patients/p1/prescriptions").body).toMatchObject({
      medicineName: "Atorvastatin",
      dosage: "40mg",
      frequency: "Night",
      startDate: "2026-10-01",
    });
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});

describe("reports", () => {
  it("lists reports with a link to each file", async () => {
    mockApi();
    renderApp("/patients/p1/reports");
    expect(await screen.findByText("Chest X-ray")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View" })).toHaveAttribute("href", "http://files/x.pdf");
  });

  it("copes with the date-range response shape (a bare array)", async () => {
    mockApi([{ method: "GET", path: "/patients/p1/reports", reply: { data: [{ _id: "r9", reportName: "ECG trace", category: "ECG", reportDate: "2026-10-01" }] } }]);
    renderApp("/patients/p1/reports");
    expect(await screen.findByText("ECG trace")).toBeInTheDocument();
  });

  it("uploads a report as multipart form data", async () => {
    const { calls } = mockApi([{ method: "POST", path: "/patients/p1/reports", reply: { data: { _id: "r2" } } }]);
    const user = userEvent.setup();
    renderApp("/patients/p1/reports");
    await user.click(await screen.findByRole("button", { name: "+ Upload report" }));
    const dialog = screen.getByRole("dialog", { name: "Upload report" });
    await user.upload(within(dialog).getByLabelText("Report file"), new File(["%PDF"], "scan.pdf", { type: "application/pdf" }));
    await user.selectOptions(within(dialog).getByLabelText("Category"), "MRI");
    fireEvent.change(within(dialog).getByLabelText("Report date"), { target: { value: "2026-10-02" } });
    await user.type(within(dialog).getByLabelText("Report name"), "Knee MRI");
    // jsdom doesn't count files attached by user.upload() towards `required`, so submit the form directly.
    fireEvent.submit(dialog.querySelector("form"));

    expect(await screen.findByText("Report uploaded")).toBeInTheDocument();
    const body = calls.find((c) => c.method === "POST" && c.path === "/patients/p1/reports").body;
    expect(body).toBeInstanceOf(FormData);
    expect(body.get("reportFile").name).toBe("scan.pdf");
    expect(body.get("category")).toBe("MRI");
    expect(body.get("reportName")).toBe("Knee MRI");
    // the browser must set the multipart boundary itself — no JSON content-type
    expect(globalThis.fetch.mock.calls.find(([u, i]) => i?.method === "POST" && String(u).endsWith("/reports"))[1].headers["Content-Type"]).toBeUndefined();
  });
});
