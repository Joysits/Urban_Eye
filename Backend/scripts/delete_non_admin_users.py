import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'urban_crime_intel.settings')

import django
django.setup()

from django.contrib.auth import get_user_model

def main():
    User = get_user_model()
    non_admins = User.objects.filter(is_superuser=False, is_staff=False).exclude(username__in=['admin', 'administrator'])
    count = non_admins.count()
    deleted_count, _ = non_admins.delete()
    print(f"✅ Successfully deleted {count} non-admin user accounts ({deleted_count} total CASCADE records cleaned).")

if __name__ == '__main__':
    main()
