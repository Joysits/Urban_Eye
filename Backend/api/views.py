from datetime import timedelta
from django.http import JsonResponse
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.db.models import Count, Sum, Avg, Q
from django.db.models.functions import TruncMonth
from django.contrib.gis.geos import Point
from django.contrib.gis.measure import D
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.authtoken.models import Token

from .models import (
    GeneratedReport, Incident, PlanningProject, UserProfile,
    Zone, PopulationData, Infrastructure, ImpactPrediction
)
from .serializers import (
    GeneratedReportSerializer,
    IncidentSerializer,
    PasswordResetSerializer,
    PlanningProjectSerializer,
    RegisterSerializer,
    ReportGenerateSerializer,
    UserSerializer,
    ZoneSerializer,
    PopulationDataSerializer,
    InfrastructureSerializer,
    ImpactPredictionSerializer
)

# ─── Auth Views ───────────────────────────────────────────────────────────────

class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            token, _ = Token.objects.get_or_create(user=user)
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
            user_obj = User.objects.filter(email__iexact=username_or_email).first()
            if user_obj is None:
                return Response({"error": "Invalid credentials. User not found."}, status=status.HTTP_401_UNAUTHORIZED)
            username = user_obj.username

        user = authenticate(username=username, password=password)

        if user is not None:
            if not user.is_active:
                return Response({"error": "This account has been deactivated."}, status=status.HTTP_403_FORBIDDEN)
            token, _ = Token.objects.get_or_create(user=user)
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

        email = serializer.validated_data["email"]
        password = serializer.validated_data["password"]

        user = User.objects.filter(email__iexact=email).first()
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
        user = request.user
        profile = getattr(user, "profile", None)

        if profile is None:
            profile, _ = UserProfile.objects.get_or_create(
                user=user,
                defaults={
                    "focus_city": UserProfile.CITY_CHOICES[0][0],
                    "agency_role": UserProfile.ROLE_CHOICES[0][0],
                },
            )

        focus_city = request.data.get("focus_city")
        agency_role = request.data.get("agency_role")
        name = request.data.get("name")

        if focus_city and focus_city in ["Nairobi", "Mombasa", "Eldoret"]:
            profile.focus_city = focus_city
        if agency_role: 
            profile.agency_role = agency_role
        profile.save()

        if name:
            name_parts = name.split(" ", 1)
            user.first_name = name_parts[0]
            user.last_name = name_parts[1] if len(name_parts) > 1 else ""
            user.save()

        user_data = UserSerializer(user).data
        return Response({"message": "Profile updated successfully.", "user": user_data}, status=status.HTTP_200_OK)


# ─── Area Analysis Specialized View ──────────────────────────────────────────

