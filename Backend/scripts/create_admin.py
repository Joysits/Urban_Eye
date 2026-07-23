import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'urban_crime_intel.settings')

import django
django.setup()

from django.contrib.auth import get_user_model

def main():
    User = get_user_model()
    username = 'admin'
    email = 'admin@example.com'
    pw = 'AdminPass123'
    if User.objects.filter(username=username).exists():
        u = User.objects.get(username=username)
        u.set_password(pw)
        u.email = email
        u.save()
        print('updated')
    else:
        User.objects.create_superuser(username, email, pw)
        print('created')

if __name__ == '__main__':
    main()
