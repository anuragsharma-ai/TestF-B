import io
from typing import Any

import qrcode
from django.core.files.base import ContentFile


def generate_qr_code_image(data: Any, filename_prefix: str = "asset") -> ContentFile:
    """
    Generate a QR code PNG image for the given data and return a ContentFile.
    """
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=10,
        border=4,
    )
    qr.add_data(data)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    buffer.seek(0)
    return ContentFile(buffer.read(), name=f"{filename_prefix}.png")

