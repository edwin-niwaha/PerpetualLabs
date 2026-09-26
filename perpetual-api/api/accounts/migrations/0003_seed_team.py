from django.db import migrations


def seed_team(apps, schema_editor):
    TeamMember = apps.get_model("accounts", "TeamMember")
    records = TeamMember.objects.using(schema_editor.connection.alias)
    if records.exists():
        return
    records.bulk_create([
        TeamMember(name="Edwin Niwaha", position="ceo_founder"),
        TeamMember(name="Elijah Niwaha", position="cto"),
        TeamMember(name="Albert Ashaba", position="lead_developer"),
        TeamMember(name="Dennis Samba", position="lead_developer"),
        TeamMember(name="Christbell Mujuni", position="marketing_officer"),
    ])


class Migration(migrations.Migration):
    dependencies = [("accounts", "0002_teammember_portrait_alter_teammember_position")]
    operations = [migrations.RunPython(seed_team, migrations.RunPython.noop)]
