# import os

# # Force test-safe environment before importing base settings
# os.environ.setdefault("DEBUG", "True")
# os.environ.setdefault("DJANGO_SECRET_KEY", "django-insecure-test-key")
# os.environ.setdefault("POSTGRES_PASSWORD", "test-password")

# from . import settings as base

# DEBUG = True

# INSTALLED_APPS = base.INSTALLED_APPS
# MIDDLEWARE = base.MIDDLEWARE
# DATABASES = base.DATABASES
# ROOT_URLCONF = base.ROOT_URLCONF
# TEMPLATES = base.TEMPLATES
# WSGI_APPLICATION = base.WSGI_APPLICATION

# REST_FRAMEWORK = base.REST_FRAMEWORK

# AUTH_PASSWORD_VALIDATORS = []

# DATABASES["default"]["PASSWORD"] = "test-password"

# import os

# # Set test env BEFORE importing base settings
# os.environ["DEBUG"] = "True"
# os.environ["DJANGO_SECRET_KEY"] = "django-test-secret-key"
# os.environ["POSTGRES_PASSWORD"] = "test-password"

# from .settings import *

# DEBUG = True

# DATABASES["default"]["PASSWORD"] = "test-password"

# AUTH_PASSWORD_VALIDATORS = []

import os

os.environ["DEBUG"] = "True"
os.environ.setdefault("DJANGO_SECRET_KEY", "django-test-secret-key")

import dj_database_url
from .settings import *

DEBUG = True
SECRET_KEY = "django-test-secret-key"
AUTH_PASSWORD_VALIDATORS = []

TEST_DATABASE_URL = os.getenv("TEST_DATABASE_URL")

if TEST_DATABASE_URL:
    DATABASES = {
        "default": dj_database_url.parse(TEST_DATABASE_URL, conn_max_age=0),
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "test.sqlite3",
        }
    }