class AreaAnalysisDetailView(APIView):
    """
    API endpoint for Area Analysis mode.
    Calculates incident breakdowns, infrastructure summaries, population info,
    and a dynamic risk score for Nairobi, Mombasa, or Eldoret.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        ALLOWED_CITIES = ["Nairobi", "Mombasa", "Eldoret"]
        city = request.query_params.get("city", "Nairobi")
        
        # Match case-insensitively to allowed list, otherwise default to Nairobi
        matched_city = next((c for c in ALLOWED_CITIES if c.lower() == city.lower()), "Nairobi")
        city = matched_city
        
        zone_id = request.query_params.get("zone_id")

        try:
            # 1. Fetch Zones belonging to this city
            city_zones = Zone.objects.filter(city__iexact=city)

            # 2. Query Incidents
            incidents_qs = Incident.objects.all()
            if hasattr(Incident, 'city'):
                incidents_qs = incidents_qs.filter(Q(city__iexact=city) | Q(zone__in=city_zones))
            else:
                incidents_qs = incidents_qs.filter(zone__in=city_zones)

            # 3. Query Infrastructure
            infra_qs = Infrastructure.objects.all()
            if hasattr(Infrastructure, 'city'):
                infra_qs = infra_qs.filter(Q(city__iexact=city) | Q(zone__in=city_zones))
            else:
                infra_qs = infra_qs.filter(zone__in=city_zones)
            
            selected_zone = None
            if zone_id and zone_id.isdigit():
                incidents_qs = incidents_qs.filter(zone_id=zone_id)
                infra_qs = infra_qs.filter(zone_id=zone_id)
                selected_zone = Zone.objects.filter(id=zone_id).first()

            # 4. Crime & Infrastructure Aggregations
            crime_breakdown = list(
                incidents_qs.values("category")
                .annotate(count=Count("id"))
                .order_by("-count")
            )

            infra_breakdown = list(
                infra_qs.values("infra_type")
                .annotate(count=Count("id"))
                .order_by("-count")
            )

            total_incidents = incidents_qs.count()
            high_severity = incidents_qs.filter(severity__iexact="high").count()
            medium_severity = incidents_qs.filter(severity__iexact="moderate").count()
            
            weighted_score = (high_severity * 5) + (medium_severity * 2) + (total_incidents * 0.5)
            risk_score = min(100, round(weighted_score, 1))

            # 5. Population Processing
            pop_data = None
            if selected_zone:
                pop_record = PopulationData.objects.filter(zone=selected_zone).order_by("-year").first()
                if pop_record:
                    pop_data = {
                        "total_population": getattr(pop_record, "population", 0),
                        "density": getattr(pop_record, "density", 0),
                        "growth_rate": getattr(pop_record, "growth_rate", 0)
                    }
            else:
                city_pop = PopulationData.objects.filter(zone__in=city_zones).order_by("-year").aggregate(
                    total=Sum("population"),
                    avg_density=Avg("density"),
                    avg_growth=Avg("growth_rate")
                )
                if city_pop.get("total") is not None:
                    pop_data = {
                        "total_population": city_pop["total"],
                        "density": round(city_pop["avg_density"], 1) if city_pop["avg_density"] else 0,
                        "growth_rate": round(city_pop["avg_growth"], 2) if city_pop["avg_growth"] else 0
                    }

            # 6. Safely Serialize Recent Incidents
            recent_incidents = []
            try:
                # Ordering check
                if hasattr(Incident, 'created_at'):
                    recent_qs = incidents_qs.order_by("-created_at")[:10]
                elif hasattr(Incident, 'date'):
                    recent_qs = incidents_qs.order_by("-date")[:10]
                else:
                    recent_qs = incidents_qs[:10]
                recent_incidents = IncidentSerializer(recent_qs, many=True).data
            except Exception:
                recent_incidents = []

            return Response({
                "city": city,
                "zone_id": zone_id,
                "zone_name": selected_zone.name if selected_zone else f"All Zones ({city})",
                "risk_score": risk_score,
                "total_incidents": total_incidents,
                "crime_breakdown": crime_breakdown,
                "infrastructure_summary": infra_breakdown,
                "population_info": pop_data,
                "recent_incidents": recent_incidents
            }, status=status.HTTP_200_OK)

        except Exception as e:
            # Defensive fallback to ensure 500 error is never thrown
            return Response({
                "city": city,
                "zone_id": zone_id,
                "zone_name": f"{city} General Area",
                "risk_score": 0,
                "total_incidents": 0,
                "crime_breakdown": [],
                "infrastructure_summary": [],
                "population_info": {
                    "total_population": 0,
                    "density": 0,
                    "growth_rate": 0
                },
                "recent_incidents": [],
                "error_detail": str(e)
            }, status=status.HTTP_200_OK)


# ─── Spatial Endpoints (Area Analysis & Dev Planning) ─────────────────────────

class ZoneViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = ZoneSerializer
    
    def get_queryset(self):
        city = self.request.query_params.get("city")
        qs = Zone.objects.all()
        if city:
            qs = qs.filter(city__iexact=city)
        return qs


class IncidentViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = IncidentSerializer

    def get_queryset(self):
        city = self.request.query_params.get("city")
        zone_id = self.request.query_params.get("zone_id")
        qs = Incident.objects.all()
        if city:
            if hasattr(Incident, 'city'):
                qs = qs.filter(city__iexact=city)
            else:
                qs = qs.filter(zone__city__iexact=city)
        if zone_id:
            qs = qs.filter(zone_id=zone_id)
        return qs


class PopulationDataViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = PopulationDataSerializer

    def get_queryset(self):
        zone_id = self.request.query_params.get("zone_id")
        city = self.request.query_params.get("city")
        qs = PopulationData.objects.all()
        if zone_id:
            qs = qs.filter(zone_id=zone_id)
        elif city:
            qs = qs.filter(zone__city__iexact=city)
        return qs


class InfrastructureViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = InfrastructureSerializer

    def get_queryset(self):
        city = self.request.query_params.get("city")
        qs = Infrastructure.objects.all()
        if city:
            if hasattr(Infrastructure, 'city'):
                qs = qs.filter(city__iexact=city)
            else:
                qs = qs.filter(zone__city__iexact=city)
        return qs


class PlanningProjectViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = PlanningProjectSerializer

    def get_queryset(self):
        city = self.request.query_params.get("city")
        qs = PlanningProject.objects.all()
        if city:
            if hasattr(PlanningProject, 'city'):
                qs = qs.filter(city__iexact=city)
            else:
                qs = qs.filter(zone__city__iexact=city)
        return qs


class ImpactPredictionViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = ImpactPredictionSerializer
    queryset = ImpactPrediction.objects.all()


class GeneratedReportViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = GeneratedReportSerializer
    
    def get_queryset(self):
        city = self.request.query_params.get("city")
        qs = GeneratedReport.objects.all()
        if city:
            if hasattr(GeneratedReport, 'city'):
                qs = qs.filter(city__iexact=city)
            else:
                qs = qs.filter(zone__city__iexact=city)
        return qs


# ─── Crime Trend View ─────────────────────────────────────────────────────────

class CrimeTrendView(APIView):
    """
    GET /api/analysis/crime-trend/?city=&zone_id=&months=6
    Returns monthly incident counts by category for the last N months.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        ALLOWED_CITIES = ["Nairobi", "Mombasa", "Eldoret"]
        city = request.query_params.get("city", "Nairobi")
        city = next((c for c in ALLOWED_CITIES if c.lower() == city.lower()), "Nairobi")
        zone_id = request.query_params.get("zone_id")
        months = min(int(request.query_params.get("months", 6)), 24)

        try:
            from django.utils import timezone
            end_date = timezone.now()
            start_date = end_date - timedelta(days=months * 30)

            city_zones = Zone.objects.filter(city__iexact=city)
            qs = Incident.objects.filter(
                reported_at__gte=start_date,
                reported_at__lte=end_date,
            )
            if zone_id and zone_id.isdigit():
                qs = qs.filter(zone_id=zone_id)
            else:
                qs = qs.filter(zone__in=city_zones)

            monthly = (
                qs
                .annotate(month=TruncMonth("reported_at"))
                .values("month", "category")
                .annotate(count=Count("id"))
                .order_by("month", "category")
            )

            # Build a clean list of {month, category, count}
            data = [
                {
                    "month": row["month"].strftime("%Y-%m") if row["month"] else None,
                    "category": row["category"],
                    "count": row["count"],
                }
                for row in monthly
            ]

            # Also build month-level totals
            month_totals = {}
            for row in data:
                m = row["month"]
                month_totals[m] = month_totals.get(m, 0) + row["count"]

            return Response({
                "city": city,
                "zone_id": zone_id,
                "months": months,
                "trend": data,
                "month_totals": [
                    {"month": k, "total": v}
                    for k, v in sorted(month_totals.items())
                ],
            })
        except Exception as e:
            return Response({
                "city": city,
                "months": months,
                "trend": [],
                "month_totals": [],
                "error": str(e),
            })


