from datetime import timedelta
from unittest.mock import patch
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.test import override_settings
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import AccessToken
from .models import Contact

User = get_user_model()


@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
class AccountFlowTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.user = User.objects.create_user(username="original", email="original@example.test", password="Long-Original-Password!72")

    def test_registration_hashes_password_and_does_not_expose_it(self):
        response = self.client.post("/api/auth/register/", {"username": "newperson", "email": "new@example.test", "password": "Long-New-Password!93"})
        self.assertEqual(response.status_code, 201)
        self.assertNotIn("password", response.data)
        self.assertTrue(User.objects.get(username="newperson").check_password("Long-New-Password!93"))

    def test_weak_and_duplicate_credentials_rejected(self):
        payload = {"username": "newperson", "email": "new@example.test", "password": "12345678"}
        self.assertEqual(self.client.post("/api/auth/register/", payload).status_code, 400)
        payload.update(username="original", password="Long-New-Password!93")
        self.assertEqual(self.client.post("/api/auth/register/", payload).status_code, 400)

    def test_anonymous_and_expired_token_cannot_read_profile(self):
        self.assertEqual(self.client.get("/api/auth/profile/").status_code, 401)
        token = AccessToken.for_user(self.user)
        token.set_exp(lifetime=timedelta(seconds=-1))
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(self.client.get("/api/auth/profile/").status_code, 401)

    def test_login_refresh_and_profile_isolation(self):
        other = User.objects.create_user(username="other", email="other@example.test", password="Long-Other-Password!25")
        invalid = self.client.post("/api/auth/login/", {"username": "original", "password": "incorrect"})
        self.assertEqual(invalid.status_code, 401)
        login = self.client.post("/api/auth/login/", {"username": "original", "password": "Long-Original-Password!72"})
        self.assertEqual(login.status_code, 200)
        refreshed = self.client.post("/api/token/refresh/", {"refresh": login.data["refresh"]})
        self.assertEqual(refreshed.status_code, 200)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {refreshed.data['access']}")
        response = self.client.patch("/api/auth/profile/", {"id": other.id, "first_name": "Updated", "is_staff": True, "email": "hijack@example.test"}, format="json")
        self.assertEqual(response.status_code, 200)
        self.user.refresh_from_db()
        other.refresh_from_db()
        self.assertEqual(self.user.first_name, "Updated")
        self.assertEqual(self.user.email, "original@example.test")
        self.assertFalse(self.user.is_staff)
        self.assertNotEqual(other.first_name, "Updated")

    @patch("api.accounts.models.send_contact_email")
    def test_contact_validation_and_private_records(self, send_email):
        invalid = self.client.post("/api/auth/contacts/", {"name": "Person", "email": "bad", "user_message": "short"})
        self.assertEqual(invalid.status_code, 400)
        valid = self.client.post("/api/auth/contacts/", {"name": "Person", "email": "person@example.test", "user_message": "I would like to discuss a project."})
        self.assertEqual(valid.status_code, 201)
        self.assertEqual(Contact.objects.count(), 1)
        send_email.assert_called_once()
        contact_id = valid.data["data"]["id"]
        self.assertEqual(self.client.get("/api/auth/contacts/").status_code, 401)
        self.client.force_authenticate(self.user)
        self.assertEqual(self.client.get(f"/api/auth/contacts/{contact_id}/").status_code, 403)
        self.assertEqual(self.client.delete(f"/api/auth/contacts/{contact_id}/").status_code, 403)
        self.assertEqual(Contact.objects.count(), 1)

    @patch("api.accounts.models.send_contact_email")
    def test_contact_throttle(self, send_email):
        for index in range(10):
            response = self.client.post("/api/auth/contacts/", {"name": "Person", "email": "person@example.test", "user_message": f"Project inquiry number {index}"})
            self.assertEqual(response.status_code, 201)
        self.assertEqual(self.client.post("/api/auth/contacts/", {}).status_code, 429)

    def test_contact_email_escapes_untrusted_html(self):
        from django.core import mail
        Contact.objects.create(name="<b>Test</b>", email="person@example.test", user_message="<img src=x onerror=alert(1)>")
        self.assertEqual(len(mail.outbox), 2)
        for message in mail.outbox:
            html = message.alternatives[0][0]
            self.assertNotIn("<b>Test</b>", html)
            self.assertNotIn("<img src=x", html)
            self.assertIn("&lt;b&gt;Test&lt;/b&gt;", html)
            self.assertIn("&lt;img src=x", html)
