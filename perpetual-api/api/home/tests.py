from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from .models import FAQ, Feature, PageSection


class WebsiteContentTests(APITestCase):
    def setUp(self):
        self.staff = get_user_model().objects.create_user(
            username="content-admin",
            email="admin@example.test",
            password="Test-content-482!",
            is_staff=True,
        )
        self.member = get_user_model().objects.create_user(
            username="content-member",
            email="member@example.test",
            password="Test-content-482!",
        )

    def test_public_snapshot_filters_drafts_and_keeps_empty_collections_empty(self):
        FAQ.objects.all().delete()
        Feature.objects.all().delete()
        draft = FAQ.objects.create(
            question="Private question", answer="Private answer", is_published=False
        )
        Feature.objects.create(
            group="values",
            title="Private value",
            description="Draft",
            is_published=False,
        )
        response = self.client.get("/api/content/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["faqs"], [])
        self.assertEqual(response.data["features"], [])
        self.assertEqual(
            self.client.get(f"/api/content/faqs/{draft.pk}/").status_code, 404
        )
        self.client.force_authenticate(self.staff)
        self.assertEqual(
            self.client.get(f"/api/content/faqs/{draft.pk}/").status_code, 200
        )
        self.assertEqual(self.client.get("/api/content/").data["faqs"], [])

    def test_only_staff_can_write_every_content_type(self):
        section = PageSection.objects.first()
        faq = FAQ.objects.create(question="Editable", answer="Answer")
        feature = Feature.objects.create(
            group="values", title="Value", description="Description"
        )
        cases = [
            ("settings/", {"location": "Updated location"}),
            (f"sections/{section.pk}/", {"title": "Updated title"}),
            (f"faqs/{faq.pk}/", {"answer": "Updated answer"}),
            (f"features/{feature.pk}/", {"title": "Updated value"}),
        ]
        for suffix, payload in cases:
            path = "/api/content/" + suffix
            self.client.force_authenticate(None)
            self.assertEqual(
                self.client.patch(path, payload, format="json").status_code, 401
            )
            self.client.force_authenticate(self.member)
            self.assertEqual(
                self.client.patch(path, payload, format="json").status_code, 403
            )
            self.client.force_authenticate(self.staff)
            self.assertEqual(
                self.client.patch(path, payload, format="json").status_code, 200
            )
        self.client.force_authenticate(None)
        self.assertEqual(
            self.client.get("/api/content/").data["settings"]["location"],
            "Updated location",
        )

    def test_staff_create_order_publish_and_delete(self):
        FAQ.objects.all().delete()
        self.client.force_authenticate(self.staff)
        second = self.client.post(
            "/api/content/faqs/",
            {"question": "Second", "answer": "Answer", "sort_order": 2},
            format="json",
        )
        first = self.client.post(
            "/api/content/faqs/",
            {"question": "First", "answer": "Answer", "sort_order": 1},
            format="json",
        )
        self.assertEqual(first.status_code, 201)
        self.assertEqual(second.status_code, 201)
        self.assertEqual(
            [
                item["question"]
                for item in self.client.get("/api/content/").data["faqs"]
            ],
            ["First", "Second"],
        )
        path = f'/api/content/faqs/{first.data["id"]}/'
        self.client.patch(path, {"is_published": False}, format="json")
        self.assertEqual(len(self.client.get("/api/content/").data["faqs"]), 1)
        self.assertEqual(self.client.delete(path).status_code, 204)

    def test_validation_and_profile_cannot_grant_staff_access(self):
        self.client.force_authenticate(self.staff)
        self.assertEqual(
            self.client.patch(
                "/api/content/settings/",
                {"whatsapp": "javascript:alert(1)"},
                format="json",
            ).status_code,
            400,
        )
        self.assertEqual(
            self.client.patch(
                "/api/content/settings/", {"founded": "year"}, format="json"
            ).status_code,
            400,
        )
        self.assertEqual(
            self.client.post(
                "/api/content/faqs/", {"question": "", "answer": ""}, format="json"
            ).status_code,
            400,
        )
        section = PageSection.objects.first()
        self.assertEqual(
            self.client.patch(
                f"/api/content/sections/{section.pk}/", {"key": "other"}, format="json"
            ).status_code,
            400,
        )
        self.client.force_authenticate(self.member)
        response = self.client.patch(
            "/api/auth/profile/", {"is_staff": True}, format="json"
        )
        self.assertFalse(response.data["is_staff"])
        self.member.refresh_from_db()
        self.assertFalse(self.member.is_staff)
