from django.urls import path
from .views import (
    DashboardAnalysisView,
    DashboardOverviewView,
    DashboardPlanningView,
    DashboardReportView,
    LoginView,
    LogoutView,
    PasswordResetView,
    PredictCrimeView,
    PredictImpactView,
    PredictPopulationView,
    RegisterView,
    UserProfileView,
    health_check,
)

urlpatterns = [
    # Utility
    path("health/", health_check, name="health_check"),

    # Auth
    path("auth/register/",       RegisterView.as_view(),      name="auth_register"),
    path("auth/login/",          LoginView.as_view(),          name="auth_login"),
    path("auth/logout/",         LogoutView.as_view(),         name="auth_logout"),
    path("auth/profile/",        UserProfileView.as_view(),    name="auth_profile"),
    path("auth/password-reset/", PasswordResetView.as_view(),  name="auth_password_reset"),

    # Dashboard
    path("dashboard/overview/",  DashboardOverviewView.as_view(),  name="dashboard_overview"),
    path("dashboard/analysis/",  DashboardAnalysisView.as_view(),  name="dashboard_analysis"),
    path("dashboard/planning/",  DashboardPlanningView.as_view(),  name="dashboard_planning"),
    path("dashboard/reports/",   DashboardReportView.as_view(),    name="dashboard_reports"),

    # AI Predictions
    path("predict/population/",  PredictPopulationView.as_view(), name="predict_population"),
    path("predict/crime/",       PredictCrimeView.as_view(),      name="predict_crime"),
    path("predict/impact/",      PredictImpactView.as_view(),     name="predict_impact"),
]
