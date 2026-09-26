from django.db import migrations

SERVICES = [
    {
        "description": "Customer-facing websites and web applications, designed around your "
        "business and the people who use them.",
        "highlights": ["Responsive websites", "Online stores", "Content management"],
        "icon": "code",
        "slug": "web-development",
        "title": "Web Development",
    },
    {
        "description": "Purpose-built tools that simplify the way your team works and address "
        "the challenges off-the-shelf software cannot.",
        "highlights": [
            "Business applications",
            "Workflow improvements",
            "Tailored functionality",
        ],
        "icon": "workflow",
        "slug": "custom-software",
        "title": "Custom Software",
    },
    {
        "description": "The networks, servers, and systems your business depends on, planned "
        "for reliability and room to grow.",
        "highlights": ["Network implementation", "Server management", "Virtualization"],
        "icon": "network",
        "slug": "it-infrastructure",
        "title": "IT Infrastructure",
    },
    {
        "description": "Practical protection for your systems and information, supported by "
        "informed people and considered security controls.",
        "highlights": [
            "Security reviews",
            "Firewalls and encryption",
            "Staff awareness",
        ],
        "icon": "shield",
        "slug": "cybersecurity",
        "title": "Cybersecurity",
    },
    {
        "description": "Organize, move, and maintain business data so it remains useful, "
        "accessible, and recoverable.",
        "highlights": [
            "Database design",
            "Migration and integration",
            "Performance and backups",
        ],
        "icon": "database",
        "slug": "database-management",
        "title": "Database Management",
    },
    {
        "description": "A clearer view of your technology choices, grounded in what your "
        "business needs to achieve.",
        "highlights": [
            "Technology advice",
            "Business alignment",
            "Planning your next step",
        ],
        "icon": "compass",
        "slug": "it-consulting",
        "title": "IT Consulting",
    },
    {
        "description": "Move to the cloud and manage your environment with scalability and "
        "efficiency in mind.",
        "highlights": ["Cloud migration", "Ongoing management", "Optimization"],
        "icon": "cloud",
        "slug": "cloud-services",
        "title": "Cloud Services",
    },
]
TESTIMONIALS = [
    {
        "company": "Jobell Inc.",
        "content": "A truly professional and reliable team!",
        "image": "",
        "name": "Christbell",
        "position": "CEO",
    },
    {
        "company": "Kasenyi CDC",
        "content": "Their custom solution has enhanced member management…",
        "image": "",
        "name": "Samuel",
        "position": "PD",
    },
    {
        "company": "Pendeza Uganda",
        "content": "We can now track and manage sponsorships with ease!",
        "image": "",
        "name": "Christine",
        "position": "ED",
    },
]


def seed(apps, schema_editor):
    Service = apps.get_model("services", "Service")
    Testimonial = apps.get_model("testimonials", "Testimonial")
    Client = apps.get_model("projects", "Client")
    alias = schema_editor.connection.alias
    if not Service.objects.using(alias).exists():
        for record in reversed(SERVICES):
            Service.objects.using(alias).create(**record)
    if not Testimonial.objects.using(alias).exists():
        for record in reversed(TESTIMONIALS):
            fields = dict(record)
            company = fields.pop("company")
            client, _ = Client.objects.using(alias).get_or_create(name=company)
            Testimonial.objects.using(alias).create(client=client, **fields)


class Migration(migrations.Migration):
    dependencies = [
        ("services", "0002_service_highlights"),
        ("testimonials", "0002_testimonial_portrait_alter_testimonial_image"),
    ]
    operations = [migrations.RunPython(seed, migrations.RunPython.noop)]
