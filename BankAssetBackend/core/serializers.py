from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import (
    Asset,
    AssetHistory,
    Location,
    ReconciliationSubmission,
    ThirdPartySubmission,
)

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """
    Serializer returned to the frontend. It intentionally maps the
    internal Django role choices to the lowercase enum used in the
    React app (super_admin, location_admin, employee, third_party).
    """

    role = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "role",
            "phone",
        )
        read_only_fields = ("id", "username", "role")

    def get_role(self, obj: User) -> str:
        mapping = {
            "SUPER_ADMIN": "super_admin",
            "LOCATION_ADMIN": "location_admin",
            "BANK_EMPLOYEE": "employee",
            "THIRD_PARTY_OPERATOR": "third_party",
        }
        return mapping.get(getattr(obj, "role", ""), "employee")


class LocationSerializer(serializers.ModelSerializer):
    parent_name = serializers.CharField(source="parent.name", read_only=True)
    full_path = serializers.CharField(read_only=True)

    class Meta:
        model = Location
        fields = (
            "id",
            "name",
            "level",
            "parent",
            "parent_name",
            "code",
            "is_active",
            "full_path",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("created_at", "updated_at")


class AssetSerializer(serializers.ModelSerializer):
    """
    Serializer mirrors the Asset interface used in the frontend.
    Field names follow the camelCase convention expected by React.
    """

    assetId = serializers.CharField(source="asset_id")
    serialNumber = serializers.CharField(source="serial_number", allow_blank=True)
    tagNumber = serializers.CharField(source="asset_tag")
    category = serializers.CharField()
    locationId = serializers.IntegerField(source="location.id", read_only=True)
    locationName = serializers.CharField(source="location.name", read_only=True)
    locationBreadcrumb = serializers.CharField(
        source="location_breadcrumb",
        allow_blank=True,
        required=False,
    )
    assignedTo = serializers.IntegerField(
        source="assigned_to.id",
        required=False,
        allow_null=True,
    )
    assignedToName = serializers.CharField(
        source="assigned_to.get_full_name",
        required=False,
        allow_blank=True,
    )
    status = serializers.CharField()
    reconciliationStatus = serializers.CharField(source="reconciliation_status")
    purchaseDate = serializers.DateField(
        source="purchase_date",
        allow_null=True,
        required=False,
    )
    purchaseValue = serializers.DecimalField(
        source="purchase_value",
        max_digits=12,
        decimal_places=2,
        allow_null=True,
        required=False,
    )
    imageUrl = serializers.CharField(source="image_url", allow_blank=True, required=False)
    qrCode = serializers.CharField(source="qr_code", allow_blank=True, required=False)
    lastVerified = serializers.DateTimeField(
        source="last_verified",
        allow_null=True,
        required=False,
    )

    class Meta:
        model = Asset
        fields = (
            "id",
            "assetId",
            "serialNumber",
            "tagNumber",
            "name",
            "description",
            "category",
            "location",
            "locationId",
            "locationName",
            "locationBreadcrumb",
            "assignedTo",
            "assignedToName",
            "status",
            "reconciliationStatus",
            "purchaseDate",
            "purchaseValue",
            "imageUrl",
            "qrCode",
            "lastVerified",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "locationId",
            "locationName",
            "assignedToName",
            "created_at",
            "updated_at",
        )


class AssetHistorySerializer(serializers.ModelSerializer):
    assetTag = serializers.CharField(source="asset.asset_tag", read_only=True)
    assetId = serializers.CharField(source="asset.asset_id", read_only=True)

    class Meta:
        model = AssetHistory
        fields = (
            "id",
            "asset",
            "assetId",
            "assetTag",
            "action",
            "old_location",
            "new_location",
            "old_status",
            "new_status",
            "changed_at",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("changed_at", "created_at", "updated_at")


class ReconciliationSubmissionSerializer(serializers.ModelSerializer):
    assetId = serializers.CharField(source="asset.asset_id", read_only=True)
    submittedBy = serializers.IntegerField(
        source="submitted_by.id",
        read_only=True,
    )

    class Meta:
        model = ReconciliationSubmission
        fields = (
            "id",
            "asset",
            "assetId",
            "location",
            "location_confirmed",
            "notes",
            "photo_url",
            "submittedBy",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("created_at", "updated_at", "submittedBy", "assetId")


class ThirdPartySubmissionSerializer(serializers.ModelSerializer):
    assetId = serializers.CharField(
        source="asset.asset_id",
        read_only=True,
    )
    assetName = serializers.CharField(
        source="asset_name",
        allow_blank=True,
        required=False,
    )
    serialNumber = serializers.CharField(
        source="serial_number",
        allow_blank=True,
        required=False,
    )
    assetType = serializers.CharField(
        source="asset_type",
        allow_blank=True,
        required=False,
    )
    tempRefId = serializers.CharField(
        source="temp_ref_id",
        allow_blank=True,
        required=False,
    )
    locationBreadcrumb = serializers.CharField(source="location_breadcrumb")
    locationPath = serializers.JSONField(source="location_path")
    photoUrl = serializers.CharField(source="photo_url")
    reviewNotes = serializers.CharField(
        source="review_notes",
        allow_blank=True,
        required=False,
    )
    submittedBy = serializers.IntegerField(
        source="submitted_by.id",
        read_only=True,
    )
    submittedByName = serializers.CharField(
        source="submitted_by_name",
        read_only=True,
    )
    reviewedBy = serializers.IntegerField(
        source="reviewed_by.id",
        read_only=True,
    )
    reviewedByName = serializers.CharField(
        source="reviewed_by_name",
        read_only=True,
    )
    submittedAt = serializers.DateTimeField(
        source="created_at",
        read_only=True,
    )
    reviewedAt = serializers.DateTimeField(
        source="reviewed_at",
        read_only=True,
    )

    class Meta:
        model = ThirdPartySubmission
        fields = (
            "id",
            "type",
            "asset",
            "assetId",
            "assetName",
            "serialNumber",
            "assetType",
            "tempRefId",
            "locationBreadcrumb",
            "locationPath",
            "photoUrl",
            "remarks",
            "status",
            "submittedBy",
            "submittedByName",
            "reviewedBy",
            "reviewedByName",
            "reviewNotes",
            "submittedAt",
            "reviewedAt",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "created_at",
            "updated_at",
            "submittedBy",
            "submittedByName",
            "reviewedBy",
            "reviewedByName",
            "submittedAt",
            "reviewedAt",
        )

