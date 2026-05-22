"""
WSGI config for medflare_backend project.
"""
import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medflare_backend.settings')
application = get_wsgi_application()
