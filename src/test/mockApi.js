import { vi } from "vitest";

export const p1 = { _id: "p1", fullname: "Asha Rao", dateOfBirth: "1950-03-01", gender: "female", bloodGroup: "O+" };
export const p2 = { _id: "p2", fullname: "Ravi Menon", dateOfBirth: "1946-07-12", gender: "male", bloodGroup: "A+" };

const today = new Date().toISOString().slice(0, 10);
const day = (n) => new Date(Date.now() - n * 86400000).toISOString();

/** Default fixtures for every endpoint the app calls. Tests prepend overrides (first match wins). */
export function defaultRoutes() {
  const ok = (data) => ({ data });
  return [
    { method: "POST", path: "/users/login", reply: ok({ user: { fullname: "Karelle Klocko", email: "k@example.com" }, accessToken: "acc", refreshToken: "ref" }) },
    { method: "POST", path: "/users/logout", reply: ok(null) },
    { method: "GET", path: "/dashboard", reply: ok({
        overview: { totalPatients: 2, activePatients: 2, reportsUploadedToday: 1 },
        today: { medicineSchedules: 4, medicineCompleted: 3, medicinePending: 1, vitalsRecorded: 1, physiotherapySessions: 1 },
        recentPatients: [{ _id: "p1", fullname: p1.fullname, gender: "female" }, { _id: "p2", fullname: p2.fullname, gender: "male" }],
        recentReports: [{ _id: "r1", reportName: "Chest X-ray", category: "XRay", reportDate: day(1), reportFile: "http://files/x.pdf", patient: { fullname: p1.fullname } }],
      }) },
    { method: "GET", path: "/patients", reply: ok({ patients: [p1, p2], pagination: { total: 2 } }) },
    { method: "GET", path: "/patients/p1", reply: ok(p1) },
    { method: "GET", path: "/patients/p2", reply: ok(p2) },
    { method: "DELETE", path: "/patients/p1", reply: ok(null) },
    { method: "GET", path: "/patients/p1/dashboard", reply: ok({
        patient: p1,
        weeklySummary: {
          weeklyLog: [{ medicinesTaken: true, physiotherapyDone: true, exerciseDone: false, sleepHours: 7 }, { medicinesTaken: false, physiotherapyDone: false, exerciseDone: true, sleepHours: 5 }],
          currentPrescription: [{ _id: "m1", medicineName: "Metformin", dosage: "500mg", frequency: "Twice daily", endDate: day(-30) }],
          weeklyVitals: [{ _id: "v1", date: day(1), bloodPressureSystolic: 120, bloodPressureDiastolic: 80, heartRate: 72, oxygenSaturation: 98 }],
          weeklyPhysiotherapy: [{ _id: "pt1", date: day(1), exercises: [{ exerciseName: "Walk" }] }],
          weeklyReports: [],
        },
      }) },
    // today's records: p1 hasn't been logged, p2 has
    { method: "GET", path: "/patients/p1/logs/today", reply: ok(null) },
    { method: "GET", path: "/patients/p2/logs/today", reply: ok({ _id: "log-p2" }) },
    { method: "GET", path: "/patients/p1/vitals/today", reply: ok(null) },
    { method: "GET", path: "/patients/p1/physiotherapy/today", reply: ok(null) },
    { method: "GET", path: "/patients/p1/prescriptions/current", reply: ok([
        { _id: "m1", medicineName: "Metformin", dosage: "500mg", frequency: "Twice daily", route: "Oral", doctorName: "Dr. Shah", endDate: day(-30) },
        { _id: "m2", medicineName: "Aspirin", dosage: "75mg", frequency: "Once daily", route: "Oral", endDate: day(-30) },
      ]) },
    { method: "GET", path: "/patients/p1/prescriptions/expiring", reply: ok([]) },
    { method: "GET", path: "/patients/p1/reports", reply: ok({ reports: [{ _id: "r1", reportName: "Chest X-ray", category: "XRay", reportDate: day(1), reportFile: "http://files/x.pdf" }], pagination: { total: 1 } }) },
    { method: "GET", path: "/patients/p1/vitals/weekly", reply: ok([{ _id: "v1", date: day(1), bloodPressureSystolic: 120, bloodPressureDiastolic: 80, heartRate: 72 }]) },
    { method: "GET", path: "/patients/p1/physiotherapy/weekly", reply: ok([]) },
    { method: "GET", path: "/patients/p1/vitals/analytics", reply: ok({
        range: "week",
        summary: { totalRecords: 3, averageBloodPressure: { systolic: 122, diastolic: 81 }, averageHeartRate: 74, averageOxygenSaturation: 97 },
        history: [
          { date: day(0), bloodPressureSystolic: 124, bloodPressureDiastolic: 82, heartRate: 75, oxygenSaturation: 97 },
          { date: day(1), bloodPressureSystolic: 120, bloodPressureDiastolic: 80, heartRate: 73, oxygenSaturation: 98 },
          { date: day(2), bloodPressureSystolic: 122, bloodPressureDiastolic: 81, heartRate: 74, oxygenSaturation: 96 },
        ],
      }) },
    { method: "GET", path: "/patients/p1/logs", reply: ok([{ medicinesTaken: true }, { medicinesTaken: false }]) },
    { method: "GET", path: "/patients/p1/physiotherapy", reply: ok([{ date: day(1), exercises: [{ painLevel: "Mild" }, { painLevel: "Moderate" }] }]) },
    { method: "POST", path: "/patients/p1/summary", reply: ok({ summary: "Overall Overview\nAsha is recovering steadily.\n\nVital Trends\nBlood pressure is stable.\n\nSuggested Discussion Points\nAsk about sleep.", generatedAt: today + "T10:00:00.000Z", promptVersion: "v1", patientId: "p1" }) },
    { method: "POST", path: "/patients/p1/logs", reply: ok({ _id: "log1" }) },
    { method: "PATCH", path: "/logs/log1", reply: ok({ _id: "log1" }) },
    { method: "POST", path: "/patients/p1/vitals", reply: ok({ _id: "vit1" }) },
    { method: "PATCH", path: "/vitals/vit1", reply: ok({ _id: "vit1" }) },
    { method: "POST", path: "/patients/p1/physiotherapy", reply: ok({ _id: "phy1" }) },
    { method: "PATCH", path: "/physiotherapy/phy1", reply: ok({ _id: "phy1" }) },
  ];
}

