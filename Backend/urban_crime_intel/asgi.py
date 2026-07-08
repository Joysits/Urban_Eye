"""ASGI config for urban_crime_intel project."""

import os

from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "urban_crime_intel.settings")

application = get_asgi_application()
