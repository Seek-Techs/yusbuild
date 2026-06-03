from django.contrib import admin

from apps.audit.models import AuditEvent, DomainEvent, TimelineEvent

admin.site.register(AuditEvent)
admin.site.register(TimelineEvent)
admin.site.register(DomainEvent)
