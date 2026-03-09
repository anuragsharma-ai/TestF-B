from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView

from .models import (
    Asset,
    AssetHistory,
    Location,
    ReconciliationSubmission,
    ThirdPartySubmission,
)
from .permissions import (
    IsLocationAdminOrAbove,
    ReadOnlyForLowerRoles,
    RoleBasedAccessPermission,
)
from .serializers import (
    AssetHistorySerializer,
    AssetSerializer,
    LocationSerializer,
    ReconciliationSubmissionSerializer,
    ThirdPartySubmissionSerializer,
    UserSerializer,
)

User = get_user_model()


class LocationViewSet(viewsets.ModelViewSet):
    queryset = Location.objects.all().select_related("parent")
    serializer_class = LocationSerializer
    permission_classes = [RoleBasedAccessPermission]
    filterset_fields = ["level", "parent", "is_active"]
    search_fields = ["name", "code"]
    ordering_fields = ["name", "level"]


class AssetViewSet(viewsets.ModelViewSet):
    queryset = Asset.objects.all().select_related("location", "assigned_to")
    serializer_class = AssetSerializer
    permission_classes = [RoleBasedAccessPermission]
    filterset_fields = ["status", "location", "location__level", "reconciliation_status"]
    search_fields = ["name", "asset_id", "asset_tag", "description"]
    ordering_fields = ["created_at", "name", "asset_id", "asset_tag"]

    def perform_create(self, serializer):
        asset = serializer.save()
        AssetHistory.objects.create(
            asset=asset,
            action="CREATED",
            new_status=asset.status,
            new_location=asset.location,
        )

    def perform_update(self, serializer):
        asset = self.get_object()
        old_status = asset.status
        old_location = asset.location

        asset = serializer.save()

        action = "UPDATED"
        old_status_val = None
        new_status_val = None
        old_location_val = None
        new_location_val = None

        if old_status != asset.status:
            action = "STATUS_CHANGED"
            old_status_val = old_status
            new_status_val = asset.status

        if (old_location and asset.location and old_location.id != asset.location.id) or (
            (old_location is None) != (asset.location is None)
        ):
            action = "MOVED"
            old_location_val = old_location
            new_location_val = asset.location

        AssetHistory.objects.create(
            asset=asset,
            action=action,
            old_status=old_status_val,
            new_status=new_status_val,
            old_location=old_location_val,
            new_location=new_location_val,
        )

    @action(detail=True, methods=["get"])
    def history(self, request, pk=None):
        asset = self.get_object()
        qs = asset.history.all().order_by("-changed_at")
        page = self.paginate_queryset(qs)
        serializer = AssetHistorySerializer(page, many=True)
        return self.get_paginated_response(serializer.data)


