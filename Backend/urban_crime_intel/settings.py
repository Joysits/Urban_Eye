from pathlib import Path
import os
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

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
ALLOWED_HOSTS = ["*"]

# -----------------------------------------------------------------------------
# Database Configuration
# -----------------------------------------------------------------------------
import socket

def is_port_open(host, port):
    try:
        with socket.create_connection((host, int(port)), timeout=1):
            return True
    except Exception:
        return False

DATABASE_TYPE = os.getenv("DATABASE_TYPE", "sqlite3").lower()
pg_host = os.getenv("POSTGRES_HOST", "localhost")
pg_port = os.getenv("POSTGRES_PORT", "5433")

if DATABASE_TYPE in {"postgis", "postgres", "postgresql"} and (is_port_open(pg_host, pg_port) or is_port_open(pg_host, 5432)):
    active_port = pg_port if is_port_open(pg_host, pg_port) else "5432"
    DATABASES = {
        "default": {
            "ENGINE": "django.contrib.gis.db.backends.postgis",
            "NAME": os.getenv("POSTGRES_DB", "urban_crime_intel"),
            "USER": os.getenv("POSTGRES_USER", "postgres"),
            "PASSWORD": os.getenv("POSTGRES_PASSWORD", "Joy"),
            "HOST": pg_host,
            "PORT": active_port,
        }
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }

active_engine = DATABASES["default"]["ENGINE"]
is_spatial_db = "postgis" in active_engine or "spatialite" in active_engine

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "corsheaders",
    "rest_framework",
    "rest_framework.authtoken",
    "api",
]

if is_spatial_db:
    INSTALLED_APPS.insert(6, "django.contrib.gis")

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
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
STATIC_ROOT = BASE_DIR / "staticfiles"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_HEADERS = [
    "accept",
    "accept-encoding",
    "authorization",
    "content-type",
    "dnt",
    "origin",
    "user-agent",
    "x-csrftoken",
    "x-requested-with",
]

# Email Configuration
EMAIL_HOST = os.getenv("EMAIL_HOST", "smtp-relay.brevo.com")
EMAIL_PORT = int(os.getenv("EMAIL_PORT", 587))
EMAIL_USE_TLS = os.getenv("EMAIL_USE_TLS", "True").lower() == "true"
EMAIL_USE_SSL = False
EMAIL_HOST_USER = os.getenv("EMAIL_HOST_USER", "").strip()
EMAIL_HOST_PASSWORD = os.getenv("EMAIL_HOST_PASSWORD", "").strip()

if EMAIL_HOST_USER and EMAIL_HOST_PASSWORD:
    EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
    DEFAULT_FROM_EMAIL = f"Urban Eye Support <{EMAIL_HOST_USER}>"
    SERVER_EMAIL = EMAIL_HOST_USER
else:
    EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"
    DEFAULT_FROM_EMAIL = "Urban Eye Support <noreply@urbaneye.co.ke>"