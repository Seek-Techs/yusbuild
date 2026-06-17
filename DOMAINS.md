# Domains & boundaries (repo-verified)

This document lists the externally exposed API domains and the internal modules that implement them.

## Base URL & versioning
All API resources are under:
- `/api/v1/` (registered in `config/urls.py`).

## Authorization context
Most endpoints rely on:
- JWT authentication (`rest_framework_simplejwt.authentication.JWTAuthentication`).
- Default permission `apps.common.permissions.IsAdminEngineerOrReadOnly`.
- Query scoping via per-domain selector helpers in `apps/*/selectors.py`.

## 1) Projects (`apps.projects`)
Endpoints are included from `apps/projects/urls.py` under `/api/v1/projects/`.

Primary implementation:
- `apps/projects/views.py`: `ProjectViewSet`
  - CRUD for `Project`
  - Custom actions:
    - `GET /api/v1/projects/{id}/boq/` (BOQ generation)
    - `GET /api/v1/projects/{id}/boq-csv/` (BOQ CSV export)

Project membership model:
- `apps/projects/models.py`: `ProjectMembership` with roles `admin`, `engineer`, `viewer`.

## 2) Piles (`apps.piles`)
Endpoints are included from `apps/piles/urls.py` under `/api/v1/piles/`.

Primary implementation:
- `apps/piles/views.py`: `PileViewSet` and `PileTypeConfigurationViewSet`
  - CRUD for `Pile`
  - Calculation operations:
    - `POST /api/v1/piles/{id}/recalculate/`
    - `GET /api/v1/piles/{id}/breakdown/`
    - `GET /api/v1/piles/{id}/calculation-history/`
  - Import/export actions:
    - `POST /api/v1/piles/import-csv/`
    - `GET /api/v1/piles/boq-export-csv/`
    - `GET /api/v1/piles/boq-export-xlsx/`
  - Bulk creation:
    - `POST /api/v1/piles/bulk-create/`

Calculation persistence:
- `apps/piles/services.py`: `calculate_and_persist_pile()` updates `PileCalculation` and creates `PileCalculationHistory` with snapshots.

## 3) Execution records (`apps.execution`)
Endpoints are included from `apps/execution/urls.py` under `/api/v1/execution/`.

Primary implementation:
- `apps/execution/views.py`: `PileDrivingRecordViewSet`
  - CRUD for `PileDrivingRecord`
  - State transitions via actions:
    - `POST /api/v1/execution/driving-records/{id}/submit/`
    - `POST /api/v1/execution/driving-records/{id}/revise/`

## 4) Approvals workflow (`apps.approvals`)
Endpoints are included from `apps/approvals/urls.py` under `/api/v1/approvals/`.

Primary implementation:
- `apps/approvals/views.py`: `ApprovalWorkflowViewSet` (DRF ViewSet)
  - Custom actions (POST):
    - `POST /api/v1/approvals/approve/`
    - `POST /api/v1/approvals/reject/`
    - `POST /api/v1/approvals/return-for-correction/`
    - `POST /api/v1/approvals/comments/`

These actions target immutable `ExecutionRecordVersion` instances via functions in `apps/approvals/services/*`.

## 5) Evidence (`apps.evidence`)
Endpoints are included from `apps/evidence/urls.py` under `/api/v1/evidence/`.

Primary implementation:
- `apps/evidence/views.py`: `EvidenceItemViewSet`
  - Read-only list/retrieve of evidence metadata
  - Actions:
    - `POST /api/v1/evidence/upload/` (multipart upload)
    - `POST /api/v1/evidence/{id}/verify/`
    - `POST /api/v1/evidence/{id}/link/` (link evidence to `ExecutionRecordVersion` snapshot)

Upload/verify/link behaviors are implemented in `apps/evidence/services/evidence_service.py`.

## 6) Verification (`apps.verification`)
Endpoints are included from `apps/verification/urls.py` under `/api/v1/verification/`.

Primary implementation:
- `apps/verification/views.py`
  - `VarianceFlagViewSet` (read-only list/retrieve + transitions):
    - `POST /api/v1/verification/flags/{id}/acknowledge/`
    - `POST /api/v1/verification/flags/{id}/resolve/`
    - `POST /api/v1/verification/flags/{id}/waive/`
  - `RunVerificationChecksAPIView`:
    - `POST /api/v1/verification/run-checks/{execution_record_version_id}/`

## 7) Certification (`apps.certification`)
Endpoints are included from `apps/certification/urls.py` under `/api/v1/certification/`.

Primary implementation:
- `apps/certification/views.py`: `CertificationPackageViewSet`
  - CRUD for `CertificationPackage`
  - Actions:
    - `POST /api/v1/certification/packages/{id}/add-line/`
    - `POST /api/v1/certification/packages/{id}/submit/`
    - `POST /api/v1/certification/packages/{id}/approve/`
    - `POST /api/v1/certification/packages/{id}/certify/`
    - `POST /api/v1/certification/packages/{id}/lock/`

## 8) Audit timeline (`apps.audit`)
Endpoints are included from `apps/audit/urls.py` under `/api/v1/audit/`.

Primary implementation:
- `apps/audit/views.py`: `TimelineEventViewSet`
  - Read-only list/retrieve
  - Custom actions:
    - `GET /api/v1/audit/timeline/project/{project_id}/`
    - `GET /api/v1/audit/timeline/pile/{pile_id}/`

Immutability is enforced by `AppendOnlyModel` in `apps/audit/models.py`.

