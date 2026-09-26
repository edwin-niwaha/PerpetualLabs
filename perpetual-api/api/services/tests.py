from rest_framework.test import APITestCase

from .models import Service


class PublicServiceTests(APITestCase):
    def test_service_fields_match_frontend_contract(self):
        Service.objects.create(
            title="Test service",
            description="A service for contract testing.",
            icon="code",
        )
        response = self.client.get("/api/services/list/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data[0]["slug"], "test-service")
        self.assertEqual(
            response.data[0]["description"], "A service for contract testing."
        )
