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
# NOTE: Database selection is PURELY environment-variable based.
# No TCP port probing — that approach causes silent fallback to SQLite on cloud
# hosts (Render, Railway, etc.) where connections take > 1 s on cold start.
#
# Priority:
#   1. DATABASE_URL  (Render's native env var — set automatically on Render)
#   2. DATABASE_TYPE + POSTGRES_* vars  (explicit config)
#   3. SQLite        (local dev fallback only)

DATABASE_URL = os.getenv("DATABASE_URL", "").strip()
DATABASE_TYPE = os.getenv("DATABASE_TYPE", "sqlite3").lower()

if DATABASE_URL:
    # Render injects DATABASE_URL automatically for linked Postgres services.
    # Parse it manually to keep the PostGIS engine.
    import urllib.parse as _urlparse
    _url = _urlparse.urlparse(DATABASE_URL)
    DATABASES = {
        "default": {
            "ENGINE": "django.contrib.gis.db.backends.postgis",
            "NAME": _url.path.lstrip("/"),
            "USER": _url.username or "",
            "PASSWORD": _url.password or "",
            "HOST": _url.hostname or "localhost",
            "PORT": str(_url.port or 5432),
            "CONN_MAX_AGE": 60,
        }
    }
elif DATABASE_TYPE in {"postgis", "postgres", "postgresql"}:
    # Explicit POSTGRES_* env vars — used when DATABASE_URL is not set.
    DATABASES = {
        "default": {
            "ENGINE": "django.contrib.gis.db.backends.postgis",
            "NAME": os.getenv("POSTGRES_DB", "urban_crime_intel"),
            "USER": os.getenv("POSTGRES_USER", "postgres"),
            "PASSWORD": os.getenv("POSTGRES_PASSWORD", ""),
            "HOST": os.getenv("POSTGRES_HOST", "localhost"),
            "PORT": os.getenv("POSTGRES_PORT", "5432"),
            "CONN_MAX_AGE": 60,
        }
    }
else:
    # SQLite — local development only. Never reached on Render.
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
CORS_ALLOWED_ORIGINS = [
    "https://urban-eye-app.vercel.app",
    "http://localhost:5173",
    "http://localhost:3000",
]
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
EMAIL_USE_SSL = os.getenv("EMAIL_USE_SSL", "False").lower() == "true"
EMAIL_HOST_USER = os.getenv("EMAIL_HOST_USER", "").strip()
EMAIL_HOST_PASSWORD = os.getenv("EMAIL_HOST_PASSWORD", "").strip()
DEFAULT_FROM_EMAIL = os.getenv("DEFAULT_FROM_EMAIL", f"Urban Eye Support <{EMAIL_HOST_USER}>" if EMAIL_HOST_USER else "Urban Eye Support <noreply@urbaneye.co.ke>")

if EMAIL_HOST_USER and EMAIL_HOST_PASSWORD:
    EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
else:
    EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"