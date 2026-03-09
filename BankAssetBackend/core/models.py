from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone


class TimeStampedModel(models.Model):
    """
    Base model that adds created_at and updated_at timestamps so every
    persisted entity has a consistent audit trail.
    """

    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True)

    class Meta:
        abstract = True


# -------------------------
# Custom User Model
# -------------------------


class User(AbstractUser, TimeStampedModel):
    ROLE_CHOICES = [
        ("SUPER_ADMIN", "Super Admin"),
        ("LOCATION_ADMIN", "Location Admin"),
        ("BANK_EMPLOYEE", "Bank Employee"),
        ("THIRD_PARTY_OPERATOR", "Third Party Operator"),
    ]

    role = models.CharField(
        max_length=50,
        choices=ROLE_CHOICES,
        default="THIRD_PARTY_OPERATOR",
    )
    phone = models.CharField(max_length=20, blank=True, null=True)

    def __str__(self) -> str:
        return self.username


# -------------------------
# Location Hierarchy
# -------------------------


class Location(TimeStampedModel):
    LEVEL_CHOICES = [
        ("COMPANY", "Company"),
        ("COUNTRY", "Country"),
        ("REGION", "Region"),
        ("ZONE", "Zone"),
        ("SITE", "Site"),
        ("ENTITY", "Entity"),
        ("BUILDING", "Building"),
        ("WING", "Wing"),
        ("AREA", "Area"),
        ("FLOOR", "Floor"),
        ("UNIT", "Unit"),
        ("ROOM", "Room"),
    ]

    name = models.CharField(max_length=255)
    level = models.CharField(max_length=50, choices=LEVEL_CHOICES)
    parent = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="children",
    )
    code = models.CharField(max_length=50, blank=True, null=True)
    is_active = models.BooleanField(default=True)

    def __str__(self) -> str:
        return f"{self.name} ({self.level})"

    @property
    def full_path(self) -> str:
        parts = [self.name]
        p = self.parent
        while p:
            parts.append(p.name)
            p = p.parent
        return " / ".join(reversed(parts))


# -------------------------
# Asset Model
# -------------------------


class Asset(TimeStampedModel):
    STATUS_CHOICES = [
        ("active", "Active"),
        ("in_transit", "In Transit"),
        ("pending_verification", "Pending Verification"),
        ("missing", "Missing"),
        ("disposed", "Disposed"),
    ]

    RECON_STATUS_CHOICES = [
        ("verified", "Verified"),
        ("pending", "Pending"),
        ("discrepancy", "Discrepancy"),
    ]

    # Core identifiers
    asset_id = models.CharField(max_length=100, unique=True, null=True, blank=True)
    serial_number = models.CharField(max_length=100, blank=True)
    asset_tag = models.CharField(max_length=100, unique=True, null=True, blank=True)

    # Descriptive metadata
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    category = models.CharField(max_length=100, blank=True)

    # Location & ownership
    location = models.ForeignKey(
        Location,
        on_delete=models.SET_NULL,
        null=True,
        related_name="assets",
    )
    location_breadcrumb = models.TextField(blank=True)
    assigned_to = models.ForeignKey(
        "User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assets",
    )

    # Status
    status = models.CharField(
        max_length=32,
        choices=STATUS_CHOICES,
        default="active",
    )
    reconciliation_status = models.CharField(
        max_length=32,
        choices=RECON_STATUS_CHOICES,
        default="pending",
    )

    # Financials
    purchase_date = models.DateField(null=True, blank=True)
    purchase_value = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
    )

    # Media / QR
    image_url = models.URLField(blank=True)
    qr_code = models.CharField(max_length=255, blank=True)
    last_verified = models.DateTimeField(null=True, blank=True)

    def __str__(self) -> str:
        return f"{self.asset_id} - {self.name}"


# -------------------------
# Asset History
# -------------------------


class AssetHistory(TimeStampedModel):
    ACTION_CHOICES = [
        ("CREATED", "Created"),
        ("UPDATED", "Updated"),
        ("MOVED", "Moved"),
        ("STATUS_CHANGED", "Status Changed"),
        ("RECONCILED", "Reconciled"),
    ]

    asset = models.ForeignKey(
        Asset,
        on_delete=models.CASCADE,
        related_name="history",
    )
    action = models.CharField(max_length=50, choices=ACTION_CHOICES)

    old_location = models.ForeignKey(
        Location,
        related_name="old_location",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    new_location = models.ForeignKey(
        Location,
        related_name="new_location",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )

    old_status = models.CharField(max_length=50, blank=True, null=True)
    new_status = models.CharField(max_length=50, blank=True, null=True)

    changed_at = models.DateTimeField(default=timezone.now)

    def __str__(self) -> str:
        return f"{self.asset.name} - {self.action}"


# -------------------------
# Reconciliation Submission
# -------------------------


class ReconciliationSubmission(TimeStampedModel):
    """
    Employee reconciliation submissions for existing assets.
    """

    asset = models.ForeignKey(
        Asset,
        on_delete=models.CASCADE,
        related_name="reconciliation_submissions",
    )
    location = models.ForeignKey(
        Location,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reconciliation_submissions",
    )
    location_confirmed = models.BooleanField(default=True)
    notes = models.TextField(blank=True)
    photo_url = models.URLField(blank=True)
    submitted_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reconciliation_submissions",
    )

    def __str__(self) -> str:
        return f"Reconciliation for {self.asset.asset_id}"


# -------------------------
# Third-Party Submissions
# -------------------------


class ThirdPartySubmission(TimeStampedModel):
    """
    Submissions from third-party operators, either verifying existing
    assets or proposing new assets to be created.
    """

    TYPE_CHOICES = [
        ("verification", "Verification"),
        ("new_asset", "New Asset"),
    ]

    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("approved", "Approved"),
        ("rejected", "Rejected"),
        ("correction_requested", "Correction Requested"),
    ]

    type = models.CharField(max_length=32, choices=TYPE_CHOICES)

    # Existing asset verification
    asset = models.ForeignKey(
        Asset,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="third_party_submissions",
    )
    asset_name = models.CharField(max_length=255, blank=True)
    serial_number = models.CharField(max_length=100, blank=True)
    asset_type = models.CharField(max_length=100, blank=True)

    # New asset temporary reference
    temp_ref_id = models.CharField(max_length=100, blank=True)

    # Location details (breadcrumb plus structured path)
    location_breadcrumb = models.TextField()
    location_path = models.JSONField(default=dict)

    # Evidence & remarks
    photo_url = models.URLField()
    remarks = models.TextField(blank=True)

    status = models.CharField(
        max_length=32,
        choices=STATUS_CHOICES,
        default="pending",
    )

    submitted_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="submitted_third_party_items",
    )
    submitted_by_name = models.CharField(max_length=255, blank=True)

    reviewed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reviewed_third_party_items",
    )
    reviewed_by_name = models.CharField(max_length=255, blank=True)
    review_notes = models.TextField(blank=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self) -> str:
        return f"{self.get_type_display()} - {self.status}"

