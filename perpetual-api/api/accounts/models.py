import logging

from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.core.exceptions import ValidationError
from django.core.mail import send_mail
from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils.html import escape

logger = logging.getLogger(__name__)


class User(AbstractUser):
    # Adding extra fields
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=50, null=True, blank=True)
    last_name = models.CharField(max_length=50, null=True, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    bio = models.TextField(null=True, blank=True)

    def __str__(self):
        return self.username


class Contact(models.Model):
    name = models.CharField(max_length=255)
    email = models.EmailField()
    user_message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Contact from {self.name}"


# Function to send email to both the user and the host
def send_contact_email(contact):
    safe_name = escape(contact.name)
    safe_message = escape(contact.user_message)
    safe_email = escape(contact.email)
    # Email to the user (Confirmation of submission)
    subject_user = f"Thank you for your contact, {contact.name}!"

    # HTML email for the user
    message_user = f"""
    <html>
        <body style="font-family: Arial, sans-serif; color: #333;">
            <h2 style="color: #4CAF50;">Hello {safe_name},</h2>
            <p>Thank you so much for reaching out to us! We’ve received your message, and our team will be reviewing it shortly. We understand how important your inquiry is, and we are committed to providing you with the best support possible.</p>
            
            <p>Here’s a copy of your message for your reference:</p>
            <blockquote style="font-style: italic; border-left: 3px solid #4CAF50; padding-left: 15px;">
                {safe_message}
            </blockquote>

            <p>Our team will get back to you as soon as possible, typically within 24–48 hours. In the meantime, if you have any urgent questions or need further assistance, please feel free to reply to this email.</p>

            <p>Thank you again for getting in touch with us. We appreciate your interest and look forward to assisting you!</p>
            
            <br>
            <p>Best regards,</p>
            <p><strong>The Support Team</strong></p>
            <p><em>Perpetual Tech</em></p>
            <p><em>Tel: +256 703-163-074</em></p>
        </body>
    </html>
    """
    from_email = settings.EMAIL_HOST_USER  # Ensure this is set in your settings.py
    recipient_user = [contact.email]  # Send the email to the user's email address

    # Email to the host (Admin notifying about new contact)
    subject_host = f"New Contact Request from {contact.name}"

    # HTML email for the host
    message_host = f"""
    <html>
        <body style="font-family: Arial, sans-serif; color: #333;">
            <h2 style="color: #FF5722;">New Contact Request from {safe_name}</h2>
            <p><strong>Name:</strong> {safe_name}</p>
            <p><strong>Email:</strong> {safe_email}</p>
            <p><strong>Message:</strong></p>
            <blockquote style="font-style: italic; border-left: 3px solid #FF5722; padding-left: 15px;">
                {safe_message}
            </blockquote>
            <p>Best regards,</p>
            <p><strong>Your Contact Form</strong></p>
        </body>
    </html>
    """
    recipient_host = [
        settings.HOST_EMAIL
    ]  # Set this in your settings.py to the host's email address

    # Send both emails (User and Host)
    send_mail(subject_user, "", from_email, recipient_user, html_message=message_user)
    send_mail(subject_host, "", from_email, recipient_host, html_message=message_host)


# Signal to send an email to both the user and the host when a new Contact is created
@receiver(post_save, sender=Contact)
def contact_post_save(sender, instance, created, **kwargs):
    if created:  # Only send email for new contact submissions
        try:
            send_contact_email(instance)
        except Exception:
            logger.exception("Failed to send contact notification email.")


# Define the positions as specified
POSITION_CHOICES = [
    ("lead_developer", "Lead Developer"),
    ("security_specialist", "Security Specialist"),
    ("ceo_founder", "CEO & Founder"),
    ("cto", "CTO"),
]


class TeamMember(models.Model):
    name = models.CharField(max_length=255)
    position = models.CharField(
        max_length=255, choices=POSITION_CHOICES, default="lead_developer"
    )
    image = models.URLField(blank=True)

    def __str__(self):
        return self.name

    def clean(self):
        if not self.name.strip():
            raise ValidationError({"name": "Name cannot be blank."})

        if not self.position.strip():
            raise ValidationError({"position": "Position cannot be blank."})

        if not self.image.startswith(("http://", "https://")):
            raise ValidationError(
                {"image": "Image URL must start with http:// or https://."}
            )
