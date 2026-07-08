# Backend

Django backend for the Smart Urban and Crime Intelligence System.

## Stack
- Django
- Django REST Framework
- PostgreSQL + PostGIS

## Local setup
1. Create and activate a Python virtual environment.
2. Install dependencies with `pip install -r requirements.txt`.
3. Copy `.env.example` to `.env` and update the values.
4. Run `python manage.py migrate`.
5. Start the server with `python manage.py runserver`.
