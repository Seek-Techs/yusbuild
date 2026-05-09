"""
Django Admin configuration for Projects app.
"""

from django.contrib import admin
from apps.projects.models import Project


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = [
        "name",
        "location",
        "client",
        "status",
        "created_by",
        "created_at",
    ]
    list_filter = ["status", "created_at"]
    search_fields = ["name", "location", "client"]
