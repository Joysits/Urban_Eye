from django.http import JsonResponse
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.authtoken.models import Token
from .serializers import RegisterSerializer, UserSerializer

def health_check(request):
    return JsonResponse({"status": "ok", "service": "backend"})

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

        # Handle logging in with either username or email
        username = username_or_email
        if "@" in username_or_email:
            try:
                user_obj = User.objects.get(email__iexact=username_or_email)
                username = user_obj.username
            except User.DoesNotExist:
                return Response({"error": "Invalid credentials. User not found."}, status=status.HTTP_401_UNAUTHORIZED)

        user = authenticate(username=username, password=password)

        if user is not None:
            if not user.is_active:
                return Response({"error": "This account has been deactivated."}, status=status.HTTP_403_FORBIDDEN)
            
            token, created = Token.objects.get_or_create(user=user)
            user_data = UserSerializer(user).data
            return Response({
                "token": token.key,
                "user": user_data
            }, status=status.HTTP_200_OK)
        else:
            return Response({"error": "Invalid email/username or password."}, status=status.HTTP_401_UNAUTHORIZED)

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            # Delete token to sign out
            request.user.auth_token.delete()
            return Response({"message": "Successfully logged out."}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Fetch current user profile details
        user_data = UserSerializer(request.user).data
        return Response(user_data, status=status.HTTP_200_OK)

    def patch(self, request):
        # Allow user to update their city or role on the fly
        user = request.user
        profile = getattr(user, "profile", None)
        
        if not profile:
            return Response({"error": "User profile not found."}, status=status.HTTP_404_NOT_FOUND)

        focus_city = request.data.get("focus_city")
        agency_role = request.data.get("agency_role")
        name = request.data.get("name")

        if focus_city:
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
        return Response({
            "message": "Profile updated successfully.",
            "user": user_data
        }, status=status.HTTP_200_OK)
