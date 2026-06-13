from django.contrib import admin

from apps.certification.models import (
    CertificationLine,
    CertificationPackage,
    CertifiedQuantity,
)

admin.site.register(CertificationPackage)
admin.site.register(CertificationLine)
admin.site.register(CertifiedQuantity)