# ─── Infrastructure Nearby View ────────────────────────────────────────────────

class InfrastructureNearbyView(APIView):
    """
    GET /api/analysis/infrastructure-nearby/?city=&lat=&lng=&radius_km=5
    Returns infrastructure counts grouped by type within radius of a point.
    Falls back to city-level counts if no coordinates provided.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        ALLOWED_CITIES = ["Nairobi", "Mombasa", "Eldoret"]
        city = request.query_params.get("city", "Nairobi")
        city = next((c for c in ALLOWED_CITIES if c.lower() == city.lower()), "Nairobi")
        lat = request.query_params.get("lat")
        lng = request.query_params.get("lng")
        radius_km = float(request.query_params.get("radius_km", 5))
        zone_id = request.query_params.get("zone_id")

        try:
            qs = Infrastructure.objects.filter(city__iexact=city)

            if zone_id and zone_id.isdigit():
                qs = qs.filter(zone_id=zone_id)
            elif lat and lng:
                try:
                    point = Point(float(lng), float(lat), srid=4326)
                    qs = qs.filter(geometry__distance_lte=(point, D(km=radius_km)))
                except Exception:
                    pass  # fallback to city-level

            breakdown = list(
                qs.values("infra_type")
                .annotate(count=Count("id"))
                .order_by("-count")
            )

            return Response({
                "city": city,
                "radius_km": radius_km,
                "total": sum(b["count"] for b in breakdown),
                "infrastructure": breakdown,
            })
        except Exception as e:
            return Response({
                "city": city,
                "radius_km": radius_km,
                "total": 0,
                "infrastructure": [],
                "error": str(e),
            })


# ─── Generate Report From Area Intelligence ────────────────────────────────────

class GenerateReportFromAnalysisView(APIView):
    """
    POST /api/analysis/generate-report/
    Saves the current Area Intelligence view as a GeneratedReport.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        city = request.data.get("city", "Nairobi")
        zone_id = request.data.get("zone_id")
        zone_name = request.data.get("zone_name", "General Area")
        risk_score = request.data.get("risk_score", 0)
        crime_breakdown = request.data.get("crime_breakdown", [])
        infra_summary = request.data.get("infrastructure_summary", [])
        population_info = request.data.get("population_info", {})
        comparison_zone = request.data.get("comparison_zone_name", "")

        zone = None
        if zone_id:
            try:
                zone = Zone.objects.get(id=int(zone_id))
            except (Zone.DoesNotExist, ValueError):
                pass

        # Build rich text summary
        lines = [
            f"=== AREA INTELLIGENCE REPORT ===",
            f"Zone: {zone_name}  |  City: {city}",
            f"Risk / Suitability Score: {risk_score}/100",
            "",
            "--- CRIME BREAKDOWN ---",
        ]
        for item in crime_breakdown:
            lines.append(f"  {item.get('category', '?')}: {item.get('count', 0)} incidents")

        lines += ["", "--- INFRASTRUCTURE SUMMARY ---"]
        for item in infra_summary:
            lines.append(f"  {item.get('type') or item.get('infra_type', '?')}: {item.get('count', 0)}")

        if population_info:
            lines += [
                "",
                "--- POPULATION ---",
                f"  Total: {population_info.get('total_population', 'N/A')}",
                f"  Density: {population_info.get('density', 'N/A')} /km\u00b2",
                f"  Growth Rate: {population_info.get('growth_rate', 'N/A')}%",
            ]

        if comparison_zone:
            lines += ["", f"--- COMPARED AGAINST: {comparison_zone} ---"]

        summary = "\n".join(lines)
        title = f"Area Intelligence: {zone_name} ({city})"

        # Clamp city to valid choices
        ALLOWED_CITIES = ["Nairobi", "Mombasa", "Eldoret"]
        city = next((c for c in ALLOWED_CITIES if c.lower() == city.lower()), "Nairobi")

        try:
            report = GeneratedReport.objects.create(
                city=city,
                zone=zone,
                title=title,
                focus="analytics",
                summary=summary,
                generated_by=request.user,
            )
            return Response({
                "id": report.id,
                "title": report.title,
                "created_at": report.created_at,
                "message": "Report saved successfully.",
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


def health_check(request):
    return JsonResponse({"status": "ok", "service": "backend", "db": "postgis-ready"})