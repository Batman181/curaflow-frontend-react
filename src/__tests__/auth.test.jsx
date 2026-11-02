import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { DEFAULT_API_BASE, getApiBase, setApiBase } from "../config.js";
import { defaultRoutes, mockApi } from "../test/mockApi.js";
import { renderApp } from "../test/renderApp.jsx";

describe("authentication", () => {
  it("sends signed-out visitors to the login screen", async () => {
    mockApi();
    renderApp("/dashboard", { authed: false });
    expect(await screen.findByText("Sign in to your caregiver workspace.")).toBeInTheDocument();
  });

  it("signs in with an email and lands on the dashboard", async () => {
    const { calls } = mockApi();
    const user = userEvent.setup();
    renderApp("/dashboard", { authed: false });

    await user.type(await screen.findByLabelText("Email or username"), "k@example.com");
    await user.type(screen.getByLabelText("Password"), "secret");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByText("Total patients")).toBeInTheDocument();
    expect(calls.find((c) => c.path === "/users/login").body).toEqual({ email: "k@example.com", password: "secret" });
    expect(localStorage.getItem("curaflow_access_token")).toBe("acc");
  });

  it("sends a username (not an email) when there is no @", async () => {
    const { calls } = mockApi();
    const user = userEvent.setup();
    renderApp("/dashboard", { authed: false });
    await user.type(await screen.findByLabelText("Email or username"), "karelle");
    await user.type(screen.getByLabelText("Password"), "pw");
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    await screen.findByText("Total patients");
    expect(calls.find((c) => c.path === "/users/login").body).toEqual({ username: "karelle", password: "pw" });
  });

  it("shows the backend's message for bad credentials — even with a stale refresh token around", async () => {
    mockApi([{ method: "POST", path: "/users/login", reply: { status: 401, message: "Invalid user credentials" } }]);
    localStorage.setItem("curaflow_refresh_token", "stale");
    const user = userEvent.setup();
    renderApp("/dashboard", { authed: false });
    await user.type(await screen.findByLabelText("Email or username"), "a@b.co");
    await user.type(screen.getByLabelText("Password"), "wrong");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByText("Invalid user credentials")).toBeInTheDocument();
    expect(screen.queryByText(/session expired/i)).toBeNull();
    expect(screen.getByRole("button", { name: "Sign in" })).toBeEnabled();
  });

  it("returns to the page you were headed to after signing in", async () => {
    mockApi();
    const user = userEvent.setup();
    renderApp("/patients/p1/trends", { authed: false });
    await user.type(await screen.findByLabelText("Email or username"), "k@example.com");
    await user.type(screen.getByLabelText("Password"), "secret");
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByRole("heading", { name: /Trends — Asha Rao/ })).toBeInTheDocument();
  });

  it("signs out back to the login screen and calls the logout endpoint", async () => {
    const { calls } = mockApi();
    const user = userEvent.setup();
    renderApp("/dashboard");
    await screen.findByText("Total patients");
    await user.click(screen.getByRole("button", { name: /Sign out/ }));
    expect(await screen.findByText("Sign in to your caregiver workspace.")).toBeInTheDocument();
    expect(calls.some((c) => c.method === "POST" && c.path === "/users/logout")).toBe(true);
    expect(localStorage.getItem("curaflow_access_token")).toBeNull();
  });

  it("silently refreshes an expired access token and retries the request", async () => {
    const dashboard = defaultRoutes().find((r) => r.path === "/dashboard").reply;
    let hits = 0;
    const { calls } = mockApi([
      { method: "GET", path: "/dashboard", reply: () => (++hits === 1 ? { status: 401, message: "jwt expired" } : dashboard) },
      { method: "POST", path: "/users/refresh-token", reply: { data: { accessToken: "new-acc", refreshToken: "new-ref" } } },
    ]);
    renderApp("/dashboard");
    expect(await screen.findByText("Total patients")).toBeInTheDocument();
    expect(localStorage.getItem("curaflow_access_token")).toBe("new-acc");
    expect(calls.find((c) => c.path === "/users/refresh-token").body).toEqual({ refreshToken: "ref" });
  });

  it("drops back to login (with a toast) when the refresh also fails", async () => {
    mockApi([
      { method: "GET", path: "/dashboard", reply: { status: 401, message: "jwt expired" } },
      { method: "POST", path: "/users/refresh-token", reply: { status: 401, message: "Refresh token expired" } },
    ]);
    renderApp("/dashboard");
    expect(await screen.findByText("Sign in to your caregiver workspace.")).toBeInTheDocument();
    expect(await screen.findByText("Your session expired — please log in again")).toBeInTheDocument();
  });
});

