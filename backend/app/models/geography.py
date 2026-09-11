from datetime import datetime

from geoalchemy2 import Geometry
from sqlalchemy import String, Integer, Float, DateTime, ForeignKey, JSON, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class State(Base):
    __tablename__ = "states"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False, unique=True)
    code: Mapped[str] = mapped_column(String(10), nullable=False, unique=True)  # e.g. "UP", "DL", "MH"
    population: Mapped[int] = mapped_column(Integer, default=0)
    centroid_lat: Mapped[float] = mapped_column(Float, nullable=False)
    centroid_lon: Mapped[float] = mapped_column(Float, nullable=False)
    boundary_geojson = mapped_column(JSON, nullable=True)  # real admin boundary, OSM/GADM sourced

    districts: Mapped[list["District"]] = relationship(back_populates="state_rel", cascade="all, delete-orphan")


class District(Base):
    __tablename__ = "districts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    state_id: Mapped[int] = mapped_column(ForeignKey("states.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    state: Mapped[str] = mapped_column(String(120), nullable=False)  # denormalized display name, kept for compatibility
    population: Mapped[int] = mapped_column(Integer, default=0)
    centroid_lat: Mapped[float] = mapped_column(Float, nullable=False)
    centroid_lon: Mapped[float] = mapped_column(Float, nullable=False)
    boundary = mapped_column(Geometry(geometry_type="MULTIPOLYGON", srid=4326), nullable=True)
    boundary_geojson = mapped_column(JSON, nullable=True)  # real admin boundary, OSM/GADM sourced

    state_rel: Mapped["State"] = relationship(back_populates="districts")
    wards: Mapped[list["Ward"]] = relationship(back_populates="district", cascade="all, delete-orphan")

    __table_args__ = (Index("ix_districts_state_id", "state_id"),)


class Ward(Base):
    __tablename__ = "wards"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    district_id: Mapped[int] = mapped_column(ForeignKey("districts.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    ward_number: Mapped[int] = mapped_column(Integer, nullable=False)
    population: Mapped[int] = mapped_column(Integer, default=0)
    population_density: Mapped[float] = mapped_column(Float, default=0.0)  # people / km2
    vegetation_index: Mapped[float] = mapped_column(Float, default=0.3)  # NDVI proxy 0-1
    impervious_surface_pct: Mapped[float] = mapped_column(Float, default=0.5)  # 0-1
    elderly_population_pct: Mapped[float] = mapped_column(Float, default=0.1)
    centroid_lat: Mapped[float] = mapped_column(Float, nullable=False)
    centroid_lon: Mapped[float] = mapped_column(Float, nullable=False)
    boundary = mapped_column(Geometry(geometry_type="POLYGON", srid=4326), nullable=True)
    # Real administrative boundary (OSM/Overpass or GADM sourced GeoJSON geometry).
    # Falls back to a generated square around the centroid when absent — see
    # app/gis/geojson_utils.wards_to_feature_collection.
    boundary_geojson = mapped_column(JSON, nullable=True)
    boundary_source: Mapped[str] = mapped_column(String(40), default="synthetic")  # synthetic | osm | gadm | upload

    district: Mapped["District"] = relationship(back_populates="wards")

    __table_args__ = (Index("ix_wards_district_id", "district_id"),)


class UHIHotspot(Base):
    """Urban Heat Island hotspot detected from satellite / interpolated LST data."""

    __tablename__ = "uhi_hotspots"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    ward_id: Mapped[int] = mapped_column(ForeignKey("wards.id"), nullable=False)
    surface_temp_c: Mapped[float] = mapped_column(Float, nullable=False)
    intensity: Mapped[float] = mapped_column(Float, nullable=False)  # deg C above district mean
    ndvi: Mapped[float | None] = mapped_column(Float, nullable=True)
    uhi_index: Mapped[float | None] = mapped_column(Float, nullable=True)
    satellite_source: Mapped[str] = mapped_column(String(30), default="synthetic")  # sentinel2 | landsat8 | synthetic
    detected_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    location = mapped_column(Geometry(geometry_type="POINT", srid=4326), nullable=True)

    __table_args__ = (Index("ix_uhi_ward_id", "ward_id"),)
