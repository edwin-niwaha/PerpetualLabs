"""Shared publication visibility for editable website content."""

from rest_framework.viewsets import ModelViewSet

from .permissions import StaffWritePermission


class PublishedContentViewSet(ModelViewSet):
    permission_classes = [StaffWritePermission]

    def get_queryset(self):
        queryset = super().get_queryset()
        if not self.request.user.is_staff:
            queryset = queryset.filter(is_published=True)
        return queryset
