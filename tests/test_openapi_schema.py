from io import StringIO
from pathlib import Path
from uuid import uuid4

import pytest
from django.core.management import call_command


@pytest.mark.django_db
def test_openapi_schema_generation_is_clean():
    output_path = Path.cwd() / f"schema-{uuid4().hex}.yml"
    stdout = StringIO()
    stderr = StringIO()
    try:
        call_command(
            "spectacular",
            file=str(output_path),
            stdout=stdout,
            stderr=stderr,
        )
        assert stderr.getvalue() == ""
        schema = output_path.read_text(encoding="utf-8")
    finally:
        output_path.unlink(missing_ok=True)

    assert "/api/v1/execution/driving-records/" in schema
    assert "/api/v1/approvals/approve/" in schema
    assert "/api/v1/evidence/upload/" in schema
    assert "/api/v1/verification/run-checks/{execution_record_version_id}/" in schema
    assert "/api/v1/certification/packages/" in schema
    assert "/api/v1/certification/packages/{id}/certify/" in schema
