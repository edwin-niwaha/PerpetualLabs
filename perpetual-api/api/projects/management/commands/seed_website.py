"""Install the reviewed website catalog without overwriting later admin edits."""

from pathlib import Path

from django.conf import settings
from django.core.files import File
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from api.projects.models import Product, SiteVisual

CATALOG = [
    {
        "slug": "pendezaconnect",
        "name": "PendezaConnect",
        "category": "Sponsorship & community",
        "description": "A connection between sponsors, children, families, and the teams supporting their futures.",
        "detail": "PendezaConnect brings child sponsorship, giving, client services, and financial-support applications into one platform for Pendeza Uganda.",
        "focus": ["Child sponsorship", "Giving and donations", "Client services"],
        "website_url": "https://sponsorwithpendeza.org/",
        "status": "live",
        "asset": "pendeza.webp",
        "image_alt": "PendezaConnect live website, presented in a browser frame",
    },
    {
        "slug": "jobellstores",
        "name": "JobellStores",
        "category": "Fragrance e-commerce",
        "description": "A considered shopping experience for discovering fragrances, comparing options, and ordering online.",
        "detail": "The Jobell storefront brings fragrance collections, product variants, wishlists, and customer orders into a connected online shopping experience.",
        "focus": ["Online storefront", "Product variants", "Wishlists and orders"],
        "website_url": "https://jobellinc.com/",
        "status": "live",
        "asset": "jobell.webp",
        "image_alt": "JobellStores live fragrance storefront, presented in a browser frame",
    },
    {
        "slug": "duukayo",
        "name": "DuukaYo",
        "category": "E-commerce & retail POS",
        "description": "An online storefront, retail dashboard, and mobile checkout experience for connected commerce.",
        "detail": "DuukaYo connects a public storefront with a retail point of sale, web dashboard, and mobile offline cash checkout. The product is in development and is not yet hosted.",
        "focus": [
            "Public storefront",
            "Retail point of sale",
            "Mobile offline checkout",
        ],
        "website_url": "",
        "status": "development",
        "asset": "duukayo.webp",
        "image_alt": "Original DuukaYo product illustration with a shopping bag and cart",
    },
    {
        "slug": "fincore",
        "name": "FinCore",
        "category": "Financial management",
        "description": "Keep income, expenses, credit, and savings organized with a clearer view of your finances.",
        "detail": "FinCore brings financial organization and reporting to individuals, small businesses, and growing teams.",
        "focus": ["Income and expenses", "Credit management", "Savings and reporting"],
        "website_url": "",
        "status": "available",
        "asset": "fincore.webp",
        "image_alt": "Original FinCore product illustration with a financial chart",
    },
]
VISUALS = [
    {
        "key": "galaxy",
        "asset": "galaxy.webp",
        "alt": "Hubble photograph of the Whirlpool Galaxy, M51, and its companion",
        "credit": "NASA, ESA, S. Beckwith (STScI), and The Hubble Heritage Team (STScI/AURA)",
        "source_url": "https://science.nasa.gov/asset/hubble/out-of-this-whirl-the-whirlpool-galaxy-m51-and-companion-galaxy/",
    },
    {
        "key": "earth",
        "asset": "earth.webp",
        "alt": "NASA Blue Marble land, ocean, and ice texture",
        "credit": "NASA Earth Observatory / Blue Marble",
        "source_url": "https://visibleearth.nasa.gov/images/57730/the-blue-marble-land-surface-ocean-color-and-sea-ice",
    },
]


class Command(BaseCommand):
    help = "Install four reviewed products and homepage photography. Existing records are left unchanged unless --update is supplied."

    def add_arguments(self, parser):
        parser.add_argument(
            "--update",
            action="store_true",
            help="Replace these named catalog entries with the reviewed defaults.",
        )

    def handle(self, *args, **options):
        assets = Path(settings.BASE_DIR) / "content-assets"
        for data in CATALOG + VISUALS:
            if not (assets / data["asset"]).is_file():
                raise CommandError(f"Missing asset: {data['asset']}")
        with transaction.atomic():
            for index, entry in enumerate(CATALOG):
                data = dict(entry)
                asset = data.pop("asset")
                slug = data.pop("slug")
                obj, created = Product.objects.get_or_create(
                    slug=slug,
                    defaults={**data, "sort_order": index, "is_featured": True},
                )
                if created or options["update"]:
                    for key, value in data.items():
                        setattr(obj, key, value)
                    obj.sort_order, obj.is_featured, obj.is_published = (
                        index,
                        True,
                        True,
                    )
                    with (assets / asset).open("rb") as source:
                        obj.image.save(asset, File(source), save=False)
                    obj.save()
                self.stdout.write(
                    f"{'Installed' if created else 'Updated' if options['update'] else 'Kept'} {obj.name}"
                )
            for entry in VISUALS:
                data = dict(entry)
                asset, key = data.pop("asset"), data.pop("key")
                obj, created = SiteVisual.objects.get_or_create(key=key, defaults=data)
                if created or options["update"]:
                    for name, value in data.items():
                        setattr(obj, name, value)
                    with (assets / asset).open("rb") as source:
                        obj.image.save(asset, File(source), save=False)
                    obj.save()
        self.stdout.write(
            self.style.SUCCESS(
                "Website content is ready. Manage products and site visuals in Django admin."
            )
        )
