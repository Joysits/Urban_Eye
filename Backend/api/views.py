from django.http import JsonResponse
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.db.models import Count
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.authtoken.models import Token
from .models import GeneratedReport, Incident, PlanningProject, UserProfile
from .serializers import (
    GeneratedReportSerializer,
    IncidentSerializer,
    PasswordResetSerializer,
    PlanningProjectSerializer,
    RegisterSerializer,
    ReportGenerateSerializer,
    UserSerializer,
)

# ─── City demographic base data for predictions ───────────────────────────────
# (Kept to provide baseline projections when DB data is sparse)
CITY_DEMOGRAPHICS = {
    "Nairobi": {
        "population": 4_920_000,
        "growth_rate": 3.2,           # % per year (KNBS)
        "projection_years": 10,
        "housing_deficit_ratio": 0.18, # 18% of population lacks adequate housing
        "base_crime_rate": 42,         # baseline index 0-100
        "infrastructure_pressure": "Critical",
    },
    "Mombasa": {
        "population": 1_208_000,
        "growth_rate": 2.8,
        "projection_years": 10,
        "housing_deficit_ratio": 0.14,
        "base_crime_rate": 35,
        "infrastructure_pressure": "High",
    },
    "Eldoret": {
        "population": 508_000,
        "growth_rate": 2.5,
        "projection_years": 10,
        "housing_deficit_ratio": 0.10,
        "base_crime_rate": 28,
        "infrastructure_pressure": "Moderate",
    },
}


# ─── Shared Helpers ───────────────────────────────────────────────────────────

def _get_user_profile(user):
    profile, _ = UserProfile.objects.get_or_create(
        user=user,
        defaults={
            "focus_city": UserProfile.CITY_CHOICES[0][0],
            "agency_role": UserProfile.ROLE_CHOICES[0][0],
        },
    )
    return profile


def _resolve_city_and_zone(request):
    profile = _get_user_profile(request.user)
    city = request.query_params.get("city") or profile.focus_city
    valid_cities = {choice[0] for choice in UserProfile.CITY_CHOICES}
    if city not in valid_cities:
        city = profile.focus_city
        
    zone = request.query_params.get("zone")
    if zone == "All Zones":
        zone = None
        
    return city, zone


def _growth_pressure(projects_qs):
    high_priority_count = projects_qs.filter(priority="High", is_active=True).count()
    if high_priority_count >= 3: return "High"
    if high_priority_count >= 2: return "Moderate"
    return "Low"


def _build_overview(city, zone=None):
    incidents = Incident.objects.filter(city=city)
    projects  = PlanningProject.objects.filter(city=city, is_active=True)
    
    if zone:
        incidents = incidents.filter(zone=zone)

    open_incidents  = incidents.exclude(status="Resolved")
    critical_count  = incidents.filter(severity="Critical").count()
    active_alerts   = open_incidents.count()
    
    # If no incidents at all, we return graceful defaults
    if incidents.count() == 0:
        return {
            "city": city,
            "risk_score": 0,
            "active_alerts": 0,
            "growth_pressure": _growth_pressure(projects),
            "priority_zones": 0,
            "top_priorities": ["Awaiting Data"],
            "incident_markers": [],
        }
        
    priority_zones  = incidents.values("zone").distinct().count()
    risk_score      = min(100, 25 + (active_alerts * 8) + (critical_count * 10))

    top_priorities = ["Incident monitoring", "Growth planning", "Reporting"]
    project_priority_titles = list(projects.filter(priority="High").values_list("title", flat=True)[:2])
    if project_priority_titles:
        top_priorities = project_priority_titles + top_priorities

    markers = [
        {
            "id": inc.id,
            "title": f"{inc.zone}: {inc.category}",
            "severity": inc.severity,
            "status": inc.status,
            "latitude": inc.latitude,
            "longitude": inc.longitude,
        }
        for inc in incidents[:12]
    ]

    return {
        "city": city,
        "risk_score": risk_score,
        "active_alerts": active_alerts,
        "growth_pressure": _growth_pressure(projects),
        "priority_zones": priority_zones,
        "top_priorities": top_priorities[:3],
        "incident_markers": markers,
    }


# ─── Utility Endpoint ─────────────────────────────────────────────────────────

def health_check(request):
    return JsonResponse({"status": "ok", "service": "backend"})


