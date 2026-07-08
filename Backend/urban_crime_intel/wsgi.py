"""WSGI config for urban_crime_intel project."""

import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "urban_crime_intel.settings")

application = get_wsgi_application()
