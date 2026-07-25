import os
import django
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
# Set up Django environment settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'urban_crime_intel.settings')
django.setup()

from django.contrib.gis.geos import Point
from api.models import Incident

def populate():
    count = 0
    for incident in Incident.objects.all():
        if incident.longitude and incident.latitude and not incident.location:
            # Note: GEOS Point takes (longitude, latitude)
            incident.location = Point(incident.longitude, incident.latitude, srid=4326)
            incident.save()
            count += 1
    print(f"Successfully populated location geometry for {count} incidents.")

if __name__ == '__main__':
    populate()