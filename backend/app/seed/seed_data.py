"""
Seeds the database with a realistic demo dataset: one district, a set of
wards with varying vulnerability profiles, hospitals, cooling centers, and a
bootstrapped weather/thermal-stress history so the dashboard has data to show
immediately after `docker compose up`.

Run inside the backend container:
    python -m app.seed.seed_data
"""
from __future__ import annotations

import random
from datetime import datetime, timedelta

from app.database import SessionLocal, init_db
from app.core.config import get_settings
from app.models.geography import District, Ward
from app.models.weather import WeatherObservation
from app.models.thermal import ThermalStressRecord
from app.models.hospital import Hospital
from app.models.cooling import CoolingCenter
from app.services.thermal_stress import compute_htsi
from app.services.ml.synthetic_history import generate_synthetic_history

settings = get_settings()

WARD_NAMES = [
    "Vasundhara", "Indirapuram", "Vaishali", "Kavi Nagar", "Raj Nagar",
    "Sanjay Nagar", "Nandgram", "Loni", "Mohan Nagar", "Crossings Republik",
]


def seed() -> None:
    init_db()
    db = SessionLocal()
    try:
        if db.query(District).count() > 0:
            print("Database already seeded. Skipping.")
            return

        district = District(
            name="Ghaziabad",
            state="Uttar Pradesh",
            population=2_358_000,
            centroid_lat=settings.DEFAULT_LAT,
            centroid_lon=settings.DEFAULT_LON,
        )
        db.add(district)
        db.flush()

        rng = random.Random(settings.RANDOM_SEED)
        wards = []
        for i, name in enumerate(WARD_NAMES, start=1):
            lat_offset = rng.uniform(-0.08, 0.08)
            lon_offset = rng.uniform(-0.08, 0.08)
            ward = Ward(
                district_id=district.id,
                name=name,
                ward_number=i,
                population=rng.randint(60_000, 220_000),
                population_density=rng.uniform(8000, 30000),
                vegetation_index=rng.uniform(0.1, 0.5),
                impervious_surface_pct=rng.uniform(0.4, 0.9),
                elderly_population_pct=rng.uniform(0.05, 0.18),
                centroid_lat=district.centroid_lat + lat_offset,
                centroid_lon=district.centroid_lon + lon_offset,
            )
            db.add(ward)
            wards.append(ward)
        db.flush()

        # Hospitals (1-2 per ward)
        for ward in wards:
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
                    contact_number=f"+91-120-{rng.randint(2000000, 2999999)}",
                )
                db.add(hospital)

        # Cooling centers (1-3 per ward)
        for ward in wards:
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
                    address=f"Sector {rng.randint(1, 30)}, {ward.name}, Ghaziabad",
                )
                db.add(center)

        db.commit()

        # Bootstrap 30 days of synthetic-but-plausible weather + thermal stress
        # history per ward so charts render immediately.
        history = generate_synthetic_history(
            start_date=(datetime.utcnow() - timedelta(days=45)).strftime("%Y-%m-%d"),
            end_date=datetime.utcnow().strftime("%Y-%m-%d"),
            seed=settings.RANDOM_SEED,
        )

        for ward in wards:
            ward_variation = rng.uniform(-1.5, 2.5)  # UHI effect per ward
            for _, row in history.iterrows():
                temp = row["temperature_c"] + ward_variation
                obs = WeatherObservation(
                    ward_id=ward.id,
                    district_id=district.id,
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

        print(f"Seeded {len(wards)} wards with hospitals, cooling centers, and 45 days of history.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