/**
 * Installs a fake global fetch. `overrides` are matched before the defaults.
 * A reply may be { data, status?, message? } or a function (call) => that.
 * Returns { calls } — every request made, as { method, path, query, body }.
 */
export function mockApi(overrides = []) {
  const routes = [...overrides, ...defaultRoutes()];
  const calls = [];

  globalThis.fetch = vi.fn(async (url, init = {}) => {
    const method = (init.method || "GET").toUpperCase();
    const u = new URL(url, "http://localhost");
    const path = u.pathname.replace(/^\/api\/v1/, "");
    const body = typeof init.body === "string" ? JSON.parse(init.body) : init.body;
    const call = { method, path, query: Object.fromEntries(u.searchParams), body };
    calls.push(call);

    const route = routes.find((r) => r.method === method && (r.path instanceof RegExp ? r.path.test(path) : r.path === path));
    if (!route) return respond(404, null, `No mock for ${method} ${path}`);
    const reply = typeof route.reply === "function" ? route.reply(call) : route.reply;
    return respond(reply.status ?? 200, reply.data ?? null, reply.message ?? "ok");
  });

  return { calls };
}

function respond(status, data, message) {
  return {
    ok: status < 400,
    status,
    json: async () => ({ statusCode: status, data, message, success: status < 400 }),
  };
}
