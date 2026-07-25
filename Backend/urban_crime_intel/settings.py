from pathlib import Path
import os
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

# -----------------------------------------------------------------------------
# GISInternals / OSGeo4W GDAL & GEOS Configuration (Required for Windows & GeoDjango)
# -----------------------------------------------------------------------------
if os.name == 'nt':
    # 1. Try GISInternals first (default install directory)
    GISINTERNALS_DIR = r'C:\Program Files\GDAL'

    if os.path.exists(GISINTERNALS_DIR):
        if hasattr(os, 'add_dll_directory'):
            os.add_dll_directory(GISINTERNALS_DIR)

        os.environ['PATH'] = GISINTERNALS_DIR + ';' + os.environ.get('PATH', '')
        os.environ['GDAL_DATA'] = os.path.join(GISINTERNALS_DIR, 'gdal-data')
        os.environ['PROJ_LIB'] = os.path.join(GISINTERNALS_DIR, 'projlib')

        # Dynamically locate the gdal*.dll file in C:\Program Files\GDAL
        for file in os.listdir(GISINTERNALS_DIR):
            if file.startswith('gdal') and file.endswith('.dll'):
                GDAL_LIBRARY_PATH = os.path.join(GISINTERNALS_DIR, file)
                break

        geos_dll = os.path.join(GISINTERNALS_DIR, 'geos_c.dll')
        if os.path.exists(geos_dll):
            GEOS_LIBRARY_PATH = geos_dll

    # 2. Fallback to OSGeo4W if GISInternals is not installed
    elif os.path.exists(r'C:\OSGeo4W\bin'):
        OSGEO4W_ROOT = r'C:\OSGeo4W'
        gdal_bin = os.path.join(OSGEO4W_ROOT, 'bin')

        if hasattr(os, 'add_dll_directory'):
            os.add_dll_directory(gdal_bin)

        os.environ['PATH'] = gdal_bin + ';' + os.environ.get('PATH', '')
        os.environ['GDAL_DATA'] = os.path.join(OSGEO4W_ROOT, 'share', 'gdal')
        os.environ['PROJ_LIB'] = os.path.join(OSGEO4W_ROOT, 'share', 'proj')

        for file in os.listdir(gdal_bin):
            if file.startswith('gdal') and file.endswith('.dll'):
                GDAL_LIBRARY_PATH = os.path.join(gdal_bin, file)
                break

        geos_dll = os.path.join(gdal_bin, 'geos_c.dll')
        if os.path.exists(geos_dll):
            GEOS_LIBRARY_PATH = geos_dll

SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "django-insecure-change-me")
DEBUG = os.getenv("DJANGO_DEBUG", "true").lower() in {"1", "true", "yes"}
ALLOWED_HOSTS = [
    host.strip()
    for host in os.getenv("DJANGO_ALLOWED_HOSTS", "localhost,127.0.0.1,testserver,0.0.0.0").split(",")
    if host.strip()
]

DATABASE_TYPE = os.getenv("DATABASE_TYPE", "postgis").lower()

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django.contrib.gis",  # Enabled GeoDjango for PostGIS spatial features
    "corsheaders",
    "rest_framework",
    "rest_framework.authtoken",
    "api",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "urban_crime_intel.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "urban_crime_intel.wsgi.application"
ASGI_APPLICATION = "urban_crime_intel.asgi.application"

# -----------------------------------------------------------------------------
# Database Configuration
# -----------------------------------------------------------------------------
if DATABASE_TYPE == "postgis":
    DATABASES = {
        "default": {
            "ENGINE": "django.contrib.gis.db.backends.postgis",
            "NAME": os.getenv("POSTGRES_DB", "urban_crime_intel"),
            "USER": os.getenv("POSTGRES_USER", "urban_user"),
            "PASSWORD": os.getenv("POSTGRES_PASSWORD", "change-this-password"),
            "HOST": os.getenv("POSTGRES_HOST", "localhost"),
            "PORT": os.getenv("POSTGRES_PORT", "5432"),
        }
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }

# Django REST Framework Settings
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.TokenAuthentication",
    ],
}

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

DEFAULT_CORS_ORIGINS = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173,http://127.0.0.1:4173"

CORS_ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv("CORS_ALLOWED_ORIGINS", DEFAULT_CORS_ORIGINS).split(",")
    if origin.strip()
]