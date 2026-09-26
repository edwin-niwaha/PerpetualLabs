import uuid
import warnings
from io import BytesIO

from django.core.files.base import ContentFile
from PIL import Image
from rest_framework import serializers


class RasterImageField(serializers.ImageField):
    def to_internal_value(self, data):
        if getattr(data, "size", 0) > 4 * 1024 * 1024:
            self.fail("invalid_image")
        data = super().to_internal_value(data)
        try:
            with warnings.catch_warnings():
                warnings.simplefilter("error", Image.DecompressionBombWarning)
                with Image.open(data) as image:
                    if (
                        image.format not in {"JPEG", "PNG", "WEBP"}
                        or image.width * image.height > 16000000
                    ):
                        raise ValueError("Unsupported image")
                    image.load()
                    output = BytesIO()
                    image.convert("RGBA" if "A" in image.getbands() else "RGB").save(
                        output, format="WEBP"
                    )
            return ContentFile(output.getvalue(), name=f"{uuid.uuid4().hex}.webp")
        except (
            ValueError,
            OSError,
            Image.DecompressionBombError,
            Image.DecompressionBombWarning,
        ):
            self.fail("invalid_image")
