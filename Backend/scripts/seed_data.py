"""
seed_data.py — Urban Eye Database Seeder
=========================================
Seeds the database with KNBS-aligned and NPS-aligned data for Nairobi, Mombasa,
and Eldoret: Zones (with PostGIS boundary polygons), Population data, Infrastructure,
and 6 months of historical crime incidents.

Run from the Backend directory:
    python manage.py shell < scripts/seed_data.py

Or using Django's management command:
    python manage.py runscript seed_data  (requires django-extensions)
"""

import os
import sys
import django
import random
from datetime import datetime, timedelta
from django.utils import timezone

# ─── Django Setup (only needed if running as standalone) ──────────────────────
if __name__ == "__main__":
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "urban_crime_intel.settings")
    django.setup()

from django.contrib.gis.geos import Point, Polygon, MultiPolygon
from api.models import Zone, Incident, PopulationData, Infrastructure

# ─── KNBS-Aligned Population Data (2019 Census) ───────────────────────────────
# Source: Kenya National Bureau of Statistics — 2019 Kenya Population Census

ZONES_DATA = {
    "Nairobi": [
        {
            "name": "Central Business District",
            "population": 52000,
            "density": 18500.0,
            "growth_rate": 1.2,
            # Approximate bbox polygon [lng_min, lat_min, lng_max, lat_max]
            "bbox": [36.810, -1.295, 36.832, -1.275],
        },
        {
            "name": "Westlands",
            "population": 118000,
            "density": 7200.0,
            "growth_rate": 3.4,
            "bbox": [36.790, -1.275, 36.820, -1.255],
        },
        {
            "name": "Eastlands (Makadara)",
            "population": 320000,
            "density": 22000.0,
            "growth_rate": 2.1,
            "bbox": [36.855, -1.295, 36.900, -1.265],
        },
        {
            "name": "Kibra",
            "population": 170000,
            "density": 66400.0,
            "growth_rate": 0.8,
            "bbox": [36.775, -1.320, 36.800, -1.295],
        },
        {
            "name": "Karen / Langata",
            "population": 75000,
            "density": 1100.0,
            "growth_rate": 4.2,
            "bbox": [36.720, -1.360, 36.780, -1.310],
        },
        {
            "name": "Kasarani",
            "population": 210000,
            "density": 9500.0,
            "growth_rate": 5.1,
            "bbox": [36.870, -1.240, 36.920, -1.200],
        },
        {
            "name": "Embakasi",
            "population": 280000,
            "density": 14800.0,
            "growth_rate": 3.7,
            "bbox": [36.880, -1.330, 36.950, -1.270],
        },
    ],
    "Mombasa": [
        {
            "name": "Mombasa Island (Old Town)",
            "population": 95000,
            "density": 28000.0,
            "growth_rate": 0.5,
            "bbox": [39.655, -4.065, 39.680, -4.035],
        },
        {
            "name": "Nyali",
            "population": 120000,
            "density": 4200.0,
            "growth_rate": 3.8,
            "bbox": [39.685, -4.035, 39.720, -4.000],
        },
        {
            "name": "Likoni",
            "population": 138000,
            "density": 8700.0,
            "growth_rate": 2.3,
            "bbox": [39.645, -4.085, 39.680, -4.060],
        },
        {
            "name": "Changamwe / Port Reitz",
            "population": 110000,
            "density": 6100.0,
            "growth_rate": 1.9,
            "bbox": [39.600, -4.055, 39.650, -4.025],
        },
    ],
    "Eldoret": [
        {
            "name": "Eldoret Town Centre",
            "population": 78000,
            "density": 5800.0,
            "growth_rate": 4.5,
            "bbox": [35.258, 0.505, 35.285, 0.530],
        },
        {
            "name": "Langas",
            "population": 62000,
            "density": 12400.0,
            "growth_rate": 3.9,
            "bbox": [35.280, 0.480, 35.310, 0.510],
        },
        {
            "name": "Kapseret",
            "population": 84000,
            "density": 2200.0,
            "growth_rate": 6.1,
            "bbox": [35.220, 0.520, 35.260, 0.560],
        },
    ],
}

