from django.http import JsonResponse
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.db.models import Count
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

        if focus_city: profile.focus_city = focus_city
        if agency_role: profile.agency_role = agency_role
        profile.save()

        if name:
            name_parts = name.split(" ", 1)
            user.first_name = name_parts[0]
            user.last_name = name_parts[1] if len(name_parts) > 1 else ""
            user.save()

        user_data = UserSerializer(user).data
        return Response({"message": "Profile updated successfully.", "user": user_data}, status=status.HTTP_200_OK)


# ─── Spatial Endpoints (Area Analysis & Dev Planning) ─────────────────────────

class ZoneViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = ZoneSerializer
    
    def get_queryset(self):
        city = self.request.query_params.get("city")
        qs = Zone.objects.all()
        if city:
            qs = qs.filter(city=city)
        return qs

class IncidentViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = IncidentSerializer

    def get_queryset(self):
        city = self.request.query_params.get("city")
        zone_id = self.request.query_params.get("zone_id")
        qs = Incident.objects.all()
        if city:
            qs = qs.filter(city=city)
        if zone_id:
            qs = qs.filter(zone_id=zone_id)
        return qs

class PopulationDataViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = PopulationDataSerializer

    def get_queryset(self):
        zone_id = self.request.query_params.get("zone_id")
        qs = PopulationData.objects.all()
        if zone_id:
            qs = qs.filter(zone_id=zone_id)
        return qs

class InfrastructureViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = InfrastructureSerializer

    def get_queryset(self):
        city = self.request.query_params.get("city")
        qs = Infrastructure.objects.all()
        if city:
            qs = qs.filter(city=city)
        # Note: In the future, this can accept a bounding box or polygon 
        # to filter using PostGIS functions like ST_Intersects
        return qs

class PlanningProjectViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = PlanningProjectSerializer

    def get_queryset(self):
        city = self.request.query_params.get("city")
        qs = PlanningProject.objects.all()
        if city:
            qs = qs.filter(city=city)
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
            qs = qs.filter(city=city)
        return qs


def health_check(request):
    return JsonResponse({"status": "ok", "service": "backend", "db": "postgis-ready"})
