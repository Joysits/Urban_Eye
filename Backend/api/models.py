from django.db import models
from django.contrib.auth.models import User

class UserProfile(models.Model):
    CITY_CHOICES = [
        ("Nairobi", "Nairobi"),
        ("Mombasa", "Mombasa"),
        ("Eldoret", "Eldoret"),
    ]

    ROLE_CHOICES = [
        ("Urban Planner", "Urban Planner"),
        ("Law Enforcement", "Law Enforcement"),
        ("Researcher", "Researcher"),
        ("Administrator", "Administrator"),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    focus_city = models.CharField(max_length=50, choices=CITY_CHOICES, default="Nairobi")
    agency_role = models.CharField(max_length=50, choices=ROLE_CHOICES, default="Urban Planner")

    def __str__(self):
        return f"{self.user.username}'s profile - {self.focus_city} ({self.agency_role})"
