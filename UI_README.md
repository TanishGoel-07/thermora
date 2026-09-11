# Thermora — UI README

This document describes the **current, approved UI** exactly as implemented. This layout, styling, and navigation structure is considered final — any future functional changes should slot into these existing components rather than restructuring them.

---

## Design System

**Theme:** Dark, professional "instrument panel" aesthetic — not a generic SaaS template.

| Token | Value | Used for |
|---|---|---|
| `base-950` | `#080B10` | Page background |
| `base-900` | `#0D1218` | Panel background |
| `base-800` | `#121924` | Input/card fill |
| `base-700` | `#1A2330` | Borders, dividers |
| `ember-400/500/600` | `#FFB454 / #F59B3C / #E4572E` | Primary accent (buttons, active nav, highlights) — used instead of a generic purple/blue SaaS accent |
| `risk-safe` | `#3ADB8A` | Green — Safe severity |
| `risk-caution` | `#F2C94C` | Yellow — Caution severity |
| `risk-danger` | `#F2994A` | Orange — Danger severity |
| `risk-extreme` | `#EB5757` | Red — Extreme Danger severity |
| `cyan-glow` | `#5EEAD4` | Secondary accent (cooling-center capacity bars) |

**Typography:**
- **Inter** — all UI text
- **Space Grotesk** — headings/branding (`font-display`)
- **IBM Plex Mono** — all numeric data (`data-num` class) for a technical, tabular-figures feel

**Component primitives** (`src/components/ui/`):
- `Panel` — the base card container used everywhere (header + title + subtitle + optional action slot)
- `Button` — primary (ember gradient), ghost, outline variants
- `SeverityBadge` — pill badge auto-colored from a severity/category string (Safe/Caution/Danger/Extreme)

---

## Layout Shell

```
┌─────────────┬──────────────────────────────────────────────┐
│             │  Topbar (title, date/time, location selector)│
│  Sidebar    ├──────────────────────────────────────────────┤
│  (fixed,    │                                                │
│   240px)    │  Page content (scrollable)                    │
│             │                                                │
└─────────────┴──────────────────────────────────────────────┘
```

### Sidebar (`components/layout/Sidebar.tsx`)
Fixed 240px left rail, dark background, ember-highlighted active state. Nav items, in order:

1. **Dashboard** → `/`
2. **Heat Map** → `/heat-map`
3. **Forecast** → `/forecast`
4. **Alerts** → `/alerts`
5. **Health Guidance** → `/health-guidance`
6. **Hospitals** → `/hospitals`
7. **Cooling Centers** → `/cooling-centers`
8. **Emergency Planning** → `/emergency-planning`
9. **Government** → `/government`
10. **Settings** → `/settings`

### Topbar (`components/layout/Topbar.tsx`)
Present on every page. Contains:
- Page title + one-line description (passed as props per page)
- Live date/time
- **Cascading location selector**: State → District → Ward, three `<select>` dropdowns styled identically (same classes, same look — this is the only structural addition made to the original single-ward selector, needed to support the full State→District→Ward hierarchy). Changing any level re-fetches every dependent panel on the page via React Query — no page reload.
- Selected ward's population, shown top-right

---

## Pages

### `/` — Dashboard (`pages/Dashboard.tsx`)
The main command view. Top-to-bottom:
1. **KPI row** (4 cards): Current Heat Risk, Human Thermal Stress Index, Heat Index, WBGT, UTCI
2. **Active Alert panel** (right column, spans two rows): current alert, severity, recommended action, or a "no active alerts" state
3. **Interactive District Heat Map** (Leaflet, dark CARTO basemap, ward polygons colored by risk, click-to-select ward)
4. **Top 5 High Risk Wards** (ranked list with mini progress bars)
5. **5-Day Forecast** (per-day risk % + severity badge)
6. **Thermal Stress Breakdown** (horizontal bar chart: Temperature / Humidity / Wind / Solar Radiation contributions)
7. **Risk Drivers** (plain-language explanation of the top contributing factor)
8. **Hospital Surge Prediction** + **Cooling Centers** (side by side)
9. **Key Functionalities strip** (5 feature callouts: Hyperlocal Prediction, Human Thermal Stress, AI Forecasting, Hospital Planning, Smart Alerts)

### `/heat-map` — Heat Map (`pages/HeatMapPage.tsx`)
Larger standalone map + Top Risk Wards + Thermal Stress Breakdown.

### `/forecast` — Forecast (`pages/ForecastPage.tsx`)
Line chart of 5-day risk trend + the same Forecast panel from the dashboard + an **Explainability panel** (signed contributor breakdown: e.g. Temperature +40%, Wind −8%, with a colored bar per factor).

### `/alerts` — Alerts (`pages/AlertsPage.tsx`)
Full alert history, active/dismissed state, dismiss action.

### `/health-guidance` — Health Guidance (`pages/HealthGuidancePage.tsx`)
The **Citizen Heat Risk Engine** calculator: age, gender, occupation, chronic-condition checkbox, outdoor-exposure-hours slider → personalized risk score, category, recommended actions, and emergency guidance. Paired with a static general heat-safety tips panel.

### `/hospitals` — Hospitals (`pages/HospitalsPage.tsx`)
Hospital directory (bed/ICU availability) + Hospital Surge Prediction panel (expected cases, admissions, ICU need, OPD demand, capacity utilization).

### `/cooling-centers` — Cooling Centers (`pages/CoolingCentersPage.tsx`)
Leaflet map with cooling-center markers + list panel with distance, occupancy, amenities (AC/water/24h).

### `/emergency-planning` — Emergency Planning (`pages/EmergencyPlanningPage.tsx`)
Static operational playbooks: Early Warning Protocol, Vulnerable Population Outreach, Facility Readiness, Public Communication.

### `/government` — Government Dashboard (`pages/GovernmentPage.tsx`)
Role-gated (District/State Officer/Super Admin only) with a lightweight email/password login form. Once authenticated: heatwave severity, avg HTSI, vulnerable population estimate, high-risk ward list, hospital + cooling-center capacity bars, emergency recommendations — all scoped to the selected district.

### `/settings` — Settings (`pages/SettingsPage.tsx`)
HTSI risk thresholds (Safe/Caution/Danger cutoffs, alert trigger threshold) and system info (NASA POWER params, default location).

---

## Data Flow

- **React Query** (`@tanstack/react-query`) drives every panel; queries are keyed by the selected ward/district ID, so switching location anywhere refetches only what's affected — no manual refresh, no full page reload.
- **`WardContext`** (`src/context/WardContext.tsx`) is the single source of truth for the currently selected State/District/Ward, consumed by the Topbar selector and every data-fetching component.
- **`api/client.ts`** is the single typed HTTP client — every backend call goes through it.

## Charts & Maps
- **Recharts** — bar chart (Thermal Stress Breakdown), line chart (Forecast trend)
- **Leaflet + react-leaflet** — Heat Map (ward polygons) and Cooling Centers map (point markers), dark CARTO basemap tiles

## PWA
- `public/manifest.json` + `public/sw.js` — installable app shell, offline caching of static assets, push notification handling. Registered in `main.tsx` after first paint.
