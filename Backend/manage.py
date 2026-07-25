#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import sys

# -----------------------------------------------------------------------------
# OSGeo4W / GDAL DLL Registration for Windows (Python 3.8+)
# Must run before Django settings or GDAL modules are imported
# -----------------------------------------------------------------------------
if os.name == 'nt':
    osgeo_bin = r'C:\OSGeo4W\bin'
    if os.path.exists(osgeo_bin):
        if hasattr(os, 'add_dll_directory'):
            os.add_dll_directory(osgeo_bin)
        os.environ['PATH'] = osgeo_bin + ';' + os.environ.get('PATH', '')
        os.environ['GDAL_DATA'] = r'C:\OSGeo4W\share\gdal'
        os.environ['PROJ_LIB'] = r'C:\OSGeo4W\share\proj'


def main():
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "urban_crime_intel.settings")
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and available on your PYTHONPATH environment variable?"
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == "__main__":
    main()