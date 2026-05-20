import os

# Set test env BEFORE importing base settings
os.environ["DEBUG"] = "True"
os.environ["DJANGO_SECRET_KEY"] = "django-test-secret-key"
os.environ["POSTGRES_PASSWORD"] = "test-password"

from . import settings as base

DEBUG = True
SECRET_KEY = base.SECRET_KEY

INSTALLED_APPS = base.INSTALLED_APPS
MIDDLEWARE = base.MIDDLEWARE
ROOT_URLCONF = base.ROOT_URLCONF
TEMPLATES = base.TEMPLATES
WSGI_APPLICATION = base.WSGI_APPLICATION

DATABASES = base.DATABASES.copy()
DATABASES["default"] = base.DATABASES["default"].copy()
DATABASES["default"]["PASSWORD"] = "test-password"

AUTH_PASSWORD_VALIDATORS = []

LANGUAGE_CODE = base.LANGUAGE_CODE
TIME_ZONE = base.TIME_ZONE
USE_I18N = base.USE_I18N
USE_TZ = base.USE_TZ

STATIC_URL = base.STATIC_URL

DEFAULT_AUTO_FIELD = base.DEFAULT_AUTO_FIELD