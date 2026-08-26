from django.conf import settings
from django.db import models as std_models

try:
    from django.contrib.gis.db import models as gis_models
    db_engine = getattr(settings, 'DATABASES', {}).get('default', {}).get('ENGINE', '')
    if 'postgis' in db_engine or 'spatialite' in db_engine:
        models = gis_models
    else:
        models = std_models
        models.PolygonField = std_models.TextField
except Exception:
    models = std_models
    models.PolygonField = std_models.TextField
from django.contrib.auth.models import User
from django.utils import timezone

class UserProfile(models.Model):
    CITY_CHOICES = [
        ("Nairobi", "Nairobi"),
        ("Mombasa", "Mombasa"),
        ("Eldoret", "Eldoret"),
    ]

    ROLE_CHOICES = [
        ("Urban Planner", "Urban Planner"),
        ("Law Enforcement", "Law Enforcement"),
        ("Crime Analyst", "Crime Analyst"),
        ("Researcher", "Researcher"),
        ("Administrator", "Administrator"),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    focus_city = models.CharField(max_length=50, choices=CITY_CHOICES, default="Nairobi")
    agency_role = models.CharField(max_length=50, choices=ROLE_CHOICES, default="Urban Planner")

    def __str__(self):
        return f"{self.user.username}'s profile - {self.focus_city} ({self.agency_role})"


class Zone(models.Model):
    name = models.CharField(max_length=120)
    city = models.CharField(max_length=50, choices=UserProfile.CITY_CHOICES, default="Nairobi")
    boundary = models.PolygonField(srid=4326, null=True, blank=True)

    def __str__(self):
        return f"{self.city} - {self.name}"


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
    zone = models.ForeignKey(Zone, on_delete=models.SET_NULL, null=True, blank=True, related_name="incidents")
    category = models.CharField(max_length=40, choices=CATEGORY_CHOICES, default="Other")
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES, default="Moderate")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="Open")
    
    location = models.PointField(srid=4326, null=True, blank=True)
    description = models.TextField(blank=True)
    reported_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ["-reported_at"]

    def __str__(self):
        return f"{self.city} - {self.category} ({self.severity})"


class PopulationData(models.Model):
    zone = models.ForeignKey(Zone, on_delete=models.CASCADE, related_name="population_records")
    year = models.IntegerField()
    population = models.IntegerField()
    density = models.FloatField(help_text="People per square km", null=True, blank=True)
    growth_rate = models.FloatField(help_text="Percentage growth since last record", null=True, blank=True)

    class Meta:
        ordering = ["-year"]
        unique_together = ('zone', 'year')

    def __str__(self):
        return f"{self.zone.name} - {self.year} ({self.population})"


class Infrastructure(models.Model):
    TYPE_CHOICES = [
        ("Road", "Road"),
        ("Hospital", "Hospital"),
        ("School", "School"),
        ("Power", "Power"),
        ("Water", "Water"),
        ("Other", "Other"),
    ]

    name = models.CharField(max_length=150)
    infra_type = models.CharField(max_length=50, choices=TYPE_CHOICES)
    city = models.CharField(max_length=50, choices=UserProfile.CITY_CHOICES, default="Nairobi")
    status = models.CharField(max_length=50, default="Operational")
    
    geometry = models.GeometryField(srid=4326, null=True, blank=True)

    def __str__(self):
        return f"{self.name} ({self.infra_type})"


class PlanningProject(models.Model):
    STAGE_CHOICES = [
        ("Draft", "Draft"),
        ("Review", "Under Review"),
        ("Approved", "Approved"),
        ("Rejected", "Rejected"),
    ]

    PROJECT_TYPE_CHOICES = [
        ("Road", "Road"),
        ("Hospital", "Hospital"),
        ("School", "School"),
        ("Mall", "Mall"),
        ("Residential", "Residential"),
    ]

    city = models.CharField(max_length=50, choices=UserProfile.CITY_CHOICES, default="Nairobi")
    title = models.CharField(max_length=160)
    project_type = models.CharField(max_length=50, choices=PROJECT_TYPE_CHOICES, default="Road")
    summary = models.TextField(blank=True)
    stage = models.CharField(max_length=30, choices=STAGE_CHOICES, default="Draft")
    
    footprint = models.GeometryField(srid=4326, null=True, blank=True)
    planner_notes = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at", "title"]

    def __str__(self):
        return f"{self.title} ({self.stage})"


class ImpactPrediction(models.Model):
    project = models.ForeignKey(PlanningProject, on_delete=models.CASCADE, related_name="impact_predictions")
    traffic_impact = models.CharField(max_length=100, blank=True)
    crime_risk_delta = models.CharField(max_length=100, blank=True)
    population_shift = models.CharField(max_length=100, blank=True)
    economic_activity = models.CharField(max_length=100, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Impact for {self.project.title}"


class GeneratedReport(models.Model):
    FOCUS_CHOICES = [
        ("safety", "Safety overview"),
        ("planning", "Planning summary"),
        ("analytics", "Analytics extract"),
    ]

    city = models.CharField(max_length=50, choices=UserProfile.CITY_CHOICES, default="Nairobi")
    zone = models.ForeignKey(Zone, on_delete=models.SET_NULL, null=True, blank=True)
    title = models.CharField(max_length=180)
    focus = models.CharField(max_length=20, choices=FOCUS_CHOICES, default="safety")
    summary = models.TextField()
    generated_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name="generated_reports")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.city} - {self.title} ({self.focus})"