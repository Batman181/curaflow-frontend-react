import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { mockApi } from "../test/mockApi.js";
import { renderApp } from "../test/renderApp.jsx";

describe("dashboard", () => {
  it("greets the caregiver and shows today's stats", async () => {
    mockApi();
    renderApp("/dashboard");
    expect(await screen.findByText("Total patients")).toBeInTheDocument(); // wait for data, not the loading state
    expect(screen.getByRole("heading", { level: 1, name: /, Karelle$/ })).toBeInTheDocument();
    expect(screen.getByText("75%")).toBeInTheDocument(); // 3 of 4 medicine schedules
    expect(screen.getByText("Medicine adherence today")).toBeInTheDocument();
    expect(screen.getByText("Reports uploaded today")).toBeInTheDocument();
  });

  it("derives on-track / attention from whether today's log exists", async () => {
    mockApi();
    renderApp("/dashboard");
    expect(await screen.findByText("⚠ Attention")).toBeInTheDocument(); // Asha — no log today
    expect(screen.getByText("✓ On-track")).toBeInTheDocument(); // Ravi — logged
    expect(screen.getByText("1/2")).toBeInTheDocument();
    expect(screen.getByText(/1 need attention/)).toBeInTheDocument();
  });

  it("lists recent reports with a link to the file", async () => {
    mockApi();
    renderApp("/dashboard");
    expect(await screen.findByText("Chest X-ray")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View" })).toHaveAttribute("href", "http://files/x.pdf");
  });

  it("asks which patient when there are several, then goes to their daily log", async () => {
    mockApi();
    const user = userEvent.setup();
    renderApp("/dashboard");
    await user.click(await screen.findByRole("button", { name: "📋 Log today's care" }));
    const dialog = await screen.findByRole("dialog", { name: "Choose a patient" });
    await user.click(within(dialog).getByRole("button", { name: "Asha Rao" }));
    expect(await screen.findByRole("heading", { name: "Daily log — Asha Rao" })).toBeInTheDocument();
  });

  it("opens a patient's daily log from the overview list", async () => {
    mockApi();
    const user = userEvent.setup();
    renderApp("/dashboard");
    await screen.findByText("⚠ Attention");
    await user.click(screen.getByRole("button", { name: /Ravi Menon/ }));
    expect(await screen.findByRole("heading", { name: /Daily log/ })).toBeInTheDocument();
  });

  it("shows an error message if the dashboard can't load", async () => {
    mockApi([{ method: "GET", path: "/dashboard", reply: { status: 500, message: "Database is down" } }]);
    renderApp("/dashboard");
    expect(await screen.findByText("Database is down")).toBeInTheDocument();
  });

  it("explains a gateway timeout instead of a bare status code", async () => {
    mockApi();
    globalThis.fetch.mockImplementationOnce(async () => ({ ok: false, status: 504, json: async () => { throw new Error("not json"); } }));
    renderApp("/dashboard");
    expect(await screen.findByText(/may still be waking up/)).toBeInTheDocument();
  });
});

describe("my patients", () => {
  it("shows each patient with a status badge and opens the daily log on click", async () => {
    mockApi();
    const user = userEvent.setup();
    renderApp("/patients");
    expect(await screen.findByText("Not logged yet")).toBeInTheDocument();
    expect(screen.getByText("Logged today")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Open Asha Rao's daily log" }));
    expect(await screen.findByRole("heading", { name: "Daily log — Asha Rao" })).toBeInTheDocument();
  });

  it("needs two taps to delete a patient", async () => {
    const { calls } = mockApi();
    const user = userEvent.setup();
    renderApp("/patients");
    await user.click(await screen.findByRole("button", { name: "Delete Asha Rao" }));

    expect(calls.some((c) => c.method === "DELETE")).toBe(false); // armed, not deleted
    expect(screen.getByRole("heading", { name: "My patients" })).toBeInTheDocument(); // and did not navigate away

    await user.click(screen.getByRole("button", { name: "Confirm delete Asha Rao" }));
    await waitFor(() => expect(calls.some((c) => c.method === "DELETE" && c.path === "/patients/p1")).toBe(true));
    expect(await screen.findByText("Patient removed")).toBeInTheDocument();
  });

  it("does not open the patient when Enter is pressed on the delete button", async () => {
    mockApi();
    const user = userEvent.setup();
    renderApp("/patients");
    const del = await screen.findByRole("button", { name: "Delete Asha Rao" });
    del.focus();
    await user.keyboard("{Enter}");
    expect(screen.getByRole("heading", { name: "My patients" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirm delete Asha Rao" })).toBeInTheDocument();
  });

  it("opens the tile with the keyboard", async () => {
    mockApi();
    const user = userEvent.setup();
    renderApp("/patients");
    const tile = await screen.findByRole("button", { name: "Open Asha Rao's daily log" });
    tile.focus();
    await user.keyboard("{Enter}");
    expect(await screen.findByRole("heading", { name: /Daily log/ })).toBeInTheDocument();
  });

  it("adds a patient through the modal, and Escape closes it", async () => {
    const { calls } = mockApi([{ method: "POST", path: "/patients", reply: { data: { _id: "p9" } } }]);
    const user = userEvent.setup();
    renderApp("/patients");
    await user.click(await screen.findByRole("button", { name: "+ Add patient" }));
    expect(screen.getByRole("dialog", { name: "Add patient" })).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();

    await user.click(screen.getByRole("button", { name: "+ Add patient" }));
    await user.type(screen.getByLabelText("Full name"), "  New Person ");
    fireEvent.change(screen.getByLabelText("Date of birth"), { target: { value: "1950-01-01" } });
    await user.selectOptions(screen.getByLabelText("Gender"), "female");
    await user.type(screen.getByLabelText("Allergies (comma separated)"), "Dust, Penicillin");
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Add patient" }));

    expect(await screen.findByText("Patient added")).toBeInTheDocument();
    expect(calls.find((c) => c.method === "POST" && c.path === "/patients").body).toMatchObject({
      fullname: "New Person",
      dateOfBirth: "1950-01-01",
      gender: "female",
      allergies: ["Dust", "Penicillin"],
    });
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("shows the backend's validation error inside the modal", async () => {
    mockApi([{ method: "POST", path: "/patients", reply: { status: 400, message: "Patient already exists" } }]);
    const user = userEvent.setup();
    renderApp("/patients");
    await user.click(await screen.findByRole("button", { name: "+ Add patient" }));
    await user.type(screen.getByLabelText("Full name"), "X");
    fireEvent.change(screen.getByLabelText("Date of birth"), { target: { value: "1950-01-01" } });
    await user.selectOptions(screen.getByLabelText("Gender"), "male");
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Add patient" }));
    expect(await screen.findByText("Patient already exists")).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});

describe("workspace + weekly summary", () => {
  it("workspace shows the six tiles and the not-logged banner", async () => {
    mockApi();
    renderApp("/patients/p1");
    expect(await screen.findByText("Today's care hasn't been logged yet for Asha Rao.")).toBeInTheDocument();
    for (const name of ["Daily log", "Vitals", "Physiotherapy", "Prescriptions", "Reports", "AI recovery summary"]) {
      expect(screen.getByText(name, { selector: ".tile-name" })).toBeInTheDocument();
    }
    expect(screen.getByText("2 current medicines")).toBeInTheDocument();
  });

  it("weekly summary shows counts, and says missing days were never recorded", async () => {
    mockApi();
    renderApp("/patients/p1/dashboard");
    expect(await screen.findByRole("heading", { name: "Asha Rao — weekly dashboard" })).toBeInTheDocument();
    expect(screen.getByText("2/7")).toBeInTheDocument();
    expect(screen.getByText("6.0h")).toBeInTheDocument();
    expect(screen.getByText(/Only 2 of the last 7 days/)).toBeInTheDocument();
    expect(screen.getByText("Metformin · 500mg")).toBeInTheDocument();
  });

  it("weekly summary's back button leads to the workspace", async () => {
    mockApi();
    const user = userEvent.setup();
    renderApp("/patients/p1/dashboard");
    await user.click(await screen.findByRole("button", { name: "← Back to workspace" }));
    expect(await screen.findByText("Today's care hasn't been logged yet for Asha Rao.")).toBeInTheDocument();
  });
});