# ─── Infrastructure (based on public OpenStreetMap / KNBS facilities data) ───
INFRASTRUCTURE_DATA = {
    "Nairobi": [
        # Schools (matching KNBS ~3,000 schools in Nairobi County)
        {"name": "Nairobi Primary School", "type": "School", "lat": -1.283, "lng": 36.820},
        {"name": "St. Mary's School Westlands", "type": "School", "lat": -1.264, "lng": 36.804},
        {"name": "Makadara Primary", "type": "School", "lat": -1.285, "lng": 36.872},
        {"name": "Kibra Community School", "type": "School", "lat": -1.311, "lng": 36.786},
        {"name": "Karen C Primary School", "type": "School", "lat": -1.335, "lng": 36.745},
        # Hospitals (public: KNH, Mbagathi, Pumwani, Mama Lucy, etc.)
        {"name": "Kenyatta National Hospital", "type": "Hospital", "lat": -1.301, "lng": 36.807},
        {"name": "Nairobi West Hospital", "type": "Hospital", "lat": -1.317, "lng": 36.802},
        {"name": "Mama Lucy Kibaki Hospital", "type": "Hospital", "lat": -1.280, "lng": 36.888},
        {"name": "Pumwani Maternity Hospital", "type": "Hospital", "lat": -1.277, "lng": 36.853},
        {"name": "Mbagathi District Hospital", "type": "Hospital", "lat": -1.320, "lng": 36.796},
        # Roads
        {"name": "Uhuru Highway", "type": "Road", "lat": -1.288, "lng": 36.815},
        {"name": "Thika Superhighway (A2)", "type": "Road", "lat": -1.240, "lng": 36.880},
        {"name": "Waiyaki Way", "type": "Road", "lat": -1.268, "lng": 36.790},
        {"name": "Mombasa Road (A109)", "type": "Road", "lat": -1.335, "lng": 36.855},
        # Power & Water
        {"name": "KPLC Nairobi West Sub-Station", "type": "Power", "lat": -1.315, "lng": 36.803},
        {"name": "Ruiru Water Treatment Plant", "type": "Water", "lat": -1.148, "lng": 36.960},
    ],
    "Mombasa": [
        {"name": "Mombasa Baptist Church School", "type": "School", "lat": -4.052, "lng": 39.665},
        {"name": "Port Reitz Primary School", "type": "School", "lat": -4.035, "lng": 39.615},
        {"name": "Coast General Teaching & Referral Hospital", "type": "Hospital", "lat": -4.044, "lng": 39.668},
        {"name": "Aga Khan Hospital Mombasa", "type": "Hospital", "lat": -4.038, "lng": 39.672},
        {"name": "Mombasa-Nairobi Highway (A109)", "type": "Road", "lat": -4.020, "lng": 39.630},
        {"name": "KPLC Mombasa Grid Station", "type": "Power", "lat": -4.048, "lng": 39.640},
        {"name": "Mombasa Water & Sewerage Company", "type": "Water", "lat": -4.055, "lng": 39.660},
    ],
    "Eldoret": [
        {"name": "Eldoret National Polytechnic", "type": "School", "lat": 0.523, "lng": 35.270},
        {"name": "Moi Teaching & Referral Hospital", "type": "Hospital", "lat": 0.519, "lng": 35.275},
        {"name": "Eldoret Airport Road", "type": "Road", "lat": 0.540, "lng": 35.240},
        {"name": "KPLC Eldoret Sub-Station", "type": "Power", "lat": 0.515, "lng": 35.265},
        {"name": "Eldoret Water & Sanitation", "type": "Water", "lat": 0.510, "lng": 35.275},
    ],
}

# ─── NPS-Aligned Crime Categories & Rates ────────────────────────────────────
# Source: National Police Service Annual Crime Reports 2023/2024
# Top categories: Theft (40%), Assault (25%), Traffic (15%), Vandalism (12%), Other (8%)

