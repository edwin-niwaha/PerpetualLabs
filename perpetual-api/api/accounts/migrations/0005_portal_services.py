from django.db import migrations


def seed_services(apps, schema_editor):
    Service = apps.get_model("accounts", "PortalService")
    if not Service.objects.using(schema_editor.connection.alias).exists():
        Service.objects.using(schema_editor.connection.alias).bulk_create([
            Service(title="Consultation", description="Discuss your next software, website, or technology project with our team.", status="available", sort_order=0),
            Service(title="Project workspace", description="A dedicated place for project milestones, shared files, and progress updates.", sort_order=1),
            Service(title="Support desk", description="Track support requests and follow conversations with the team.", sort_order=2),
            Service(title="Billing & invoices", description="A future home for your service invoices and billing updates.", sort_order=3),
        ])


class Migration(migrations.Migration):
    dependencies = [("accounts", "0004_portalservice_contact_user_emaildelivery_and_more")]
    operations = [migrations.RunPython(seed_services, migrations.RunPython.noop)]
