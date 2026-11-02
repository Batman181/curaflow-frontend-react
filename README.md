
# CuraFlow — Frontend

**A caregiver workspace for tracking a patient's medications, vitals, physiotherapy and daily wellness — with AI-generated recovery summaries that show their evidence.**

The React frontend for the [CuraFlow backend](https://github.com/shauryapastor2005-cyber/CuraFlow-Backend) (Node / Express / MongoDB). It is built around one question: *can a tired caregiver open the app at 9pm, log today's care in under a minute, and trust what the AI tells them about their patient's recovery?*

---

## The problem

Caregiving at home means juggling five kinds of information — medications, vitals, physiotherapy, daily wellness and medical records — usually across two or three apps that each cover one slice. On top of that:

- **Logging is a chore.** Too much typing at the end of a long day, so logging stops.
- **Interfaces aren't built for the moment they're used in.** Dense tables and clinical jargon work against a quick check-in, often on a phone.
- **AI summaries rarely explain themselves.** A caregiver is asked to trust a paragraph of text with no way to see what it was based on.

## Objectives

- One low-friction daily check-in covering medications, vitals, physiotherapy and wellness, instead of five separate screens.
- Toggles, sliders and steppers by default rather than open text fields.
- AI recovery summaries paired with the data behind them, and a clear "this is not a diagnosis" reminder.
- Glanceable, colour-coded status (on track / needs attention) instead of raw tables.
- Built for caregivers with more than one patient.

---

## Navigating the app

| Section | Screen | What it's for |
|---|---|---|
| **Overview** | Dashboard | Landing page — today's activity across every patient, who needs attention, recent reports |
| | My patients | The full patient list with an on-track / needs-attention status; add or remove patients |
| **Care** *(per patient)* | Daily log | The core check-in — medications, vitals, physiotherapy and wellness in one flow |
| | Recovery summary | AI recovery overview for a chosen time range, with the data it's based on |
| | Trends | Charts of vitals, medication adherence and pain levels, with typical-range bands |
| **Records** *(per patient)* | Prescriptions | Current medications; add new ones |
| | Reports | Upload and view scans, lab results and documents |
| | Vitals history / Physiotherapy log | Full history, and a detailed multi-exercise session editor |
| | Weekly summary | An itemised 7-day view across logs, vitals, physiotherapy and reports |

Choosing a patient from the dashboard or the patient list opens their **Daily log** directly — logging care is the most time-pressured task, so it's one click away.

---

## Project presentation and demo

- **Project Presentation:** [CuraFlow.pptx](./CuraFlow.pptx)
- **Demo Video:** [Watch CuraFlow Demo](https://drive.google.com/file/d/1j4HzDnw-K_-BHutGDpxzT479BQ5q4bFl/view)

---

## Tech stack

| | |
|---|---|
| UI | React 18, React Router 6 |
| Build / dev server | Vite 5 |
| Styling | Plain CSS (design tokens + component styles) — no CSS framework |
| Charts | Hand-written SVG components — no chart library |
| Tests | Vitest, Testing Library, jsdom (against a mocked backend) |
| Container | Docker (multi-stage build) → nginx |
| Backend | Node.js, Express, MongoDB, JWT, Gemini — [separate repository](https://github.com/shauryapastor2005-cyber/CuraFlow-Backend) |

---

## Getting started

### Option 1 — Docker

```bash
docker compose up --build
```

Open **http://localhost:3000**. This builds the app and serves it with nginx, which also forwards `/api` to the backend (see [How it talks to the backend](#how-it-talks-to-the-backend)).

Without Compose:

```bash
docker build -t curaflow-frontend .
docker run --rm -p 3000:80 -e BACKEND_ORIGIN=https://curaflow-backend-pfrn.onrender.com curaflow-frontend
```

For development with hot reload inside a container: `docker compose --profile dev up dev`.

### Option 2 — Node

Requires Node 18+ (20 recommended).

```bash
npm install
npm run dev      # http://localhost:3000
```

Other scripts: `npm run build` (production build to `dist/`), `npm run preview` (serve that build), `npm test` (run the tests).

### Signing in

Use a caregiver account from the backend.

### Configuration

All optional — copy `.env.example` to `.env` to change them.

| Variable | Default | Purpose |
|---|---|---|
| `BACKEND_ORIGIN` | `https://curaflow-backend-pfrn.onrender.com` | Where `/api` is forwarded — by `npm run dev` and by the nginx container. No trailing path. |
| `WEB_PORT` | `3000` | Host port for the nginx container |
| `VITE_API_BASE_URL` | *(unset)* | Build-time. Call a backend **directly** instead of through the proxy (needs CORS — see below) |
| `VITE_USE_POLLING` | `false` | Set `true` if hot reload doesn't see file changes in Docker on Windows/macOS |

**Using a backend on your own machine**

- With `npm run dev`: `BACKEND_ORIGIN=http://localhost:8000`
- With Docker: `BACKEND_ORIGIN=http://host.docker.internal:8000` (inside a container, `localhost` is the container itself)

There is also a **Backend API URL** field on the login screen (saved per browser). Clear it to return to the default.

---

## How it talks to the backend

The app calls a same-origin path, **`/api/v1/...`**. The Vite dev server and the nginx container both forward `/api` to `BACKEND_ORIGIN`. Because the browser only ever sees its own origin:

- the backend's `CORS_ORIGIN` setting doesn't matter, and
- a slow first response from a sleeping Render free-tier service (30–60 s) isn't reported as a CORS failure — the proxy waits up to two minutes.

Authentication uses the `Authorization: Bearer` header (the login response returns the tokens in its body). On a `401` the client refreshes the token once, silently, and retries; if that fails it returns you to the login screen.

If you'd rather call a backend directly (`VITE_API_BASE_URL` or the login-screen field), the requests are cross-origin and the backend's `CORS_ORIGIN` must allow this app's origin.

---

## Project structure

```text
CuraFlow-Frontend/
├── CuraFlow.pptx               Project presentation
├── index.html                  Vite entry
├── vite.config.js              Dev server, /api proxy, test config
├── package.json
├── Dockerfile                  Multi-stage: install → build → nginx
├── docker-compose.yml          `web` (nginx) and `dev` (Vite, hot reload) services
├── docker/
│   ├── default.conf             nginx: static files, SPA fallback, /api proxy
│   ├── 15-backend-proxy.sh      Turns BACKEND_ORIGIN into proxy settings at container start
│   └── security-headers.conf
├── public/                      Static files (favicon)
└── src/
    ├── main.jsx                 Entry point
    ├── App.jsx                  Providers + router
    ├── config.js                API base URL
    ├── routes/                  Route table (page titles live here) + auth guard
    ├── pages/                   One component per screen
    ├── components/
    │   ├── layout/              App shell: sidebar, topbar
    │   ├── common/              Modal, Segmented, Toggle, Stepper, Field, …
    │   ├── charts/              LineChart, BarChart (SVG)
    │   ├── dailylog/            The daily-log form, split into its sections
    │   ├── patients/ prescriptions/ reports/ summary/
    ├── api/
    │   ├── client.js            fetch wrapper: auth header, token refresh, friendly errors
    │   └── endpoints.js         Every backend call, grouped by resource
    ├── context/                 Toast, Auth, Patients
    ├── hooks/                   useAsync (data loading), usePatient
    ├── utils/                   Formatting, date ranges, summary parsing
    ├── styles/                  base.css (tokens, layout) + components.css
    ├── test/                    Mock backend + render helper
    └── __tests__/               Test suites
```

### Architecture notes

- **Routing** — React Router; each route declares its topbar title, and `RequireAuth` guards everything but `/login` (and returns you to the page you were heading to after signing in).
- **State** — three small contexts (toasts, auth, a patient cache) plus local component state. No global store. Deep links such as `/patients/:id/log` fetch the patient themselves, so the heading and sidebar always have the name.
- **Data loading** — pages load with the `useAsync` hook and own their loading and error states.
- **Forms** — the daily log is one screen but saves up to **three** backend records (daily log, vitals, physiotherapy). They are saved independently, so one failure never loses the others, and a retry updates what already saved instead of creating a duplicate (the backend allows one record per patient per day).

### Where the interface and the backend's data model differ

A few places where the UI is deliberately friendlier than what the API stores:

- **Per-medicine Taken / Skipped** — the backend stores one `medicinesTaken` flag per day. The log shows each medicine, then records `true` only if every one was marked Taken.
- **Pain slider** — 0–10 on screen; the backend stores `None / Mild / Moderate / Severe`. The slider buckets into those (and shows the resulting word as you drag).
- **Temperature** — in °C, matching the backend's validation range.
- **"Skip today"** — skipping Vitals or Physiotherapy means *no record is sent* for that section, not just a visual dim.
- **Weekly summary** — the endpoint returns daily-log fields without dates, so it shows counts ("logged 5 of the last 7 days"), not a day-by-day list.
- **Recovery summary** — the API returns one block of text; it is split on its six section headings, falling back to a single block if the headings differ. The "Based on" panel is built from the vitals analytics endpoint for the same range.

---

## Tests

```bash
npm test
```

96 tests mount the real app (real routes and providers) against a mocked backend and cover sign-in and token refresh, the dashboard and patient list, every field and save path of the daily log (including validation, skipping and retries), trends, the recovery summary, and the records pages — plus unit tests for the utilities and charts.

---

## Team

- **Kush Mistry**
- **Rishi Datt Gupta**

Backend: [CuraFlow-Backend](https://github.com/shauryapastor2005-cyber/CuraFlow-Backend)