CRIME_PROFILES = {
    "Central Business District": {"base": 35, "categories": {"Theft": 45, "Assault": 20, "Traffic": 15, "Vandalism": 15, "Other": 5}},
    "Westlands":                 {"base": 18, "categories": {"Theft": 40, "Assault": 18, "Traffic": 22, "Vandalism": 12, "Other": 8}},
    "Eastlands (Makadara)":      {"base": 28, "categories": {"Theft": 38, "Assault": 30, "Traffic": 12, "Vandalism": 14, "Other": 6}},
    "Kibra":                     {"base": 40, "categories": {"Theft": 35, "Assault": 38, "Traffic": 5, "Vandalism": 18, "Other": 4}},
    "Karen / Langata":           {"base": 8,  "categories": {"Theft": 50, "Assault": 10, "Traffic": 25, "Vandalism": 10, "Other": 5}},
    "Kasarani":                  {"base": 22, "categories": {"Theft": 42, "Assault": 22, "Traffic": 18, "Vandalism": 12, "Other": 6}},
    "Embakasi":                  {"base": 25, "categories": {"Theft": 40, "Assault": 25, "Traffic": 20, "Vandalism": 10, "Other": 5}},
    # Mombasa
    "Mombasa Island (Old Town)": {"base": 30, "categories": {"Theft": 48, "Assault": 22, "Traffic": 8, "Vandalism": 16, "Other": 6}},
    "Nyali":                     {"base": 12, "categories": {"Theft": 45, "Assault": 15, "Traffic": 28, "Vandalism": 8, "Other": 4}},
    "Likoni":                    {"base": 20, "categories": {"Theft": 38, "Assault": 30, "Traffic": 12, "Vandalism": 15, "Other": 5}},
    "Changamwe / Port Reitz":    {"base": 22, "categories": {"Theft": 35, "Assault": 25, "Traffic": 25, "Vandalism": 10, "Other": 5}},
    # Eldoret
    "Eldoret Town Centre":       {"base": 15, "categories": {"Theft": 42, "Assault": 20, "Traffic": 20, "Vandalism": 12, "Other": 6}},
    "Langas":                    {"base": 20, "categories": {"Theft": 38, "Assault": 30, "Traffic": 10, "Vandalism": 17, "Other": 5}},
    "Kapseret":                  {"base": 10, "categories": {"Theft": 40, "Assault": 18, "Traffic": 25, "Vandalism": 12, "Other": 5}},
}

SEVERITY_WEIGHTS = ["Low", "Low", "Moderate", "Moderate", "Moderate", "High", "High", "Critical"]

def bbox_to_polygon(bbox):
    """Convert [lng_min, lat_min, lng_max, lat_max] to a GEOS Polygon."""
    lng_min, lat_min, lng_max, lat_max = bbox
    return Polygon([
        (lng_min, lat_min),
        (lng_max, lat_min),
        (lng_max, lat_max),
        (lng_min, lat_max),
        (lng_min, lat_min),
    ], srid=4326)

def bbox_center(bbox):
    """Return (lat, lng) center of bbox."""
    lng_min, lat_min, lng_max, lat_max = bbox
    return ((lat_min + lat_max) / 2, (lng_min + lng_max) / 2)

def rand_point_in_bbox(bbox):
    """Random point inside a bbox."""
    lng_min, lat_min, lng_max, lat_max = bbox
    lat = random.uniform(lat_min, lat_max)
    lng = random.uniform(lng_min, lng_max)
    return lat, lng


