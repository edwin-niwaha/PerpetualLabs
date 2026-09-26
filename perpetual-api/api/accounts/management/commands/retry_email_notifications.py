from django.core.management.base import BaseCommand, CommandError

from api.accounts.models import Contact, EmailDelivery
from api.notifications import send_contact_email, send_delivery


class Command(BaseCommand):
    help = "Retry a specific contact's notifications or one saved delivery. Accepted messages are not resent."

    def add_arguments(self, parser):
        group = parser.add_mutually_exclusive_group(required=True)
        group.add_argument("--contact-id", type=int)
        group.add_argument("--delivery-id", type=int)

    def handle(self, *args, **options):
        if options["contact_id"]:
            try:
                contact = Contact.objects.get(pk=options["contact_id"])
            except Contact.DoesNotExist:
                raise CommandError("Contact not found.")
            send_contact_email(contact)
            records = contact.email_deliveries.all()
        else:
            try:
                record = EmailDelivery.objects.get(pk=options["delivery_id"])
            except EmailDelivery.DoesNotExist:
                raise CommandError("Delivery not found.")
            send_delivery(record.pk)
            records = EmailDelivery.objects.filter(pk=record.pk)
        failed = False
        for record in records:
            self.stdout.write(
                f"Delivery {record.pk} ({record.audience}): {record.status}; {record.last_error}"
            )
            failed |= record.status != "accepted"
        if failed:
            raise CommandError(
                "One or more emails were not accepted. Correct the mail configuration and retry."
            )
