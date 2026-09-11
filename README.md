# Thermora

**AI-Powered Heatwave Early Warning & Human Thermal Stress Intelligence Platform**

A full-stack climate intelligence platform: predicts heatwave risk, computes human thermal stress (HTSI), forecasts hospital surge, detects urban heat islands, and drives multi-channel alerting — built around a dynamic State → District → Ward geography hierarchy (India-scale, not hardcoded to one location).

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, TypeScript, TailwindCSS, React Query, Recharts, Leaflet |
| Backend | FastAPI, Python 3.11 |
| Database | PostgreSQL + PostGIS |
| Cache | Redis (with automatic in-process fallback if unavailable) |
| ML | XGBoost, Random Forest, LSTM (PyTorch, CPU) — ensembled |
| Auth | JWT (python-jose) + bcrypt (passlib) |
| Infra | Docker, Docker Compose |

See **`UI_README.md`** for the frontend page-by-page breakdown.

---

## Quick Start

```bash
docker compose up --build
```

First boot: waits for Postgres → seeds multi-state demo data → trains ML models (~2–5 min) → starts the API.

| Service | URL |
|---|---|
| Dashboard | http://localhost:3000 |
| API | http://localhost:8000 |
| Swagger docs | http://localhost:8000/docs |
| Health check | http://localhost:8000/health |
| Postgres | `localhost:5432` (db/user/pass: `thermora`) |
| Redis | `localhost:6379` |

**If you change the DB schema (models) after the first run**, `create_all()` will *not* migrate an existing database — wipe the volume:
```bash
docker compose down -v
docker compose build --no-cache backend
docker compose up
```
> There's no Alembic migration tooling yet — worth adding if the schema keeps evolving.

---

## Geography Model (no hardcoded locations)

```
State (e.g. Uttar Pradesh, Delhi, Maharashtra)
  └─ District (e.g. Ghaziabad, New Delhi, Mumbai)
       └─ Ward (e.g. Sanjay Nagar, Rohini, Andheri)
```

Every dashboard panel is scoped by `ward_id` (and district/state where relevant) end-to-end — KPIs, alerts, forecasts, hospital surge, and cooling centers all refetch when the location selector changes, with no page reload.

Demo seed data spans 3 states, 5 districts, ~20 wards, each with hospitals, cooling centers, and 45 days of bootstrapped weather/thermal-stress history.

---

## Core Features

### 1. Human Thermal Stress Index (HTSI)
`app/services/thermal_stress.py` — computes:
- **Heat Index** (NOAA/NWS Rothfusz regression)
- **WBGT** (outdoor approximation)
- **UTCI** (reduced polynomial approximation)
- Composite **0–100 HTSI score** blending all three, adjusted by a personal-vulnerability multiplier (age, chronic conditions, occupation, gender, daily outdoor exposure hours)
- Category: Safe / Caution / Danger / Extreme Danger
- Auto-generated plain-language recommendations

### 2. Citizen Heat Risk Engine
`POST /api/citizen/risk-assessment` — personalized score + recommended actions + emergency guidance from age, gender, occupation, medical conditions, and daily outdoor exposure hours.

### 3. Heatwave Prediction Ensemble
`app/services/ml/` — XGBoost + Random Forest + LSTM, blended with weighted averaging. Trained on NASA POWER history (falls back to a physically-plausible synthetic generator when insufficient real history exists). Outputs probability, severity score/level, and estimated duration.

### 4. Explainable AI
`GET /api/explainability/ward/{id}/heatwave` — signed contributor breakdown (e.g. Temperature +40%, Humidity +20%, Wind −8%, Health Vulnerability +20%) derived from blended XGBoost/RF feature importances × each feature's deviation from a baseline.

### 5. Weather Ingestion
- **NASA POWER** (`app/services/weather_ingestion.py`) — historical daily data, no API key required
- **OpenWeather** (`app/services/weather_openweather.py`) — forecast leg, requires `OPENWEATHER_API_KEY`; merged with NASA history before hitting the ensemble

### 6. GIS
- PostGIS geometry columns on District/Ward
- Ward heatmap as GeoJSON, colored by live HTSI (green/yellow/orange/red)
- Real boundary support: upload GeoJSON directly, or fetch from OpenStreetMap's Overpass API (`app/gis/osm_boundary.py`) — falls back to a synthetic square around the centroid when no real boundary is set

### 7. Urban Heat Island Detection
`app/services/satellite/uhi_pipeline.py` — NDVI, LST, and UHI-index computation with separate Sentinel-2 (NDVI-proxy) and Landsat-8 (thermal-band) code paths. Ships with a synthetic-band generator so the full pipeline runs end-to-end without a satellite data subscription; `load_raster_bands()` is the real GeoTIFF entry point for production.

