from rest_framework import serializers
from django.contrib.auth.models import User
try:
    from rest_framework_gis.serializers import GeoFeatureModelSerializer
except Exception:
    GeoFeatureModelSerializer = serializers.ModelSerializer
from .models import (
    GeneratedReport, Incident, PlanningProject, UserProfile,
    Zone, PopulationData, Infrastructure, ImpactPrediction
)

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ["focus_city", "agency_role"]

class UserSerializer(serializers.ModelSerializer):
    profile = serializers.SerializerMethodField()
    name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "email", "name", "profile"]

    def get_name(self, obj):
        if obj.first_name or obj.last_name:
            return f"{obj.first_name} {obj.last_name}".strip()
        return obj.username

    def get_profile(self, obj):
        profile, _ = UserProfile.objects.get_or_create(
            user=obj,
            defaults={
                "focus_city": UserProfile.CITY_CHOICES[0][0],
                "agency_role": UserProfile.ROLE_CHOICES[0][0],
            },
        )
        return UserProfileSerializer(profile).data

class RegisterSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=150, required=True)
    email = serializers.EmailField(required=True)
    city = serializers.ChoiceField(choices=UserProfile.CITY_CHOICES, default="Nairobi")
    role = serializers.ChoiceField(choices=UserProfile.ROLE_CHOICES, default="Urban Planner")
    password = serializers.CharField(min_length=8, write_only=True, required=True)
    
    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value.lower()

    def create(self, validated_data):
        email = validated_data["email"]
        
        username = email.split("@")[0]
        base_username = username
        counter = 1
        while User.objects.filter(username__iexact=username).exists():
            username = f"{base_username}{counter}"
            counter += 1

        name_parts = validated_data["name"].split(" ", 1)
        first_name = name_parts[0]
        last_name = name_parts[1] if len(name_parts) > 1 else ""

        user = User.objects.create_user(
            username=username,
            email=email,
            password=validated_data["password"],
            first_name=first_name,
            last_name=last_name
        )

        UserProfile.objects.update_or_create(
            user=user,
            defaults={
                "focus_city": validated_data["city"],
                "agency_role": validated_data["role"]
            }
        )

        return user

class PasswordResetSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(min_length=8, write_only=True, required=True)
    confirm_password = serializers.CharField(min_length=8, write_only=True, required=True)

    def validate_email(self, value):
        if not User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("No user exists with this email address.")
        return value.lower()

    def validate(self, attrs):
        if attrs["password"] != attrs["confirm_password"]:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        return attrs

# Spatial Serializers
class ZoneSerializer(GeoFeatureModelSerializer):
    class Meta:
        model = Zone
        geo_field = "boundary"
        fields = ["id", "name", "city"]

class IncidentSerializer(GeoFeatureModelSerializer):
    class Meta:
        model = Incident
        geo_field = "location"
        fields = ["id", "city", "zone", "category", "severity", "status", "description", "reported_at"]

class PopulationDataSerializer(serializers.ModelSerializer):
    zone_name = serializers.CharField(source="zone.name", read_only=True)

    class Meta:
        model = PopulationData
        fields = ["id", "zone", "zone_name", "year", "population", "density", "growth_rate"]

class InfrastructureSerializer(GeoFeatureModelSerializer):
    class Meta:
        model = Infrastructure
        geo_field = "geometry"
        fields = ["id", "name", "infra_type", "city", "status"]

class ImpactPredictionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ImpactPrediction
        fields = ["id", "traffic_impact", "crime_risk_delta", "population_shift", "economic_activity", "created_at"]

class PlanningProjectSerializer(GeoFeatureModelSerializer):
    impact_predictions = ImpactPredictionSerializer(many=True, read_only=True)

    class Meta:
        model = PlanningProject
        geo_field = "footprint"
        fields = [
            "id", "city", "title", "project_type", "summary", "stage",
            "planner_notes", "created_at", "updated_at", "impact_predictions"
        ]

class GeneratedReportSerializer(serializers.ModelSerializer):
    generated_by_name = serializers.SerializerMethodField()
    zone_name = serializers.CharField(source="zone.name", read_only=True)

    class Meta:
        model = GeneratedReport
        fields = [
            "id", "city", "zone", "zone_name", "title", "focus", "summary",
            "generated_by", "generated_by_name", "created_at",
        ]
        read_only_fields = ["generated_by", "generated_by_name", "created_at"]

    def get_generated_by_name(self, obj):
        if obj.generated_by.first_name or obj.generated_by.last_name:
            return f"{obj.generated_by.first_name} {obj.generated_by.last_name}".strip()
        return obj.generated_by.username

class ReportGenerateSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=180, required=True)
    focus = serializers.ChoiceField(choices=GeneratedReport.FOCUS_CHOICES, default="safety")
    zone_id = serializers.IntegerField(required=False, allow_null=True)
