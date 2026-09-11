"""
Seeds the database with a realistic multi-state demo dataset spanning the
full State -> District -> Ward hierarchy (no hardcoded single-ward
dependency anywhere), plus hospitals, cooling centers, and a bootstrapped
weather/thermal-stress history so the dashboard has data to show
immediately after `docker compose up`.

Run inside the backend container:
    python -m app.seed.seed_data
"""
from __future__ import annotations

import random
from datetime import datetime, timedelta

from app.database import SessionLocal, init_db
from app.core.config import get_settings
from app.models.geography import State, District, Ward
from app.models.weather import WeatherObservation
from app.models.thermal import ThermalStressRecord
from app.models.hospital import Hospital
from app.models.cooling import CoolingCenter
from app.services.thermal_stress import compute_htsi
from app.services.ml.synthetic_history import generate_synthetic_history

settings = get_settings()

# State -> District -> [Ward names] hierarchy. Nothing below is treated as
# special-cased in any router or service — every location flows through the
# same generic State/District/Ward models and query parameters.
GEO_HIERARCHY = {
    "Uttar Pradesh": {
        "code": "UP",
        "centroid": (26.8467, 80.9462),
        "districts": {
            "Ghaziabad": {
                "centroid": (28.6692, 77.4538),
                "wards": ["Sanjay Nagar", "Raj Nagar", "Vasundhara", "Indirapuram", "Vaishali", "Kavi Nagar"],
            },
            "Lucknow": {
                "centroid": (26.8467, 80.9462),
                "wards": ["Gomti Nagar", "Hazratganj", "Alambagh", "Indira Nagar"],
            },
        },
    },
    "Delhi": {
        "code": "DL",
        "centroid": (28.7041, 77.1025),
        "districts": {
            "New Delhi": {
                "centroid": (28.6139, 77.2090),
                "wards": ["Rohini", "Dwarka", "Karol Bagh", "Connaught Place"],
            },
        },
    },
    "Maharashtra": {
        "code": "MH",
        "centroid": (19.7515, 75.7139),
        "districts": {
            "Mumbai": {
                "centroid": (19.0760, 72.8777),
                "wards": ["Andheri", "Bandra", "Dadar", "Colaba"],
            },
            "Pune": {
                "centroid": (18.5204, 73.8567),
                "wards": ["Kothrud", "Hinjewadi", "Viman Nagar"],
            },
        },
    },
}


