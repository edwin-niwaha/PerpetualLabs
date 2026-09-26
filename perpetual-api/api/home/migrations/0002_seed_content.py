from django.db import migrations

DEFAULTS = {'settings': {'name': 'Perpetual Labs',
              'location': 'Kampala, Uganda',
              'founded': '2020',
              'phone': '+256 703 163 074',
              'email': 'hello.perpetuallabs@gmail.com',
              'whatsapp': 'https://wa.me/256703163074',
              'introduction': 'Websites, business software, and IT support for '
                              'teams ready to work better. From Kampala, we '
                              'help turn everyday challenges into practical '
                              'digital solutions.',
              'mission': 'Give businesses the technology to work more '
                         'efficiently, protect their information, and grow '
                         'with confidence.',
              'vision': 'Make reliable, thoughtfully built technology a '
                        'stronger foundation for business growth.'},
 'sections': [{'key': 'home-hero',
               'eyebrow': 'Independent thinking. Infinite possibilities.',
               'title': 'Big ideas.\nBuilt to go\nfurther.',
               'description': 'Websites, software, and connected systems.\n'
                              'Built in Kampala. Made for your next chapter.'},
              {'key': 'home-services',
               'eyebrow': '01 / How we help',
               'title': 'Better tools. Stronger businesses.',
               'description': 'A connected approach to your technology—from '
                              'the website customers see to the systems your '
                              'team relies on.'},
              {'key': 'home-products',
               'eyebrow': '02 / From the lab',
               'title': 'Our products. Your next possibility.',
               'description': 'Connecting people, powering commerce, and '
                              'simplifying finance. Explore products built '
                              'around real needs.'},
              {'key': 'home-approach',
               'eyebrow': '03 / A practical partnership',
               'title': 'Understand the need.\n'
                        'Build the right thing.\n'
                        'Keep it moving.',
               'description': ''},
              {'key': 'sign-in',
               'eyebrow': 'Your Perpetual account',
               'title': 'Welcome back.',
               'description': 'Sign in to your account. Administrators can '
                              'manage website content from their dashboard.'},
              {'key': 'about',
               'eyebrow': 'Built on curiosity. Grounded in Kampala.',
               'title': 'Technology with people at its heart.',
               'description': 'Since 2020, Perpetual Labs has helped '
                              'businesses put technology to work through '
                              'software, infrastructure, and ongoing support.'},
              {'key': 'contact',
               'eyebrow': 'A conversation is a good start',
               'title': 'Let’s put your next idea to work.',
               'description': 'Tell us what you want to build, improve, or '
                              'simplify. We’ll help you think through the next '
                              'step.'},
              {'key': 'cta',
               'eyebrow': 'Make the next move',
               'title': 'Good things start\nwith a conversation.',
               'description': 'Your idea. Our next conversation.'}],
 'faqs': [{'question': 'What can you help my business with?',
           'answer': 'We work across websites, custom software, '
                     'infrastructure, security, databases, cloud services, and '
                     'IT consulting. Start with the business challenge; we can '
                     'discuss which services fit.',
           'sort_order': 0,
           'is_published': True},
          {'question': 'Can we talk about an existing system?',
           'answer': 'Yes. Tell us what you use today, what is getting in the '
                     'way, and what you would like to improve. Our '
                     'conversation can cover building, maintaining, or '
                     'supporting your technology.',
           'sort_order': 1,
           'is_published': True},
          {'question': 'How do we get started?',
           'answer': 'Use the contact form, email us, or call. A short '
                     'description of your idea, current challenges, and '
                     'priorities is enough to begin.',
           'sort_order': 2,
           'is_published': True}],
 'features': [{'group': 'approach',
               'title': 'Your business comes first.',
               'description': 'We start with the people, processes, and '
                              'priorities the technology needs to serve.',
               'sort_order': 0,
               'is_published': True},
              {'group': 'approach',
               'title': 'A solution shaped to fit.',
               'description': 'Websites, software, and infrastructure are '
                              'tailored to your needs, with attention to '
                              'usability and reliability.',
               'sort_order': 1,
               'is_published': True},
              {'group': 'approach',
               'title': 'A partner beyond delivery.',
               'description': 'Maintenance, training, and ongoing support help '
                              'your team keep getting value from its systems.',
               'sort_order': 2,
               'is_published': True},
              {'group': 'values',
               'title': 'Excellence',
               'description': 'Careful delivery, dependable performance, and '
                              'attention to the details.',
               'sort_order': 0,
               'is_published': True},
              {'group': 'values',
               'title': 'Client focus',
               'description': 'Your needs shape the solution. We listen before '
                              'we build.',
               'sort_order': 1,
               'is_published': True},
              {'group': 'values',
               'title': 'Innovation',
               'description': 'Keep learning, explore better approaches, and '
                              'make change useful.',
               'sort_order': 2,
               'is_published': True}]}

def seed(apps, schema_editor):
    db = schema_editor.connection.alias
    apps.get_model("home", "SiteSettings").objects.using(db).get_or_create(pk=1, defaults=DEFAULTS["settings"])
    for row in DEFAULTS["sections"]:
        apps.get_model("home", "PageSection").objects.using(db).get_or_create(key=row["key"], defaults=row)
    for row in DEFAULTS["faqs"]:
        apps.get_model("home", "FAQ").objects.using(db).get_or_create(question=row["question"], defaults=row)
    for row in DEFAULTS["features"]:
        apps.get_model("home", "Feature").objects.using(db).get_or_create(group=row["group"], title=row["title"], defaults=row)

class Migration(migrations.Migration):
    dependencies = [("home", "0001_initial")]
    operations = [migrations.RunPython(seed, migrations.RunPython.noop)]