describe("backend URL setting", () => {
  it("defaults to the same-origin /api/v1 path that the dev server and nginx proxy", () => {
    expect(DEFAULT_API_BASE).toBe("/api/v1");
    expect(getApiBase()).toBe("/api/v1");
  });

  it("saves an override (trimming a trailing slash) and clears it when emptied", () => {
    setApiBase(" http://localhost:8000/api/v1/ ");
    expect(getApiBase()).toBe("http://localhost:8000/api/v1");
    setApiBase("");
    expect(getApiBase()).toBe("/api/v1");
  });

  it("can be edited from the login screen, and requests then go to that URL", async () => {
    const { calls } = mockApi();
    renderApp("/dashboard", { authed: false });
    const input = await screen.findByLabelText("Backend API URL");
    fireEvent.change(input, { target: { value: "http://localhost:8000/api/v1" } });
    fireEvent.blur(input);
    expect(await screen.findByText("API URL updated")).toBeInTheDocument();
    expect(localStorage.getItem("curaflow_api_base")).toBe("http://localhost:8000/api/v1");

    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Email or username"), "k@example.com");
    await user.type(screen.getByLabelText("Password"), "secret");
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    await waitFor(() => expect(globalThis.fetch.mock.calls[0][0]).toBe("http://localhost:8000/api/v1/users/login"));
    expect(calls.length).toBeGreaterThan(0);
  });
});

describe("app shell", () => {
  it("redirects unknown URLs to the dashboard", async () => {
    mockApi();
    renderApp("/no/such/page");
    expect(await screen.findByText("Total patients")).toBeInTheDocument();
  });

  it("shows the topbar title for each route and highlights the active nav item", async () => {
    mockApi();
    renderApp("/patients");
    await screen.findByRole("heading", { name: "My patients" });
    expect(document.querySelector(".topbar-title")).toHaveTextContent("My patients");
    expect(screen.getByRole("button", { name: /My patients/ })).toHaveAttribute("aria-current", "page");
  });

  it("shows the patient's nav section on a deep link, before the patient list was ever loaded", async () => {
    mockApi();
    renderApp("/patients/p1/log");
    expect(await screen.findByRole("heading", { name: "Daily log — Asha Rao" })).toBeInTheDocument();
    const sidebar = document.querySelector(".sidebar");
    expect(await within(sidebar).findByText("Asha Rao")).toBeInTheDocument();
    for (const label of [/Daily log/, /Recovery summary/, /Trends/, /Prescriptions/, /Reports/, /Vitals history/, /Physiotherapy log/, /Weekly summary/]) {
      expect(within(sidebar).getByRole("button", { name: label })).toBeInTheDocument();
    }
    expect(within(sidebar).getByRole("button", { name: /Daily log/ })).toHaveAttribute("aria-current", "page");
  });

  it("opens and closes the mobile menu, and closes it after navigating", async () => {
    mockApi();
    const user = userEvent.setup();
    renderApp("/dashboard");
    await screen.findByText("Total patients");
    const sidebar = document.querySelector(".sidebar");
    await user.click(screen.getByRole("button", { name: "Toggle navigation menu" }));
    expect(sidebar).toHaveClass("is-open");
    await user.click(within(sidebar).getByRole("button", { name: /My patients/ }));
    await screen.findByRole("heading", { name: "My patients" });
    expect(sidebar).not.toHaveClass("is-open");
  });
});
