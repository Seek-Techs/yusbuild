import os

import django
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from rest_framework.test import APIClient

from apps.piles.serializers import PileCreateUpdateSerializer
from apps.projects.models import Project, ProjectMembership

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.test_settings")
django.setup()

# Create user
User = get_user_model()
user = User.objects.create_user(
    username="test-user",
    password="test-password",
)
engineer_group, _ = Group.objects.get_or_create(name="engineer")
user.groups.add(engineer_group)

# Create project
project = Project.objects.create(
    name="Refinery Extension Test Pile",
    location="Crude Distillation Unit",
    client="Engineers India Limited",
    description="Residential development at Lekki, Lagos",
    status="ACTIVE",
    created_by="Engr. Yusuf",
)
ProjectMembership.objects.create(
    project=project,
    user=user,
    role=ProjectMembership.ROLE_ENGINEER,
)

payload_row = {
    "pile_no": "P-500",
    "pile_type": "BORED",
    "diameter_mm": 900,
    "design_length_m": 22.0,
    "actual_length_m": 21.5,
    "project": project.id,
}

# Test serializer directly
print("Testing serializer...")
serializer = PileCreateUpdateSerializer(data=payload_row)
print(f"Valid: {serializer.is_valid()}")
if not serializer.is_valid():
    print(f"Errors: {serializer.errors}")
else:
    print("No errors!")

# Test API
print("\nTesting API...")
client = APIClient()
client.force_authenticate(user=user)
response = client.post("/api/v1/piles/bulk-create/", [payload_row], format="json")
print(f"Status: {response.status_code}")
data = response.json()
print(f"Response: {data}")
