from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    LoginView,
    LogoutView,
    PasswordResetView,
    RegisterView,
    UserProfileView,
    ZoneViewSet,
    IncidentViewSet,
    PopulationDataViewSet,
    InfrastructureViewSet,
    PlanningProjectViewSet,
    ImpactPredictionViewSet,
    GeneratedReportViewSet,
    health_check,
)

router = DefaultRouter()
router.register(r'zones', ZoneViewSet, basename='zone')
router.register(r'incidents', IncidentViewSet, basename='incident')
router.register(r'population', PopulationDataViewSet, basename='population')
router.register(r'infrastructure', InfrastructureViewSet, basename='infrastructure')
router.register(r'projects', PlanningProjectViewSet, basename='project')
router.register(r'impact-predictions', ImpactPredictionViewSet, basename='impact-prediction')
router.register(r'reports', GeneratedReportViewSet, basename='report')

urlpatterns = [
    # Utility
    path("health/", health_check, name="health_check"),

    # Auth
    path("auth/register/",       RegisterView.as_view(),      name="auth_register"),
    path("auth/login/",          LoginView.as_view(),          name="auth_login"),
    path("auth/logout/",         LogoutView.as_view(),         name="auth_logout"),
    path("auth/profile/",        UserProfileView.as_view(),    name="auth_profile"),
    path("auth/password-reset/", PasswordResetView.as_view(),  name="auth_password_reset"),

    # Spatial API endpoints
    path("", include(router.urls)),
]
