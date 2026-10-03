from django.db import migrations


def remove_location_copy(apps, schema_editor):
    PageSection = apps.get_model("home", "PageSection")
    sections = PageSection.objects.using(schema_editor.connection.alias)
    for section in sections.filter(description__contains="Built in Kampala."):
        description = section.description.replace("Built in Kampala. ", "").replace("Built in Kampala.", "")
        sections.filter(pk=section.pk).update(description=description)


class Migration(migrations.Migration):
    dependencies = [("home", "0002_seed_content")]
    operations = [migrations.RunPython(remove_location_copy, migrations.RunPython.noop)]