def run():
    print("=" * 60)
    print("Urban Eye — Database Seeder")
    print("KNBS 2019 Census + NPS Crime Report Aligned")
    print("=" * 60)

    # ── 1. Create / Update Zones ──────────────────────────────────────────────
    print("\n[1/4] Seeding Zones with boundary polygons...")
    zone_map = {}  # city -> name -> Zone object

    for city, zone_list in ZONES_DATA.items():
        zone_map[city] = {}
        for z in zone_list:
            zone_obj, created = Zone.objects.update_or_create(
                name=z["name"],
                city=city,
                defaults={"boundary": bbox_to_polygon(z["bbox"])},
            )
            zone_map[city][z["name"]] = zone_obj
            action = "Created" if created else "Updated"
            print(f"  {action}: {city} — {z['name']}")

    # ── 2. Population Data (KNBS 2019) ────────────────────────────────────────
    print("\n[2/4] Seeding Population data (KNBS 2019 Census)...")
    current_year = datetime.now().year

    for city, zone_list in ZONES_DATA.items():
        for z in zone_list:
            zone_obj = zone_map[city][z["name"]]
            for year_offset in range(5):
                year = 2019 + year_offset
                # Apply compound growth
                factor = (1 + z["growth_rate"] / 100) ** year_offset
                pop = int(z["population"] * factor)
                density = round(z["density"] * factor, 1)
                PopulationData.objects.update_or_create(
                    zone=zone_obj,
                    year=year,
                    defaults={"population": pop, "density": density, "growth_rate": z["growth_rate"]},
                )
            print(f"  Population: {city} — {z['name']} ({2019}–{2019+4})")

    # ── 3. Infrastructure ─────────────────────────────────────────────────────
    print("\n[3/4] Seeding Infrastructure...")
    for city, infra_list in INFRASTRUCTURE_DATA.items():
        for item in infra_list:
            obj, created = Infrastructure.objects.update_or_create(
                name=item["name"],
                city=city,
                defaults={
                    "infra_type": item["type"],
                    "status": "Operational",
                    "geometry": Point(item["lng"], item["lat"], srid=4326),
                },
            )
            action = "Created" if created else "Updated"
            print(f"  {action}: [{city}] {item['type']} — {item['name']}")

    # ── 4. Historical Crime Incidents (6 months, NPS-aligned) ─────────────────
    print("\n[4/4] Seeding 6 months of historical crime incidents (NPS-aligned)...")
    now = timezone.now()

    total_created = 0
    for city, zone_list in ZONES_DATA.items():
        for z in zone_list:
            zone_obj = zone_map[city][z["name"]]
            profile = CRIME_PROFILES.get(z["name"], {"base": 15, "categories": {"Theft": 40, "Assault": 25, "Traffic": 15, "Vandalism": 15, "Other": 5}})
            base_per_month = profile["base"]

            for month_offset in range(6):
                # Incidents for this month
                month_start = now - timedelta(days=(6 - month_offset) * 30)
                # Slight random variation ±20%
                count = int(base_per_month * random.uniform(0.8, 1.2))

                # Distribute across categories
                category_counts = {}
                remaining = count
                cats = list(profile["categories"].keys())
                for i, cat in enumerate(cats[:-1]):
                    pct = profile["categories"][cat] / 100
                    n = int(count * pct)
                    category_counts[cat] = n
                    remaining -= n
                category_counts[cats[-1]] = max(0, remaining)

                for cat, n in category_counts.items():
                    for _ in range(n):
                        lat, lng = rand_point_in_bbox(z["bbox"])
                        day_offset = random.randint(0, 29)
                        hour_offset = random.randint(0, 23)
                        reported_at = month_start + timedelta(days=day_offset, hours=hour_offset)

                        Incident.objects.create(
                            city=city,
                            zone=zone_obj,
                            category=cat,
                            severity=random.choice(SEVERITY_WEIGHTS),
                            status=random.choice(["Open", "Investigating", "Resolved"]),
                            location=Point(lng, lat, srid=4326),
                            description=f"{cat} incident reported in {z['name']}, {city}.",
                            reported_at=reported_at,
                        )
                        total_created += 1

            print(f"  Incidents: {city} — {z['name']}")

    print("\n[DONE] Seeding complete!")
    print(f"   Zones:          {Zone.objects.count()}")
    print(f"   Pop records:    {PopulationData.objects.count()}")
    print(f"   Infrastructure: {Infrastructure.objects.count()}")
    print(f"   Incidents:      {Incident.objects.count()} ({total_created} newly created)")
    print("\nNote: All incident data is synthetic but statistically aligned with")
    print("KNBS 2019 Census and NPS 2023/2024 Annual Crime Reports.")


if __name__ == "__main__":
    run()
else:
    # Called via: python manage.py shell < scripts/seed_data.py
    run()
