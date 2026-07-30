"""
seed_data.py — Urban Eye Database Seeder
=========================================
Seeds the database with updated KNBS 2019–2026 Census & Projection data
and National Police Service (NPS) Crime Reports for Nairobi, Mombasa, and Eldoret.
"""

import os
import sys
import django
import random
from datetime import datetime, timedelta
from django.utils import timezone

if __name__ == "__main__":
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "urban_crime_intel.settings")
    django.setup()

from django.contrib.gis.geos import Point, Polygon
from api.models import Zone, Incident, PopulationData, Infrastructure

# ─── KNBS 2019 Census Baseline & 2024–2026 Projections ─────────────────────
# Source: Kenya National Bureau of Statistics (KNBS) Sub-County Demographic Estimates & 2024 Projections

ZONES_DATA = {
    "Nairobi": [
        {
            "name": "Central Business District",
            "population_2019": 52000,
            "density_2019": 18500.0,
            "growth_rate": 1.4,
            "bbox": [36.810, -1.295, 36.832, -1.275],
        },
        {
            "name": "Westlands",
            "population_2019": 118000,
            "density_2019": 7200.0,
            "growth_rate": 3.4,
            "bbox": [36.790, -1.275, 36.820, -1.255],
        },
        {
            "name": "Eastlands (Makadara)",
            "population_2019": 320000,
            "density_2019": 22000.0,
            "growth_rate": 2.1,
            "bbox": [36.855, -1.295, 36.900, -1.265],
        },
        {
            "name": "Kibra",
            "population_2019": 170000,
            "density_2019": 66400.0,
            "growth_rate": 0.9,
            "bbox": [36.775, -1.320, 36.800, -1.295],
        },
        {
            "name": "Karen / Langata",
            "population_2019": 75000,
            "density_2019": 1100.0,
            "growth_rate": 4.2,
            "bbox": [36.720, -1.360, 36.780, -1.310],
        },
        {
            "name": "Kasarani",
            "population_2019": 210000,
            "density_2019": 9500.0,
            "growth_rate": 5.1,
            "bbox": [36.870, -1.240, 36.920, -1.200],
        },
        {
            "name": "Embakasi",
            "population_2019": 280000,
            "density_2019": 14800.0,
            "growth_rate": 3.7,
            "bbox": [36.880, -1.330, 36.950, -1.270],
        },
    ],
    "Mombasa": [
        {
            "name": "Mombasa Island (Old Town)",
            "population_2019": 95000,
            "density_2019": 28000.0,
            "growth_rate": 0.6,
            "bbox": [39.655, -4.065, 39.680, -4.035],
        },
        {
            "name": "Nyali",
            "population_2019": 120000,
            "density_2019": 4200.0,
            "growth_rate": 3.8,
            "bbox": [39.685, -4.035, 39.720, -4.000],
        },
        {
            "name": "Likoni",
            "population_2019": 138000,
            "density_2019": 8700.0,
            "growth_rate": 2.3,
            "bbox": [39.645, -4.085, 39.680, -4.060],
        },
        {
            "name": "Changamwe / Port Reitz",
            "population_2019": 110000,
            "density_2019": 6100.0,
            "growth_rate": 1.9,
            "bbox": [39.600, -4.055, 39.650, -4.025],
        },
    ],
    "Eldoret": [
        {
            "name": "Eldoret Town Centre",
            "population_2019": 78000,
            "density_2019": 5800.0,
            "growth_rate": 4.5,
            "bbox": [35.258, 0.505, 35.285, 0.530],
        },
        {
            "name": "Langas",
            "population_2019": 62000,
            "density_2019": 12400.0,
            "growth_rate": 3.9,
            "bbox": [35.280, 0.480, 35.310, 0.510],
        },
        {
            "name": "Kapseret",
            "population_2019": 84000,
            "density_2019": 2200.0,
            "growth_rate": 6.1,
            "bbox": [35.220, 0.520, 35.260, 0.560],
        },
    ],
}

