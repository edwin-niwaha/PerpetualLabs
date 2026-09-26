"""Liveness probe; intentionally exposes no database or environment details."""

from django.http import JsonResponse
from django.views.decorators.http import require_safe


@require_safe
def health(request):
    response = JsonResponse({"status": "ok"})
    response["Cache-Control"] = "no-store"
    return response