### 8. Hospital Surge Prediction
`app/services/hospital_surge.py` — expected heat-stroke cases, admissions, ICU requirement, OPD demand, projected bed occupancy, and a composite emergency-resource-strain score.

### 9. Cooling Center Intelligence
`GET /api/cooling-centers/recommend?lat=&lon=` — automatic best-center recommendation balancing distance/ETA against live capacity and amenities (not just nearest-door).

### 10. Smart Alerts
`app/alerts/` — SMS, email, push, and WhatsApp (via Twilio), triggered automatically when HTSI crosses the configured threshold. Dry-run logging when provider credentials aren't configured.

### 11. Government Officer Dashboard
`GET /api/government/district/{id}/overview`, `/api/government/state/{id}/overview` — role-gated (District/State Officer, Super Admin) aggregation: heatwave severity, high-risk wards, vulnerable population estimate, hospital/cooling capacity, emergency recommendations.

### 12. Role-Based Access Control
JWT auth (`app/core/security.py`, `app/routers/auth.py`). Roles: `citizen`, `hospital_admin`, `district_officer`, `state_officer`, `super_admin`.

### 13. Scalability
- Redis caching (`app/core/cache.py`) on hot endpoints (KPIs, ward heatmap, geography lists), with automatic in-process fallback if Redis is unreachable
- DB indexes on `ward_id`/`district_id`/`state_id` foreign keys
- APScheduler background job refreshing HTSI for all wards every 30 minutes

### 14. PWA
`frontend/public/manifest.json` + `sw.js` — installable, offline app-shell caching, push notification handling.

---

## Database Schema

`users, states, districts, wards, uhi_hotspots, weather_observations, thermal_stress_records, heatwave_predictions, hospitals, hospital_predictions, cooling_centers, alerts, alert_deliveries`

---

## API Surface (prefix `/api`)

| Router | Key endpoints |
|---|---|
| `/geo` | `states`, `districts`, `wards` (all filterable by parent) |
| `/dashboard` | `kpis?ward_id=`, `active-alert?ward_id=`, `top-risk-wards` |
| `/thermal` | `compute`, `ward/{id}/latest`, `ward/{id}/refresh`, `ward/{id}/breakdown` |
| `/forecast` | `ward/{id}/5-day`, `ward/{id}/latest-ensemble` |
| `/explainability` | `ward/{id}/heatwave`, `ward/{id}/htsi` |
| `/citizen` | `risk-assessment` |
| `/health-guidance` | `general-tips`, `personalized` |
| `/hospitals` | list, `surge-predictions` |
| `/cooling-centers` | list, `recommend` |
| `/gis` | `wards/heatmap`, `hotspots`, boundary upload/OSM-fetch |
| `/uhi` | `ward/{id}/analyze`, `ward/{id}/history` |
| `/alerts` | list, `{id}/dismiss` |
| `/weather` | `ward/{id}`, `ward/{id}/ingest` |
| `/government` | `district/{id}/overview`, `state/{id}/overview` (role-gated) |
| `/auth` | `register`, `login`, `me` |
| `/settings` | `thresholds`, `system-info` |

Full interactive reference at `/docs` once running.

---

## Environment Variables

See `backend/.env.example`. Notable ones:
- `OPENWEATHER_API_KEY` — enables the forecast leg of the weather pipeline (works without it, falls back to history-only)
- `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_FROM_NUMBER` / `TWILIO_WHATSAPP_FROM` — enables real SMS/WhatsApp (dry-run logged otherwise)
- `SMTP_*` — enables real email (dry-run logged otherwise)
- `SECRET_KEY` — **change this before any real deployment**

---

## Known Gaps / Honest Limitations

- **No Alembic migrations** — schema changes require wiping the dev database (`docker compose down -v`). Worth adding if you keep iterating on models.
- **OpenWeather / OSM Overpass** calls require real network access and, for OpenWeather, an API key — untested against live services in the environment this was built in.
- **UHI satellite pipeline** defaults to synthetic bands; real Sentinel-2/Landsat-8 ingestion needs `rasterio` + actual scene files via `load_raster_bands()`.
- **Frontend was never `npm run build`'d** in the environment this was built in (no network access there) — verified by manual review, not a compiler. Run it yourself before deploying to catch anything missed.
- **Government dashboard login** is a minimal email/password form on the page itself — fine for a demo, but a real deployment would want a proper auth flow (refresh tokens, session handling, etc.) rather than a token in `localStorage`.