def seed() -> None:
    init_db()
    db = SessionLocal()
    try:
        if db.query(State).count() > 0:
            print("Database already seeded. Skipping.")
            return

        rng = random.Random(settings.RANDOM_SEED)
        all_wards: list[Ward] = []

        for state_name, state_def in GEO_HIERARCHY.items():
            state_lat, state_lon = state_def["centroid"]
            state = State(
                name=state_name,
                code=state_def["code"],
                population=rng.randint(30_000_000, 230_000_000),
                centroid_lat=state_lat,
                centroid_lon=state_lon,
            )
            db.add(state)
            db.flush()

            for district_name, district_def in state_def["districts"].items():
                d_lat, d_lon = district_def["centroid"]
                district = District(
                    state_id=state.id,
                    name=district_name,
                    state=state_name,  # denormalized display name
                    population=rng.randint(1_500_000, 12_500_000),
                    centroid_lat=d_lat,
                    centroid_lon=d_lon,
                )
                db.add(district)
                db.flush()

                for i, ward_name in enumerate(district_def["wards"], start=1):
                    lat_offset = rng.uniform(-0.06, 0.06)
                    lon_offset = rng.uniform(-0.06, 0.06)
                    ward = Ward(
                        district_id=district.id,
                        name=ward_name,
                        ward_number=i,
                        population=rng.randint(60_000, 220_000),
                        population_density=rng.uniform(8000, 30000),
                        vegetation_index=rng.uniform(0.1, 0.5),
                        impervious_surface_pct=rng.uniform(0.4, 0.9),
                        elderly_population_pct=rng.uniform(0.05, 0.18),
                        centroid_lat=d_lat + lat_offset,
                        centroid_lon=d_lon + lon_offset,
                        boundary_source="synthetic",
                    )
                    db.add(ward)
                    all_wards.append(ward)

        db.flush()

        # Hospitals (1-2 per ward)
        for ward in all_wards:
            for h in range(rng.randint(1, 2)):
                total_beds = rng.randint(80, 400)
                icu_beds = int(total_beds * rng.uniform(0.05, 0.12))
                hospital = Hospital(
                    ward_id=ward.id,
                    name=f"{ward.name} {'General Hospital' if h == 0 else 'Community Health Center'}",
                    type="govt" if h == 0 else "private",
                    total_beds=total_beds,
                    icu_beds=icu_beds,
                    available_beds=int(total_beds * rng.uniform(0.3, 0.8)),
                    available_icu_beds=int(icu_beds * rng.uniform(0.3, 0.8)),
                    latitude=ward.centroid_lat + rng.uniform(-0.01, 0.01),
                    longitude=ward.centroid_lon + rng.uniform(-0.01, 0.01),
                    contact_number=f"+91-11-{rng.randint(20000000, 29999999)}",
                )
                db.add(hospital)

        # Cooling centers (1-3 per ward)
        for ward in all_wards:
            for c in range(rng.randint(1, 3)):
                capacity = rng.randint(50, 300)
                center = CoolingCenter(
                    ward_id=ward.id,
                    name=f"{ward.name} Cooling Center {c + 1}",
                    type=rng.choice(["community_center", "school", "library", "govt_building"]),
                    capacity=capacity,
                    current_occupancy=rng.randint(0, capacity),
                    has_ac=rng.random() > 0.15,
                    has_water=True,
                    is_open_24h=rng.random() > 0.7,
                    latitude=ward.centroid_lat + rng.uniform(-0.015, 0.015),
                    longitude=ward.centroid_lon + rng.uniform(-0.015, 0.015),
                    address=f"Sector {rng.randint(1, 30)}, {ward.name}",
                )
                db.add(center)

        db.commit()

        # Bootstrap ~45 days of synthetic-but-plausible weather + thermal
        # stress history per ward so every location has charts immediately,
        # not just one hardcoded ward.
        history = generate_synthetic_history(
            start_date=(datetime.utcnow() - timedelta(days=45)).strftime("%Y-%m-%d"),
            end_date=datetime.utcnow().strftime("%Y-%m-%d"),
            seed=settings.RANDOM_SEED,
        )

        for ward in all_wards:
            ward_variation = rng.uniform(-1.5, 2.5)  # per-ward UHI effect
            for _, row in history.iterrows():
                temp = row["temperature_c"] + ward_variation
                obs = WeatherObservation(
                    ward_id=ward.id,
                    district_id=ward.district_id,
                    source="SYNTHETIC_BOOTSTRAP",
                    latitude=ward.centroid_lat,
                    longitude=ward.centroid_lon,
                    observed_date=row["observed_date"],
                    temperature_c=temp,
                    temperature_max_c=row["temperature_max_c"] + ward_variation,
                    temperature_min_c=row["temperature_min_c"] + ward_variation,
                    humidity_pct=row["humidity_pct"],
                    wind_speed_ms=row["wind_speed_ms"],
                    solar_radiation_wm2=row["solar_radiation_wm2"],
                    pressure_kpa=row["pressure_kpa"],
                    rainfall_mm=row["rainfall_mm"],
                )
                db.add(obs)

                result = compute_htsi(
                    temperature_c=temp,
                    humidity_pct=row["humidity_pct"],
                    wind_speed_ms=row["wind_speed_ms"],
                    solar_radiation_wm2=row["solar_radiation_wm2"],
                )
                record = ThermalStressRecord(
                    ward_id=ward.id,
                    recorded_at=row["observed_date"],
                    heat_index_c=result.heat_index_c,
                    wbgt_c=result.wbgt_c,
                    utci_c=result.utci_c,
                    htsi_score=result.htsi_score,
                    htsi_category=result.htsi_category,
                    contrib_temperature=result.contrib_temperature,
                    contrib_humidity=result.contrib_humidity,
                    contrib_wind=result.contrib_wind,
                    contrib_solar_radiation=result.contrib_solar_radiation,
                    contrib_personal_vulnerability=result.contrib_personal_vulnerability,
                    recommendation=result.recommendation,
                )
                db.add(record)

            db.commit()

        n_states = len(GEO_HIERARCHY)
        n_districts = sum(len(s["districts"]) for s in GEO_HIERARCHY.values())
        print(
            f"Seeded {n_states} states, {n_districts} districts, {len(all_wards)} wards "
            f"with hospitals, cooling centers, and 45 days of history."
        )
    finally:
        db.close()


if __name__ == "__main__":
    seed()
