from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    AssetBulkUploadView,
    AssetViewSet,
    JwtRefreshView,
    LocationViewSet,
    MeView,
    ReconciliationSubmissionViewSet,
    SendOtpView,
    ThirdPartySubmissionViewSet,
    VerifyOtpLoginView,
    LogoutView,
)

router = DefaultRouter()
router.register(r"assets", AssetViewSet, basename="asset")
router.register(r"locations", LocationViewSet, basename="location")
router.register(
    r"reconciliation/submissions",
    ReconciliationSubmissionViewSet,
    basename="reconciliation-submission",
)
router.register(
    r"third-party/submissions",
    ThirdPartySubmissionViewSet,
    basename="third-party-submission",
)

urlpatterns = [
    # Core CRUD APIs
    path("", include(router.urls)),
    path("assets/upload/", AssetBulkUploadView.as_view(), name="asset-bulk-upload"),
    # Auth + JWT
    path("auth/send-otp", SendOtpView.as_view(), name="auth-send-otp"),
    path("auth/verify-otp", VerifyOtpLoginView.as_view(), name="auth-verify-otp"),
    path("auth/login", VerifyOtpLoginView.as_view(), name="auth-login"),
    path("auth/refresh", JwtRefreshView.as_view(), name="auth-refresh"),
    path("auth/logout", LogoutView.as_view(), name="auth-logout"),
    path("auth/me", MeView.as_view(), name="auth-me"),
]
