# 🌡️ Thermora

**AI-Powered Heatwave Early Warning & Human Thermal Stress Intelligence Platform**

Thermora is a full-stack situational-awareness platform built for a Smart India Hackathon (SIH) problem statement on urban heatwave risk management. It ingests real-world weather data, computes scientifically grounded human thermal-stress indices, forecasts heatwaves with a machine-learning ensemble, predicts hospital surge load, and alerts citizens/authorities — all visualized through a live command-center dashboard.

---

## 🚀 What It Does

Thermora turns raw meteorological data into **actionable, ward-level heat-risk intelligence** for a city (seeded by default with Ghaziabad, Uttar Pradesh, India). It answers four core questions for disaster-management authorities and citizens:

1. **How dangerous is the heat right now, and for whom?**
   Computes a composite **Human Thermal Stress Index (HTSI, 0–100)** per ward from live weather (temperature, humidity, wind, solar radiation) blended with personal vulnerability factors (age, chronic illness, outdoor occupation).

2. **What's coming in the next 5 days?**
   An **ensemble ML model (XGBoost + Random Forest + LSTM)** forecasts heatwave probability, severity, and expected duration per ward.

3. **Will hospitals be overwhelmed?**
   Predicts expected heat-stroke cases, admissions, ICU demand, and bed-capacity utilization per hospital using an epidemiologically-inspired incidence model.

4. **What should people do about it?**
   Generates personalized health guidance/recommendations and triggers multi-channel alerts (SMS, email, push) automatically whenever a ward crosses a configurable risk threshold, plus surfaces nearby cooling centers on a map.

### Key Features

| Capability | Description |
|---|---|
| 🌍 **Ward-level Heat Map (GIS)** | Interactive Leaflet map colored by live HTSI risk per ward, plus Urban Heat Island (UHI) hotspot overlay |
| 🔥 **Thermal Stress Engine** | Computes Heat Index (NOAA Rothfusz), WBGT, and UTCI, then blends them into the composite HTSI score with a full contribution/driver breakdown |
| 🤖 **Heatwave Forecast Ensemble** | XGBoost + Random Forest + LSTM models (weighted ensemble) predict 5-day heatwave probability/severity, with a physics-based heuristic fallback before models are trained |
| 🚨 **Automated Alerting** | Background scheduler recomputes HTSI every 30 minutes and auto-dispatches SMS (Twilio), Email (SMTP), and Push (FCM) alerts to registered users when risk crosses threshold |
| 🏥 **Hospital Surge Prediction** | Forecasts expected heat-stroke admissions/ICU load and capacity utilization per hospital |
| ❄️ **Cooling Centers Finder** | Lists nearby cooling centers (with AC/water/24h availability) sorted by distance (Haversine) |
| 💡 **Personalized Health Guidance** | General heat-safety tips + individualized recommendations based on age/health/occupation |
| ⚙️ **Configurable Thresholds** | HTSI safe/caution/danger bands and alert thresholds tunable via environment variables |
| 🛰️ **Real Weather Ingestion** | Pulls live daily meteorological data from NASA's free POWER API (no key required) |

---

## 🏗️ Architecture

```
thermora/
├── backend/                     # FastAPI (Python) backend
│   ├── app/
│   │   ├── main.py               # App entrypoint, routers, background scheduler
│   │   ├── core/config.py        # Centralized settings (env-driven)
│   │   ├── database.py           # SQLAlchemy engine/session + PostGIS init
│   │   ├── models/               # SQLAlchemy ORM models (Ward, Weather, Alert, etc.)
│   │   ├── schemas/               # Pydantic request/response schemas
│   │   ├── routers/              # API route modules (dashboard, thermal, forecast, ...)
│   │   ├── services/
│   │   │   ├── thermal_stress.py  # HTSI / Heat Index / WBGT / UTCI engine
│   │   │   ├── hospital_surge.py  # Surge / admissions / ICU prediction model
│   │   │   ├── weather_ingestion.py # NASA POWER API client + ingestion
│   │   │   └── ml/                # Ensemble ML: features, training, inference
│   │   ├── alerts/                # Alert engine + SMS/Email/Push notifiers
│   │   ├── gis/                   # GeoJSON utilities, haversine distance, risk colors
│   │   └── seed/                  # Demo data seeder (wards, hospitals, weather history)
│   ├── requirements.txt
│   ├── Dockerfile / entrypoint.sh
│
├── frontend/                    # React + TypeScript + Vite SPA
│   ├── src/
│   │   ├── pages/                # Dashboard, HeatMap, Forecast, Alerts, Hospitals, ...
│   │   ├── components/dashboard/ # KPI cards, HeatMap, Forecast/Risk panels, etc.
│   │   ├── components/layout/    # Sidebar, Topbar
│   │   ├── components/ui/        # Reusable UI primitives (button, badge, panel)
│   │   ├── api/client.ts         # Typed REST client for the backend API
│   │   ├── context/WardContext.tsx
│   │   └── hooks/useThermoraData.ts
│   ├── package.json / vite.config.ts / tailwind.config.js
│
└── docker-compose.yml            # Orchestrates postgres (PostGIS) + backend + frontend
```

