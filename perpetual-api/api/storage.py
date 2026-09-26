"""Use existing Cloudinary storage with a finite upload wait."""

import os

import cloudinary.uploader
from cloudinary_storage.storage import MediaCloudinaryStorage


class BoundedMediaCloudinaryStorage(MediaCloudinaryStorage):
    def _upload(self, name, content):
        options = {
            "use_filename": True,
            "resource_type": self._get_resource_type(name),
            "tags": self.TAG,
            "timeout": 15,
        }
        folder = os.path.dirname(name)
        if folder:
            options["folder"] = folder
        return cloudinary.uploader.upload(content, **options)
