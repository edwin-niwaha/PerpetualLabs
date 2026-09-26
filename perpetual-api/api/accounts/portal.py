"""Client-owned portal data; no email-address based account linking."""

from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import serializers
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Contact, EmailDelivery, PortalNotification, PortalService


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = PortalNotification
        fields = ["id", "title", "body", "read_at", "created_at"]


class DeliverySerializer(serializers.ModelSerializer):
    class Meta:
        model = EmailDelivery
        fields = ["id", "subject", "body", "status", "created_at"]


class InquirySerializer(serializers.ModelSerializer):
    class Meta:
        model = Contact
        fields = ["id", "user_message", "created_at"]


class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = PortalService
        fields = ["id", "title", "description", "status"]


class PortalView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        notifications = PortalNotification.objects.filter(user=request.user)
        return Response(
            {
                "unread_count": notifications.filter(read_at__isnull=True).count(),
                "notifications": NotificationSerializer(
                    notifications[:50], many=True
                ).data,
                "emails": DeliverySerializer(
                    EmailDelivery.objects.filter(user=request.user, audience="client")[
                        :50
                    ],
                    many=True,
                ).data,
                "inquiries": InquirySerializer(
                    Contact.objects.filter(user=request.user).order_by("-created_at")[
                        :50
                    ],
                    many=True,
                ).data,
                "services": ServiceSerializer(
                    PortalService.objects.filter(is_published=True)[:50], many=True
                ).data,
            },
            headers={"Cache-Control": "private, no-store"},
        )


class ReadNotificationView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        class Input(serializers.Serializer):
            read = serializers.BooleanField()

        payload = Input(data=request.data)
        payload.is_valid(raise_exception=True)
        notification = get_object_or_404(PortalNotification, pk=pk, user=request.user)
        notification.read_at = (
            timezone.now() if payload.validated_data["read"] else None
        )
        notification.save(update_fields=["read_at"])
        return Response(NotificationSerializer(notification).data)