### Tech Stack

**Backend**
- FastAPI, Uvicorn, Pydantic v2 / pydantic-settings
- SQLAlchemy 2.0 + GeoAlchemy2 on PostgreSQL/PostGIS
- APScheduler for periodic HTSI refresh jobs
- ML: scikit-learn (Random Forest), XGBoost, PyTorch (LSTM), pandas/numpy
- httpx for async NASA POWER API ingestion
- python-jose / passlib for auth primitives
- Twilio / SMTP / FCM adapters for alert delivery (safely no-op in dev if unconfigured)

**Frontend**
- React 18 + TypeScript + Vite
- React Router, TanStack Query (data fetching/caching)
- Tailwind CSS + Radix UI + class-variance-authority
- Leaflet / React-Leaflet for the interactive heat map
- Recharts for forecast/trend charts, lucide-react for icons

**Infrastructure**
- Docker Compose: PostGIS database, FastAPI backend, Nginx-served frontend build
- NASA POWER API — free, public, no-API-key weather data source

---

## 🧠 How the Core Science Works

### Human Thermal Stress Index (HTSI)
`app/services/thermal_stress.py` combines three biometeorological indices:
- **Heat Index** — NOAA/NWS Rothfusz regression
- **WBGT (Wet Bulb Globe Temperature)** — simplified outdoor approximation incorporating solar load and wind cooling
- **UTCI (Universal Thermal Climate Index)** — reduced polynomial approximation

These are scaled and weighted (40% Heat Index / 35% WBGT / 25% UTCI) into a base score, then multiplied by a **personal vulnerability factor** (age, chronic conditions, outdoor occupation) to produce the final 0–100 HTSI score, categorized as **Safe → Caution → Danger → Extreme Danger**. A driver-breakdown explains exactly which factor (temperature, humidity, wind, solar radiation, vulnerability) contributes most to the current score.

### Heatwave Forecast Ensemble
`app/services/ml/` engineers rolling temperature/humidity features (3/7-day means, anomalies, day-of-year cyclic encoding) and:
- Trains a **Random Forest** and **XGBoost** classifier on tabular features
- Trains an **LSTM** on 7-day weather sequences
- Blends predictions with weights `XGBoost 45% / RF 30% / LSTM 25%`, with a horizon-based confidence decay for the 5-day forecast
- Falls back to a transparent logistic heuristic on temperature anomalies if models haven't been trained yet, so the API never breaks on a fresh install

### Hospital Surge Model
`app/services/hospital_surge.py` scales a baseline heat-stroke incidence rate (per 100k population) convexly with HTSI severity and ward vulnerability (elderly population %, impervious surface %) to estimate expected cases, admissions, ICU demand, and resulting capacity utilization/surge level.

---

## 🔌 API Overview

All endpoints are served under the `/api` prefix (configurable via `API_PREFIX`).

| Router | Prefix | Purpose |
|---|---|---|
| `dashboard` | `/api/dashboard` | KPIs, active alert, top-risk wards |
| `thermal` | `/api/thermal` | Ad-hoc HTSI compute, per-ward latest/refresh/breakdown |
| `forecast` | `/api/forecast` | 5-day heatwave forecast, latest ensemble prediction |
| `alerts` | `/api/alerts` | List/get/dismiss alerts |
| `gis` | `/api/gis` | Ward heatmap GeoJSON, UHI hotspots GeoJSON |
| `hospitals` | `/api/hospitals` | Hospital list, surge predictions |
| `cooling-centers` | `/api/cooling-centers` | Nearby cooling centers with distance sorting |
| `weather` | `/api/weather` | Ward weather history, NASA POWER ingestion trigger |
| `geo` | `/api/geo` | Districts / wards |
| `health-guidance` | `/api/health-guidance` | General tips, personalized guidance |
| `settings` | `/api/settings` | Risk thresholds, system info |

