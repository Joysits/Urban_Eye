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


class Incident(models.Model):
    SEVERITY_CHOICES = [
        ("Low", "Low"),
        ("Moderate", "Moderate"),
        ("High", "High"),
        ("Critical", "Critical"),
    ]

    STATUS_CHOICES = [
        ("Open", "Open"),
        ("Investigating", "Investigating"),
        ("Resolved", "Resolved"),
    ]

    CATEGORY_CHOICES = [
        ("Theft", "Theft"),
        ("Assault", "Assault"),
        ("Vandalism", "Vandalism"),
        ("Traffic", "Traffic"),
        ("Other", "Other"),
    ]

    city = models.CharField(max_length=50, choices=UserProfile.CITY_CHOICES, default="Nairobi")
    zone = models.CharField(max_length=120)
    category = models.CharField(max_length=40, choices=CATEGORY_CHOICES, default="Other")
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES, default="Moderate")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="Open")
    latitude = models.FloatField()
    longitude = models.FloatField()
    description = models.TextField(blank=True)
    reported_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-reported_at"]

    def __str__(self):
        return f"{self.city} - {self.category} ({self.severity})"


class PlanningProject(models.Model):
    STAGE_CHOICES = [
        ("Discovery", "Discovery"),
        ("Consultation", "Consultation"),
        ("Budgeting", "Budgeting"),
        ("Execution", "Execution"),
    ]

    PRIORITY_CHOICES = [
        ("Low", "Low"),
        ("Medium", "Medium"),
        ("High", "High"),
    ]

    city = models.CharField(max_length=50, choices=UserProfile.CITY_CHOICES, default="Nairobi")
    title = models.CharField(max_length=160)
    summary = models.TextField()
    stage = models.CharField(max_length=30, choices=STAGE_CHOICES, default="Discovery")
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default="Medium")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at", "title"]

    def __str__(self):
        return f"{self.city} - {self.title}"


class GeneratedReport(models.Model):
    FOCUS_CHOICES = [
        ("safety", "Safety overview"),
        ("planning", "Planning summary"),
        ("analytics", "Analytics extract"),
    ]

    city = models.CharField(max_length=50, choices=UserProfile.CITY_CHOICES, default="Nairobi")
    title = models.CharField(max_length=180)
    focus = models.CharField(max_length=20, choices=FOCUS_CHOICES, default="safety")
    summary = models.TextField()
    generated_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name="generated_reports")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.city} - {self.title} ({self.focus})"
