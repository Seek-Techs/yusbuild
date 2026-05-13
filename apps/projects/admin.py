"""
Django Admin configuration for Projects app.
"""

from django.contrib import admin

from apps.projects.models import Project, ProjectMembership


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


@admin.register(ProjectMembership)
class ProjectMembershipAdmin(admin.ModelAdmin):
    list_display = ["project", "user", "role", "created_at"]
    list_filter = ["role", "created_at"]
    search_fields = ["project__name", "user__username", "user__email"]