class AssetBulkUploadView(APIView):
    """
    Accepts a CSV/Excel file and responds with a simple confirmation.
    Parsing and row-level validation can be added later.
    """

    permission_classes = [RoleBasedAccessPermission]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, *args, **kwargs):
        upload = request.FILES.get("file")
        if not upload:
            return Response(
                {"detail": "No file uploaded."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {
                "detail": "File received.",
                "filename": upload.name,
                "size": upload.size,
            }
        )


class ReconciliationSubmissionViewSet(viewsets.ModelViewSet):
    queryset = ReconciliationSubmission.objects.all().select_related(
        "asset", "location", "submitted_by"
    )
    serializer_class = ReconciliationSubmissionSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        submission = serializer.save(submitted_by=self.request.user)
        AssetHistory.objects.create(
            asset=submission.asset,
            action="RECONCILED",
            new_location=submission.location,
            new_status=submission.asset.status,
        )


class ThirdPartySubmissionViewSet(viewsets.ModelViewSet):
    queryset = ThirdPartySubmission.objects.all().select_related(
        "submitted_by", "reviewed_by", "asset"
    )
    serializer_class = ThirdPartySubmissionSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["status", "type"]
    search_fields = ["asset_name", "asset__asset_id", "temp_ref_id"]
    ordering_fields = ["created_at", "updated_at"]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        # Third-party operators only see their own submissions; admins/managers see all.
        if getattr(user, "role", "") == "THIRD_PARTY_OPERATOR":
            return qs.filter(submitted_by=user)
        return qs

    def perform_create(self, serializer):
        user = self.request.user
        name = user.get_full_name() or user.get_username()
        serializer.save(submitted_by=user, submitted_by_name=name)

    @action(detail=True, methods=["post"], permission_classes=[IsLocationAdminOrAbove])
    def approve(self, request, pk=None):
        submission = self.get_object()
        submission.status = "approved"
        submission.review_notes = request.data.get("reviewNotes", "")
        submission.reviewed_by = request.user
        submission.reviewed_by_name = request.user.get_full_name() or request.user.get_username()
        submission.reviewed_at = timezone.now()
        submission.save(update_fields=["status", "review_notes", "reviewed_by", "reviewed_by_name", "reviewed_at"])
        return Response(ThirdPartySubmissionSerializer(submission).data)

    @action(detail=True, methods=["post"], permission_classes=[IsLocationAdminOrAbove])
    def reject(self, request, pk=None):
        submission = self.get_object()
        submission.status = "rejected"
        submission.review_notes = request.data.get("reviewNotes", "")
        submission.reviewed_by = request.user
        submission.reviewed_by_name = request.user.get_full_name() or request.user.get_username()
        submission.reviewed_at = timezone.now()
        submission.save(update_fields=["status", "review_notes", "reviewed_by", "reviewed_by_name", "reviewed_at"])
        return Response(ThirdPartySubmissionSerializer(submission).data)

    @action(
        detail=True,
        methods=["post"],
        permission_classes=[IsLocationAdminOrAbove],
        url_path="request-correction",
    )
    def request_correction(self, request, pk=None):
        submission = self.get_object()
        submission.status = "correction_requested"
        submission.review_notes = request.data.get("reviewNotes", "")
        submission.reviewed_by = request.user
        submission.reviewed_by_name = request.user.get_full_name() or request.user.get_username()
        submission.reviewed_at = timezone.now()
        submission.save(update_fields=["status", "review_notes", "reviewed_by", "reviewed_by_name", "reviewed_at"])
        return Response(ThirdPartySubmissionSerializer(submission).data)


# -------------------------
# Auth & JWT endpoints
# -------------------------


class SendOtpView(APIView):
    """
    Demo OTP sender. In a real system this would send an email/SMS.
    Here we simply validate that the email belongs to a known user.
    """

    permission_classes = []

    def post(self, request, *args, **kwargs):
        email = request.data.get("email")
        if not email:
            return Response({"detail": "Email is required."}, status=status.HTTP_400_BAD_REQUEST)

        # Create or fetch demo users on the fly based on email.
        role_by_email = {
            "admin@bank.com": "SUPER_ADMIN",
            "branch@bank.com": "LOCATION_ADMIN",
            "employee@bank.com": "BANK_EMPLOYEE",
            "operator@vendor.com": "THIRD_PARTY_OPERATOR",
        }
        defaults = {"username": email.split("@")[0], "role": role_by_email.get(email, "BANK_EMPLOYEE")}
        User.objects.get_or_create(email=email, defaults=defaults)

        # In demo mode we always "send" OTP 123456
        return Response({"detail": "OTP sent."})


class VerifyOtpLoginView(APIView):
    """
    Accepts email + OTP and returns a JWT pair and user payload.
    For this demo implementation, OTP is always 123456.
    """

    permission_classes = []

    def post(self, request, *args, **kwargs):
        email = request.data.get("email")
        otp = request.data.get("otp")
        if not email or not otp:
            return Response(
                {"detail": "Email and OTP are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        role_by_email = {
            "admin@bank.com": "SUPER_ADMIN",
            "branch@bank.com": "LOCATION_ADMIN",
            "employee@bank.com": "BANK_EMPLOYEE",
            "operator@vendor.com": "THIRD_PARTY_OPERATOR",
        }
        defaults = {"username": email.split("@")[0], "role": role_by_email.get(email, "BANK_EMPLOYEE")}
        user, _ = User.objects.get_or_create(email=email, defaults=defaults)

        if otp != "123456":
            return Response({"detail": "Invalid OTP."}, status=status.HTTP_400_BAD_REQUEST)

        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)
        refresh_token = str(refresh)

        user_data = UserSerializer(user).data
        return Response(
            {
                "access": access_token,
                "refresh": refresh_token,
                "user": user_data,
            }
        )


class LogoutView(APIView):
    """
    Simple logout endpoint. Clients should discard tokens; we do not
    persist refresh tokens server-side in this demo.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        return Response(status=status.HTTP_204_NO_CONTENT)


class MeView(APIView):
    """
    Returns the authenticated user's profile.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        return Response(UserSerializer(request.user).data)


# Re-export SimpleJWT refresh view so urls.py can wire it at /auth/refresh
JwtRefreshView = TokenRefreshView