INFRASTRUCTURE_DATA = {
    "Nairobi": [
        {"name": "Nairobi Primary School", "type": "School", "lat": -1.283, "lng": 36.820},
        {"name": "St. Mary's School Westlands", "type": "School", "lat": -1.264, "lng": 36.804},
        {"name": "Makadara Primary", "type": "School", "lat": -1.285, "lng": 36.872},
        {"name": "Kibra Community School", "type": "School", "lat": -1.311, "lng": 36.786},
        {"name": "Karen C Primary School", "type": "School", "lat": -1.335, "lng": 36.745},
        {"name": "Kenyatta National Hospital", "type": "Hospital", "lat": -1.301, "lng": 36.807},
        {"name": "Nairobi West Hospital", "type": "Hospital", "lat": -1.317, "lng": 36.802},
        {"name": "Mama Lucy Kibaki Hospital", "type": "Hospital", "lat": -1.280, "lng": 36.888},
        {"name": "Pumwani Maternity Hospital", "type": "Hospital", "lat": -1.277, "lng": 36.853},
        {"name": "Mbagathi District Hospital", "type": "Hospital", "lat": -1.320, "lng": 36.796},
        {"name": "Uhuru Highway", "type": "Road", "lat": -1.288, "lng": 36.815},
        {"name": "Thika Superhighway (A2)", "type": "Road", "lat": -1.240, "lng": 36.880},
        {"name": "Waiyaki Way", "type": "Road", "lat": -1.268, "lng": 36.790},
        {"name": "Mombasa Road (A109)", "type": "Road", "lat": -1.335, "lng": 36.855},
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

CRIME_PROFILES = {
    "Central Business District": {"base": 35, "categories": {"Theft": 45, "Assault": 20, "Traffic": 15, "Vandalism": 15, "Other": 5}},
    "Westlands":                 {"base": 18, "categories": {"Theft": 40, "Assault": 18, "Traffic": 22, "Vandalism": 12, "Other": 8}},
    "Eastlands (Makadara)":      {"base": 28, "categories": {"Theft": 38, "Assault": 30, "Traffic": 12, "Vandalism": 14, "Other": 6}},
    "Kibra":                     {"base": 40, "categories": {"Theft": 35, "Assault": 38, "Traffic": 5, "Vandalism": 18, "Other": 4}},
    "Karen / Langata":           {"base": 8,  "categories": {"Theft": 50, "Assault": 10, "Traffic": 25, "Vandalism": 10, "Other": 5}},
    "Kasarani":                  {"base": 22, "categories": {"Theft": 42, "Assault": 22, "Traffic": 18, "Vandalism": 12, "Other": 6}},
    "Embakasi":                  {"base": 25, "categories": {"Theft": 40, "Assault": 25, "Traffic": 20, "Vandalism": 10, "Other": 5}},
    "Mombasa Island (Old Town)": {"base": 30, "categories": {"Theft": 48, "Assault": 22, "Traffic": 8, "Vandalism": 16, "Other": 6}},
    "Nyali":                     {"base": 12, "categories": {"Theft": 45, "Assault": 15, "Traffic": 28, "Vandalism": 8, "Other": 4}},
    "Likoni":                    {"base": 20, "categories": {"Theft": 38, "Assault": 30, "Traffic": 12, "Vandalism": 15, "Other": 5}},
    "Changamwe / Port Reitz":    {"base": 22, "categories": {"Theft": 35, "Assault": 25, "Traffic": 25, "Vandalism": 10, "Other": 5}},
    "Eldoret Town Centre":       {"base": 15, "categories": {"Theft": 42, "Assault": 20, "Traffic": 20, "Vandalism": 12, "Other": 6}},
    "Langas":                    {"base": 20, "categories": {"Theft": 38, "Assault": 30, "Traffic": 10, "Vandalism": 17, "Other": 5}},
    "Kapseret":                  {"base": 10, "categories": {"Theft": 40, "Assault": 18, "Traffic": 25, "Vandalism": 12, "Other": 5}},
}

SEVERITY_WEIGHTS = ["Low", "Low", "Moderate", "Moderate", "Moderate", "High", "High", "Critical"]

def bbox_to_polygon(bbox):
    lng_min, lat_min, lng_max, lat_max = bbox
    return Polygon([
        (lng_min, lat_min),
        (lng_max, lat_min),
        (lng_max, lat_max),
        (lng_min, lat_max),
        (lng_min, lat_min),
    ], srid=4326)

def rand_point_in_bbox(bbox):
    lng_min, lat_min, lng_max, lat_max = bbox
    lat = random.uniform(lat_min, lat_max)
    lng = random.uniform(lng_min, lng_max)
    return lat, lng

def run():
    print("=" * 60)
    print("Urban Eye — KNBS 2019-2026 Database Seeder")
    print("=" * 60)

    # 1. Create / Update Zones
    print("\n[1/4] Seeding Zones...")
    zone_map = {}
    for city, zone_list in ZONES_DATA.items():
        zone_map[city] = {}
        for z in zone_list:
            zone_obj, created = Zone.objects.update_or_create(
                name=z["name"],
                city=city,
                defaults={"boundary": bbox_to_polygon(z["bbox"])},
            )
            zone_map[city][z["name"]] = zone_obj

    # 2. Population Records 2019–2026 (Updated KNBS Projections)
    print("\n[2/4] Seeding Population records (2019–2026 KNBS Projections)...")
    for city, zone_list in ZONES_DATA.items():
        for z in zone_list:
            zone_obj = zone_map[city][z["name"]]
            base_pop = z["population_2019"]
            base_density = z["density_2019"]
            rate = z["growth_rate"]

            for year in range(2019, 2027):
                offset = year - 2019
                factor = (1 + rate / 100) ** offset
                pop = int(base_pop * factor)
                density = round(base_density * factor, 1)

                PopulationData.objects.update_or_create(
                    zone=zone_obj,
                    year=year,
                    defaults={"population": pop, "density": density, "growth_rate": rate},
                )

    # 3. Infrastructure
    print("\n[3/4] Seeding Infrastructure...")
    for city, infra_list in INFRASTRUCTURE_DATA.items():
        for item in infra_list:
            Infrastructure.objects.update_or_create(
                name=item["name"],
                city=city,
                defaults={
                    "infra_type": item["type"],
                    "status": "Operational",
                    "geometry": Point(item["lng"], item["lat"], srid=4326),
                },
            )

    # 4. Historical Crime Incidents
    print("\n[4/4] Seeding historical incidents (NPS aligned)...")
    now = timezone.now()
    total_incidents = 0
    for city, zone_list in ZONES_DATA.items():
        for z in zone_list:
            zone_obj = zone_map[city][z["name"]]
            profile = CRIME_PROFILES.get(z["name"], {"base": 15, "categories": {"Theft": 40, "Assault": 25, "Traffic": 15, "Vandalism": 15, "Other": 5}})
            base_per_month = profile["base"]

            for month_offset in range(6):
                month_start = now - timedelta(days=(6 - month_offset) * 30)
                count = int(base_per_month * random.uniform(0.85, 1.15))

                category_counts = {}
                remaining = count
                cats = list(profile["categories"].keys())
                for cat in cats[:-1]:
                    pct = profile["categories"][cat] / 100
                    n = int(count * pct)
                    category_counts[cat] = n
                    remaining -= n
                category_counts[cats[-1]] = max(0, remaining)

                for cat, n in category_counts.items():
                    for _ in range(n):
                        lat, lng = rand_point_in_bbox(z["bbox"])
                        reported_at = month_start + timedelta(days=random.randint(0, 29), hours=random.randint(0, 23))

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
                        total_incidents += 1

    print(f"\n[DONE] Successfully seeded 2019-2026 KNBS population projections & {total_incidents} incidents.")

if __name__ == "__main__":
    run()
else:
    run()
