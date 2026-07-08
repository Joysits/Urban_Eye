from django.urls import path
from .views import health_check, RegisterView, LoginView, LogoutView, UserProfileView

urlpatterns = [
    path("health/", health_check, name="health_check"),
    path("auth/register/", RegisterView.as_view(), name="auth_register"),
    path("auth/login/", LoginView.as_view(), name="auth_login"),
    path("auth/logout/", LogoutView.as_view(), name="auth_logout"),
    path("auth/profile/", UserProfileView.as_view(), name="auth_profile"),
]
