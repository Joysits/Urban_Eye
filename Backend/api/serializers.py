from rest_framework import serializers
from django.contrib.auth.models import User
from .models import UserProfile

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ["focus_city", "agency_role"]

class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)
    name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "email", "name", "profile"]

    def get_name(self, obj):
        if obj.first_name or obj.last_name:
            return f"{obj.first_name} {obj.last_name}".strip()
        return obj.username

class RegisterSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=150, required=True)
    email = serializers.EmailField(required=True)
    city = serializers.ChoiceField(choices=UserProfile.CITY_CHOICES, default="Nairobi")
    role = serializers.ChoiceField(choices=UserProfile.ROLE_CHOICES, default="Urban Planner")
    password = serializers.CharField(min_length=6, write_only=True, required=True)
    
    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value.lower()

    def create(self, validated_data):
        email = validated_data["email"]
        
        # Derive username from email and make sure it is unique
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

        UserProfile.objects.create(
            user=user,
            focus_city=validated_data["city"],
            agency_role=validated_data["role"]
        )

        return user
