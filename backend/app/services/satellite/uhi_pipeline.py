"""
Feature 10: Urban Heat Island (UHI) Detection.

Computes NDVI, Land Surface Temperature (LST), and a normalized UHI index
from optical + thermal satellite bands, then persists the results as
UHIHotspot rows in PostGIS.

Supported sources:
  - Sentinel-2 (10m optical: red/NIR bands B04/B08 for NDVI; no native
    thermal band, so LST is approximated via an NDVI-based emissivity
    correction over a proxy air-temperature raster).
  - Landsat-8 (30m optical + native 100m thermal band B10, which gives a
    proper single-channel LST retrieval).

This module operates on in-memory numpy arrays so it works whether the
caller loaded them from a real GeoTIFF (via `rasterio`, wired in
`load_raster_bands`) or generated them synthetically for demo/testing —
`generate_synthetic_bands` produces physically-plausible stand-ins so the
full pipeline (NDVI -> LST -> UHI -> PostGIS) can be exercised end-to-end
without a satellite data subscription.
"""
from __future__ import annotations

from dataclasses import dataclass

import numpy as np


@dataclass
class UHIResult:
    mean_ndvi: float
    mean_surface_temp_c: float
    uhi_index: float  # standardized deviation from district-mean LST
    intensity_c: float  # degrees above district mean
    satellite_source: str = "synthetic"


def compute_ndvi(red_band: np.ndarray, nir_band: np.ndarray) -> np.ndarray:
    red = red_band.astype("float32")
    nir = nir_band.astype("float32")
    denom = nir + red
    denom[denom == 0] = 1e-6
    return (nir - red) / denom


def compute_lst_from_thermal(
    thermal_band_kelvin: np.ndarray, ndvi: np.ndarray, emissivity_base: float = 0.95
) -> np.ndarray:
    """
    Simplified mono-window LST retrieval (Landsat-8 style): adjusts brightness
    temperature by an NDVI-derived emissivity correction, following the
    standard vegetation-fraction emissivity approach used in UHI literature.
    """
    veg_fraction = np.clip((ndvi - ndvi.min()) / (ndvi.ptp() + 1e-6), 0, 1) ** 2
    emissivity = emissivity_base + 0.05 * veg_fraction
    lst_kelvin = thermal_band_kelvin / (1 + (thermal_band_kelvin / 14380) * np.log(emissivity))
    return lst_kelvin - 273.15  # -> Celsius


def compute_lst_from_ndvi_proxy(ndvi: np.ndarray, ambient_air_temp_c: float) -> np.ndarray:
    """
    Sentinel-2 has no thermal band, so for Sentinel-2-only ingestion we
    approximate surface temperature from ambient air temperature plus an
    NDVI-driven offset: bare/impervious surfaces (low NDVI) run several
    degrees hotter than vegetated surfaces (high NDVI) at the same air temp.
    """
    offset = (1 - np.clip(ndvi, -1, 1)) * 6.0 - 2.0  # roughly -2C (dense veg) to +10C (bare)
    return ambient_air_temp_c + offset


def compute_uhi_index(surface_temp: np.ndarray, district_mean_temp_c: float) -> np.ndarray:
    """Standardized UHI index: (pixel LST - district mean LST) / district std, clipped to [-3, 3]."""
    std = float(np.std(surface_temp)) or 1.0
    return np.clip((surface_temp - district_mean_temp_c) / std, -3, 3)


def analyze_ward_bands(
    red_band: np.ndarray,
    nir_band: np.ndarray,
    district_mean_temp_c: float,
    thermal_band_kelvin: np.ndarray | None = None,
    ambient_air_temp_c: float | None = None,
) -> UHIResult:
    ndvi = compute_ndvi(red_band, nir_band)

    if thermal_band_kelvin is not None:
        surface_temp = compute_lst_from_thermal(thermal_band_kelvin, ndvi)
        source_used = "landsat8"
    else:
        if ambient_air_temp_c is None:
            raise ValueError("ambient_air_temp_c is required when no thermal band is provided (Sentinel-2 path)")
        surface_temp = compute_lst_from_ndvi_proxy(ndvi, ambient_air_temp_c)
        source_used = "sentinel2"

    uhi_index = compute_uhi_index(surface_temp, district_mean_temp_c)

    return UHIResult(
        mean_ndvi=round(float(np.mean(ndvi)), 3),
        mean_surface_temp_c=round(float(np.mean(surface_temp)), 2),
        uhi_index=round(float(np.mean(uhi_index)), 2),
        intensity_c=round(float(np.mean(surface_temp)) - district_mean_temp_c, 2),
        satellite_source=source_used,
    )


def generate_synthetic_bands(
    size: int = 64, vegetation_index: float = 0.3, impervious_pct: float = 0.6, seed: int = 42
) -> dict[str, np.ndarray]:
    """
    Produces plausible Sentinel-2-like red/NIR reflectance bands (and a
    Landsat-8-like thermal band) for a ward, parameterized by its known
    vegetation index and impervious-surface fraction, so the UHI pipeline
    can run end-to-end before a real satellite feed is wired in.
    """
    rng = np.random.default_rng(seed)
    veg_mask = rng.random((size, size)) < vegetation_index
    red = np.where(veg_mask, rng.normal(0.08, 0.02, (size, size)), rng.normal(0.22, 0.03, (size, size)))
    nir = np.where(veg_mask, rng.normal(0.45, 0.05, (size, size)), rng.normal(0.18, 0.03, (size, size)))
    red = np.clip(red, 0.01, 1.0)
    nir = np.clip(nir, 0.01, 1.0)

    base_kelvin = 305 + impervious_pct * 8  # hotter with more impervious surface
    thermal = rng.normal(base_kelvin, 1.5, (size, size))
    thermal = np.where(veg_mask, thermal - 4, thermal)  # vegetation cools locally

    return {"red": red, "nir": nir, "thermal_kelvin": thermal}


def load_raster_bands(file_path: str) -> dict[str, np.ndarray]:
    """
    Production integration point: loads real Sentinel-2/Landsat-8 GeoTIFF
    bands via rasterio. Requires the `rasterio` package and a real raster
    file path (e.g. downloaded via the Copernicus Open Access Hub or USGS
    EarthExplorer for the ward's bounding box).
    """
    import rasterio  # optional dependency, imported lazily

    with rasterio.open(file_path) as src:
        bands = {f"band_{i+1}": src.read(i + 1) for i in range(src.count)}
    return bands
