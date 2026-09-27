from pathlib import Path
import json, shutil, sqlite3
from datetime import datetime
from django.conf import settings
from django.db import connection, transaction
from api.accounts.models import User
from api.blog.models import BlogPost, Category
assert settings.DEBUG and connection.settings_dict['ENGINE']=='django.db.backends.sqlite3', 'Only the local SQLite database may be changed.'
root=Path(settings.BASE_DIR).parent
pack=root/'docs/journal-samples'
backup=Path(settings.BASE_DIR)/'.backups'/('before-journal-samples-'+datetime.now().strftime('%Y%m%d-%H%M%S')+'.sqlite3')
backup.parent.mkdir(exist_ok=True)
with sqlite3.connect(connection.settings_dict['NAME']) as source, sqlite3.connect(backup) as target:
 source.backup(target)
author=User.objects.get(username='Admin',is_staff=True)
media=Path(settings.MEDIA_ROOT)/'journal';media.mkdir(parents=True,exist_ok=True)
with transaction.atomic():
 for article in json.loads((pack/'articles.json').read_text(encoding='utf-8')):
  asset='sample-'+article['asset']
  shutil.copyfile(pack/'images'/article['asset'],media/asset)
  category,_=Category.objects.get_or_create(name=article['category'])
  post,created=BlogPost.objects.get_or_create(slug=article['slug'],defaults=dict(title=article['title'],excerpt=article['excerpt'],content=article['content'],author=author,category=category,image='http://127.0.0.1:8000/media/journal/'+asset,is_published=True))
  print(('Added' if created else 'Kept'), post.title)
print('Local database backup:',backup.name)