Interactive API docs are available at `http://localhost:8000/docs` (Swagger UI) once the backend is running.

---

## 🖥️ Frontend Pages

- **Dashboard** — command-center view: KPIs, active alert, heat map, top-risk wards, forecast panel, thermal-stress breakdown, risk drivers, hospital surge, cooling centers
- **Heat Map** — full-screen ward-level risk map
- **Forecast** — 5-day heatwave probability/severity trends
- **Alerts** — alert history and management
- **Health Guidance** — general + personalized heat-safety advice
- **Hospitals** — hospital list and surge predictions
- **Cooling Centers** — nearest cooling centers finder
- **Emergency Planning** — response planning view
- **Settings** — risk threshold configuration / system info

---

## ⚙️ Getting Started

### Prerequisites
- Docker & Docker Compose (recommended, easiest path), **or**
- Python 3.11+ and Node.js 20+ for running services natively
- PostgreSQL with the PostGIS extension if running the database yourself

### Option A — Docker Compose (recommended)

```bash
docker compose up --build
```

This will:
1. Start a PostGIS-enabled PostgreSQL instance
2. Build and start the FastAPI backend (auto-seeds demo data, trains ML models, then starts Uvicorn)
3. Build and serve the React frontend via Nginx

Once healthy:
- Frontend: **http://localhost:3000**
- Backend API: **http://localhost:8000/api**
- Swagger docs: **http://localhost:8000/docs**

### Option B — Run Locally (without Docker)

**Backend**
```bash
cd backend
python -m venv venv
venv\Scripts\activate            # Windows
pip install -r requirements.txt
copy .env.example .env           # adjust DATABASE_URL etc.
python -m app.seed.seed_data     # seed demo data
python -m app.services.ml.train  # train ML ensemble models
uvicorn app.main:app --reload --port 8000
```

**Frontend**
```bash
cd frontend
npm install
npm run dev
```

The frontend defaults to `VITE_API_URL=http://localhost:8000/api` (see `frontend/vite.config.ts` / `.env`).

### Configuration

Backend configuration is environment-driven (`backend/.env.example` → `backend/app/core/config.py`), including:
- `DATABASE_URL` — PostgreSQL/PostGIS connection string
- `NASA_POWER_BASE_URL` / `NASA_POWER_PARAMETERS` — weather data source
- `DEFAULT_LAT` / `DEFAULT_LON` — default AOI used to seed the demo district (Ghaziabad by default)
- `HTSI_SAFE_MAX` / `HTSI_CAUTION_MAX` / `HTSI_DANGER_MAX` / `ALERT_RISK_THRESHOLD` — risk thresholds
- `SMTP_*`, `TWILIO_*`, `FCM_SERVER_KEY` — alert delivery credentials (optional; notifiers safely no-op/log in dev if unset)
- `SECRET_KEY`, `ACCESS_TOKEN_EXPIRE_MINUTES` — auth settings

---

## 🗂️ Data Model Highlights

`backend/app/models/` defines: `District`, `Ward`, `UHIHotspot`, `WeatherObservation`, `ThermalStressRecord`, `HeatwavePrediction`, `Hospital`, `HospitalPrediction`, `CoolingCenter`, `User`, `Alert`, `AlertDelivery` — capturing the full pipeline from raw weather through computed risk, forecasts, hospital impact, and alert delivery/audit trail.

---

## 📌 Notes / Limitations

- The demo dataset (seeded via `app/seed/seed_data.py`) is centered on **Ghaziabad, India** with synthetic-but-plausible 45-day weather history bootstrapped per ward; live data can be pulled per-ward via the `/api/weather/ward/{id}/ingest` endpoint (NASA POWER).
- Ward boundaries are approximated as simple squares around each ward's centroid (`gis/geojson_utils.py`) since no authoritative shapefile is bundled — swap in real GeoJSON boundaries for production use.
- The hospital surge model is an explainable, epidemiologically-inspired heuristic rather than a model calibrated on real admissions data — treat outputs as directional estimates.
- SMS/Email/Push notifiers no-op with a log line when their provider credentials aren't configured, so the system runs fully offline/demo-friendly out of the box.

---

## 📄 License

This project was built for the Smart India Hackathon (SIH). Add your license of choice here.
