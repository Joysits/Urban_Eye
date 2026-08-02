import os
import sys
import django

# Initialize Django environment
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "urban_crime_intel.settings")
django.setup()

from django.contrib.auth.models import User
from api.models import UserProfile

def create_admin_superuser():
    username = "admin"
    email = "admin@gmail.com"
    password = "AdminPassword123"

    user, created = User.objects.get_or_create(username=username, defaults={"email": email})
    if created:
        user.email = email
        user.set_password(password)
        user.is_superuser = True
        user.is_staff = True
        user.save()
        print(f"✅ Created superuser '{username}' ({email}) successfully with password '{password}'.")
    else:
        user.email = email
        user.set_password(password)
        user.is_superuser = True
        user.is_staff = True
        user.save()
        print(f"✅ Updated superuser '{username}' ({email}) password to '{password}'.")

    # Ensure UserProfile exists
    profile, p_created = UserProfile.objects.get_or_create(user=user, defaults={"agency_role": "Administrator", "focus_city": "Nairobi"})
    if not p_created:
        profile.agency_role = "Administrator"
        profile.save()

if __name__ == "__main__":
    create_admin_superuser()
