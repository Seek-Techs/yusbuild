import os

os.environ["DEBUG"] = "True"
os.environ.setdefault("DJANGO_SECRET_KEY", "django-insecure-test-key")

from .settings import *

DEBUG = True