# ─── Auth Views ───────────────────────────────────────────────────────────────

class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            token, created = Token.objects.get_or_create(user=user)
            user_data = UserSerializer(user).data
            return Response({
                "message": "User registered successfully",
                "token": token.key,
                "user": user_data
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username_or_email = request.data.get("username") or request.data.get("email")
        password = request.data.get("password")

        if not username_or_email or not password:
            return Response({"error": "Please provide username/email and password."}, status=status.HTTP_400_BAD_REQUEST)

        username = username_or_email
        if "@" in username_or_email:
            user_obj = User.objects.filter(email__iexact=username_or_email).order_by("id").first()
            if user_obj is None:
                return Response({"error": "Invalid credentials. User not found."}, status=status.HTTP_401_UNAUTHORIZED)
            username = user_obj.username

        user = authenticate(username=username, password=password)

        if user is not None:
            if not user.is_active:
                return Response({"error": "This account has been deactivated."}, status=status.HTTP_403_FORBIDDEN)
            token, created = Token.objects.get_or_create(user=user)
            user_data = UserSerializer(user).data
            return Response({"token": token.key, "user": user_data}, status=status.HTTP_200_OK)
        else:
            return Response({"error": "Invalid email/username or password."}, status=status.HTTP_401_UNAUTHORIZED)


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            request.user.auth_token.delete()
            return Response({"message": "Successfully logged out."}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class PasswordResetView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        email    = serializer.validated_data["email"]
        password = serializer.validated_data["password"]

        user = User.objects.filter(email__iexact=email).order_by("id").first()
        if user is None:
            return Response({"error": "No user exists with this email address."}, status=status.HTTP_404_NOT_FOUND)
        user.set_password(password)
        user.save(update_fields=["password"])

        Token.objects.filter(user=user).delete()
        token, _ = Token.objects.get_or_create(user=user)

        return Response({
            "message": "Password reset successfully.",
            "token": token.key,
            "user": UserSerializer(user).data,
        }, status=status.HTTP_200_OK)


class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user_data = UserSerializer(request.user).data
        return Response(user_data, status=status.HTTP_200_OK)

    def patch(self, request):
        user    = request.user
        profile = getattr(user, "profile", None)

        if profile is None:
            from .models import UserProfile
            profile, _ = UserProfile.objects.get_or_create(
                user=user,
                defaults={
                    "focus_city": UserProfile.CITY_CHOICES[0][0],
                    "agency_role": UserProfile.ROLE_CHOICES[0][0],
                },
            )

        focus_city  = request.data.get("focus_city")
        agency_role = request.data.get("agency_role")
        name        = request.data.get("name")

        if focus_city:  profile.focus_city  = focus_city
        if agency_role: profile.agency_role = agency_role
        profile.save()

        if name:
            name_parts = name.split(" ", 1)
            user.first_name = name_parts[0]
            user.last_name  = name_parts[1] if len(name_parts) > 1 else ""
            user.save()

        user_data = UserSerializer(user).data
        return Response({"message": "Profile updated successfully.", "user": user_data}, status=status.HTTP_200_OK)


# ─── Dashboard Views ──────────────────────────────────────────────────────────

class DashboardOverviewView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        city, zone = _resolve_city_and_zone(request)
        overview = _build_overview(city, zone)
        
        # Grab first incident to get a timestamp
        incidents = Incident.objects.filter(city=city)
        if zone: incidents = incidents.filter(zone=zone)
        
        first_incident = incidents.first()
        overview["updated_at"] = first_incident.reported_at.isoformat() if first_incident else None
        overview["recent_incidents"] = IncidentSerializer(incidents[:5], many=True).data
        return Response(overview, status=status.HTTP_200_OK)


class DashboardAnalysisView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        city, zone = _resolve_city_and_zone(request)
        incidents = Incident.objects.filter(city=city)
        if zone: incidents = incidents.filter(zone=zone)
            
        overview  = _build_overview(city, zone)

        severity_data = incidents.values("severity").annotate(total=Count("id"))
        severity_map  = {row["severity"]: row["total"] for row in severity_data}
        labels        = [choice[0] for choice in Incident.SEVERITY_CHOICES]
        values        = [severity_map.get(label, 0) for label in labels]

        return Response({
            "city":             city,
            "risk_score":       overview["risk_score"],
            "active_alerts":    overview["active_alerts"],
            "growth_pressure":  overview["growth_pressure"],
            "priority_zones":   overview["priority_zones"],
            "risk_distribution": {"labels": labels, "values": values},
            "recent_incidents": IncidentSerializer(incidents[:8], many=True).data,
        }, status=status.HTTP_200_OK)


class DashboardPlanningView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        city, _ = _resolve_city_and_zone(request)
        # Projects are city-wide for now
        projects = PlanningProject.objects.filter(city=city)
        stage_counts = {
            stage[0]: projects.filter(stage=stage[0]).count()
            for stage in PlanningProject.STAGE_CHOICES
        }
        return Response({
            "city":         city,
            "projects":     PlanningProjectSerializer(projects, many=True).data,
            "stage_counts": stage_counts,
        }, status=status.HTTP_200_OK)


class DashboardReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        city, zone = _resolve_city_and_zone(request)
        reports = GeneratedReport.objects.filter(city=city)
        return Response({"city": city, "reports": GeneratedReportSerializer(reports, many=True).data}, status=status.HTTP_200_OK)

    def post(self, request):
        city, zone = _resolve_city_and_zone(request)

        serializer = ReportGenerateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        title   = serializer.validated_data["title"]
        focus   = serializer.validated_data["focus"]
        overview = _build_overview(city, zone)

        summary = (
            f"{city} {f'({zone}) ' if zone else ''}{focus} brief: risk score {overview['risk_score']}/100, "
            f"{overview['active_alerts']} active alerts, "
            f"growth pressure {overview['growth_pressure']}, "
            f"{overview['priority_zones']} priority zones identified."
        )

        report = GeneratedReport.objects.create(
            city=city, title=title, focus=focus,
            summary=summary, generated_by=request.user,
        )
        return Response({
            "message": "Report generated successfully.",
            "report":  GeneratedReportSerializer(report).data,
        }, status=status.HTTP_201_CREATED)


# ─── AI Prediction Views ──────────────────────────────────────────────────────

class PredictPopulationView(APIView):
    """
    AI Population Growth Prediction.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        city, zone = _resolve_city_and_zone(request)
        demo = CITY_DEMOGRAPHICS.get(city, CITY_DEMOGRAPHICS["Nairobi"])

        # If a specific zone is selected, we scale down the population arbitrarily for demonstration
        # since we don't have zone-specific demographic data in the base models yet.
        zone_multiplier = 0.15 if zone else 1.0

        current_pop = int(demo["population"] * zone_multiplier)
        growth_rate = demo["growth_rate"]           # % per year
        years       = demo["projection_years"]
        deficit_r   = demo["housing_deficit_ratio"]

        projected_pop = int(round(current_pop * ((1 + growth_rate / 100) ** years)))
        housing_gap   = int(round(projected_pop * deficit_r))

        density_trend = [
            {
                "year": 2025 + i * 2,
                "population": int(round(current_pop * ((1 + growth_rate / 100) ** (i * 2))))
            }
            for i in range(6)
        ]

        return Response({
            "city":                   city,
            "current_population":     current_pop,
            "projected_population":   projected_pop,
            "growth_rate_pct":        growth_rate,
            "housing_gap":            housing_gap,
            "infrastructure_pressure": demo["infrastructure_pressure"],
            "year_range":             f"{2025 + years}",
            "density_trend":          density_trend,
        }, status=status.HTTP_200_OK)


class PredictCrimeView(APIView):
    """
    AI Crime Prediction Engine based on DB data.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        city, zone = _resolve_city_and_zone(request)
        demo      = CITY_DEMOGRAPHICS.get(city, CITY_DEMOGRAPHICS["Nairobi"])
        incidents = Incident.objects.filter(city=city)
        if zone:
            incidents = incidents.filter(zone=zone)
            
        total = incidents.count()

        if total == 0:
            return Response({
                "city": city,
                "risk_index": 0,
                "predicted_hotspot_zone": "None (Awaiting Data)",
                "top_category": "N/A",
                "forecast_30_day": "Awaiting incident data.",
                "confidence_pct": 0,
                "category_breakdown": [],
                "trend": "Unknown"
            }, status=status.HTTP_200_OK)

        open_incidents   = incidents.exclude(status="Resolved")
        critical_count   = incidents.filter(severity="Critical").count()
        open_ratio       = open_incidents.count() / total
        critical_ratio   = critical_count / total

        base_rate  = demo["base_crime_rate"]
        risk_index = min(100, int(round(
            base_rate + (open_ratio * 40) + (critical_ratio * 30)
        )))

        hotspot_qs = (
            open_incidents
            .values("zone")
            .annotate(count=Count("id"))
            .order_by("-count")
            .first()
        )
        predicted_hotspot = hotspot_qs["zone"] if hotspot_qs else (zone or "CBD")

        top_cat_qs = (
            incidents
            .values("category")
            .annotate(count=Count("id"))
            .order_by("-count")
            .first()
        )
        top_category = top_cat_qs["category"] if top_cat_qs else "N/A"

        cat_data = (
            incidents
            .values("category")
            .annotate(count=Count("id"))
            .order_by("-count")
        )
        category_breakdown = [
            {
                "category": row["category"],
                "count":    row["count"],
                "pct":      int(round((row["count"] / total) * 100)),
            }
            for row in cat_data
        ]

        confidence_pct = min(95, 55 + total * 4)

        resolved_ratio = incidents.filter(status="Resolved").count() / total
        if resolved_ratio > 0.5:
            trend, forecast = "Declining", "Stable — resolution rate above 50%"
        elif open_ratio > 0.7:
            trend, forecast = "Escalating", "Alert — high open incident ratio"
        else:
            trend, forecast = "Stable", "Moderate risk — monitor hotspot zones"

        return Response({
            "city":                  city,
            "risk_index":            risk_index,
            "predicted_hotspot_zone": predicted_hotspot,
            "top_category":          top_category,
            "forecast_30_day":       forecast,
            "confidence_pct":        confidence_pct,
            "category_breakdown":    category_breakdown,
            "trend":                 trend,
        }, status=status.HTTP_200_OK)


class PredictImpactView(APIView):
    """
    AI Infrastructure Impact Prediction based on DB projects.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        city, _ = _resolve_city_and_zone(request)
        projects          = PlanningProject.objects.filter(city=city, is_active=True)
        projects_analyzed = projects.count()

        if projects_analyzed == 0:
            return Response({
                "city":                 city,
                "impact_score":         0,
                "risk_reduction_pct":   0,
                "roi_estimate":         "N/A",
                "projects_analyzed":    0,
                "execution_readiness":  "None",
                "highlights":           ["No active planning projects found. Import data to see predictions."],
            }, status=status.HTTP_200_OK)

        STAGE_WEIGHTS = {"Discovery": 1, "Consultation": 2, "Budgeting": 3, "Execution": 4}
        PRIORITY_WEIGHTS = {"Low": 1, "Medium": 2, "High": 3}

        total_weight  = 0
        max_weight    = projects_analyzed * (4 * 3)

        for p in projects:
            sw = STAGE_WEIGHTS.get(p.stage, 1)
            pw = PRIORITY_WEIGHTS.get(p.priority, 1)
            total_weight += sw * pw

        impact_score = min(100, int(round((total_weight / max_weight) * 100))) if max_weight > 0 else 0

        high_exec = projects.filter(stage="Execution", priority="High").count()
        risk_reduction_pct = min(60, high_exec * 18 + impact_score // 5)

        roi_value = round(0.8 + (impact_score * 0.035), 1)
        roi_estimate = f"Kshs {roi_value}B projected return"

        exec_count = projects.filter(stage="Execution").count()
        if exec_count >= 2:
            readiness = "High"
        elif exec_count == 1:
            readiness = "Moderate"
        else:
            readiness = "Early"

        highlights = []
        if projects.filter(priority="High").exists():
            high_titles = list(projects.filter(priority="High").values_list("title", flat=True)[:2])
            highlights.append(f"High-priority projects active: {', '.join(high_titles)}.")
        highlights.append(f"{exec_count} project(s) currently in Execution stage.")
        highlights.append(f"Estimated {risk_reduction_pct}% incident risk reduction with full delivery.")
        highlights.append(f"Impact model confidence: {min(95, 60 + projects_analyzed * 5)}%.")

        return Response({
            "city":                city,
            "impact_score":        impact_score,
            "risk_reduction_pct":  risk_reduction_pct,
            "roi_estimate":        roi_estimate,
            "projects_analyzed":   projects_analyzed,
            "execution_readiness": readiness,
            "highlights":          highlights,
        }, status=status.HTTP_200_OK)
