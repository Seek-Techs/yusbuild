# Sequence Diagrams — YusBuild (repository-visible behavior)

This file uses **Mermaid** to visualize major interaction sequences supported by the codebase.

Legend:
- **Verified Sequences**: directly supported by concrete code paths and/or tests.
- **Inferred Sequences**: strongly implied by architecture but not expressed in a single explicit code path.
- **Recommendations**: none (this document is strictly behavioral).

---

## Verified Sequences

### 1) Authentication: Obtain JWT token

**Purpose**
Authenticate a user and receive JWT access+refresh tokens.

**Actors**
User, API View, Serializer/Controller, Model, Database

**Preconditions**
User credentials are valid.

**Sequence Diagram**
```mermaid
sequenceDiagram
  participant U as User
  participant V as API View (/api/auth/token/)
  participant S as JWT serializer/view logic
  participant M as Auth model (User)
  participant D as Database

  U->>V: POST /api/auth/token/ (username, password)
  V->>S: Validate credentials
  S->>M: Fetch user by username
  M->>D: Query user
  D-->>M: User record
  M-->>S: User
  S-->>V: access + refresh tokens
  V-->>U: 200 + {access, refresh}
```

**Notes**
- Token endpoints are registered in `config/urls.py`.

---

### 2) JWT Refresh

**Purpose**
Exchange a refresh token for a new access token.

**Actors**
User, API View, JWT logic

**Preconditions**
Refresh token is valid.

**Sequence Diagram**
```mermaid
sequenceDiagram
  participant U as User
  participant V as API View (/api/auth/token/refresh/)
  participant S as JWT refresh logic

  U->>V: POST /api/auth/token/refresh/ (refresh)
  V->>S: Validate refresh token
  S-->>V: New access token
  V-->>U: 200 + {access, refresh}
```

**Notes**
- Endpoint is registered in `config/urls.py`.

---

### 3) Operational Health Check

**Purpose**
Return a lightweight liveness payload.

**Actors**
User, API View, JsonResponse

**Preconditions**
None.

**Sequence Diagram**
```mermaid
sequenceDiagram
  participant U as User
  participant V as health_check view (/health/)
  participant J as JsonResponse

  U->>V: GET /health/
  V-->>J: {status: "ok", service: "yusbuild-api", version: "1.0.0"}
  J-->>U: 200 JSON
```

**Notes**
- `apps/common/views.py::health_check`.

---

### 4) Operational Readiness Check

**Purpose**
Verify database connectivity and migration check before reporting readiness.

**Actors**
User, API View, Database, Management command (migrate --check)

**Preconditions**
Database should be reachable.

**Sequence Diagram**
```mermaid
sequenceDiagram
  participant U as User
  participant V as readiness_check view (/readiness/)
  participant DB as Database
  participant M as Django migrate --check

  U->>V: GET /readiness/
  V->>DB: SELECT 1
  DB-->>V: ok
  V->>M: call_command("migrate", "--check")
  M-->>V: success
  V-->>U: 200 {status: ready, checks: {database: ok, migrations: ok}}
```

**Notes**
- On exceptions, returns 503 and sets `database` / `migrations` checks to `error`.

---

### 5) Project Creation (plus membership)

**Purpose**
Create a project and attach creator membership with an inferred role.

**Actors**
User, Project API View, Project Serializer, Project Model, ProjectMembership Model, Database

**Preconditions**
User is authorized by permission + group logic.

**Sequence Diagram**
```mermaid
sequenceDiagram
  participant U as User
  participant V as ProjectViewSet (POST /api/v1/projects/)
  participant Z as ProjectCreateUpdateSerializer
  participant PM as Project model
  participant MEM as ProjectMembership model
  participant D as Database

  U->>V: POST /api/v1/projects/ (project fields)
  V->>Z: Validate payload
  Z-->>V: validated_data
  V->>PM: save project
  PM->>D: INSERT project
  D-->>PM: project row
  V->>MEM: get_or_create membership for (project, user)
  MEM->>D: INSERT membership if missing
  D-->>MEM: membership
  V-->>U: 201 + project representation
```

**Notes**
- Role inference is implemented in `apps/projects/views.py::perform_create`.

---

### 6) Pile Creation (auto-calculate + snapshot history)

**Purpose**
Create a pile and persist calculated results + immutable history.

**Actors**
User, Pile API View, Pile Serializer, PileCalculator, Persistence helpers/Services, Pile models, Calculation history models

**Preconditions**
Target project is visible/writable for the user.

**Sequence Diagram**
```mermaid
sequenceDiagram
  participant U as User
  participant V as PileViewSet (POST /api/v1/piles/)
  participant Z as PileCreateUpdateSerializer
  participant SV as piles services
  participant P as Pile model
  participant C as PileCalculator
  participant PC as PileCalculation model
  participant H as PileCalculationHistory model
  participant DB as Database

  U->>V: POST /api/v1/piles/ (pile fields)
  V->>Z: validate + to_internal_value
  Z-->>V: validated_data
  V->>P: create/associate pile
  P->>DB: INSERT pile
  V->>SV: calculate_and_persist_pile(pile, triggered_by, trigger)
  SV->>C: calculate(pile)
  C-->>SV: computed result (steel/concrete)
  SV->>PC: update/create current calculation
  SV->>H: create immutable history w/ snapshots
  PC->>DB: persist calculation
  H->>DB: persist history
  DB-->>H: history row
  V-->>U: 201 + PileCreateUpdate representation (includes calculation_result)
```

**Notes**
- View delegates persistence to serializer + `apps/piles/services.py`.
- History `trigger == "create"` is asserted in `tests/test_api.py`.

---

### 7) Pile Update (recalculate when quantity inputs change)

**Purpose**
Update pile attributes and recalculate quantities when relevant fields change.

**Actors**
User, Pile API View, Pile Serializer, piles services, History model

**Preconditions**
User has write permission and pile is visible.

**Sequence Diagram**
```mermaid
sequenceDiagram
  participant U as User
  participant V as PileViewSet (PATCH/PUT /api/v1/piles/{id}/)
  participant Z as PileCreateUpdateSerializer
  participant SV as piles services
  participant H as PileCalculationHistory model

  U->>V: PATCH /api/v1/piles/{id}/ (updated fields)
  V->>Z: validate update
  Z-->>V: validated_data (and signals whether recalc is needed)
  V->>SV: calculate_and_persist_pile(..., trigger="update")
  SV->>H: persist history snapshot (trigger="update")
  H-->>SV: history row
  V-->>U: 200 + updated pile
```

**Notes**
- Tests assert history trigger is `"update"` when `actual_length_m` is modified.

---

### 8) Force Recalculation

**Purpose**
Recompute a pile’s quantities on demand.

**Actors**
User, PileViewSet (action), calculate_and_persist_pile service, CalculationHistory

**Preconditions**
Pile exists and is visible.

**Sequence Diagram**
```mermaid
sequenceDiagram
  participant U as User
  participant V as PileViewSet (POST /api/v1/piles/{id}/recalculate/)
  participant SV as calculate_and_persist_pile
  participant H as PileCalculationHistory

  U->>V: POST /api/v1/piles/{id}/recalculate/ (reason)
  V->>SV: calculate_and_persist_pile(pile, triggered_by, trigger="recalculate")
  SV->>H: create history snapshot
  H-->>SV: history_id
  SV-->>V: calculation + result
  V-->>U: 200 + {message, pile_no, history_id, result}
```

**Notes**
- `tests/test_api.py` validates history trigger, reason, input snapshot and result snapshot.

---

### 9) Pile Breakdown

**Purpose**
Return full engineering breakdown for a pile.

**Actors**
User, PileViewSet breakdown action, PileCalculator

**Preconditions**
Pile exists and is visible.

**Sequence Diagram**
```mermaid
sequenceDiagram
  participant U as User
  participant V as PileViewSet (GET /api/v1/piles/{id}/breakdown/)
  participant C as PileCalculator

  U->>V: GET /api/v1/piles/{id}/breakdown/
  V->>C: calculate(pile)
  C-->>V: breakdown result
  V-->>U: 200 + result.to_dict()
```

**Notes**
- Tests assert keys `steel.main_bars`, `steel.helix`, `steel.stiffeners` and `concrete`.

---

### 10) Pile Calculation History (immutable)

**Purpose**
Return paginated immutable calculation history for a pile.

**Actors**
User, PileViewSet calculation_history action, Serializer, Database

**Preconditions**
Pile exists and is visible.

**Sequence Diagram**
```mermaid
sequenceDiagram
  participant U as User
  participant V as PileViewSet (GET /api/v1/piles/{id}/calculation-history/)
  participant DB as Database
  participant S as PileCalculationHistorySerializer

  U->>V: GET /api/v1/piles/{id}/calculation-history/
  V->>DB: SELECT pile.calculation_history (select_related triggered_by)
  DB-->>V: history rows
  V->>S: serialize (paginated or full)
  S-->>V: JSON payload
  V-->>U: 200 + {count, results:[...]} or array
```

**Notes**
- Uses DRF pagination when applicable.

---

### 11) Bulk Create Piles (atomic)

**Purpose**
Create multiple piles with all-or-nothing rollback.

**Actors**
User, PileViewSet bulk_create action, PileCreateUpdateSerializer, Database

**Preconditions**
Payload must be a list.

**Sequence Diagram**
```mermaid
sequenceDiagram
  participant U as User
  participant V as PileViewSet (POST /api/v1/piles/bulk-create/)
  participant Z as PileCreateUpdateSerializer
  participant DB as Database

  U->>V: POST /api/v1/piles/bulk-create/ [list of piles]
  V->>V: validate request.data is list
  V->>DB: BEGIN transaction (atomic)
  loop for each row
    V->>Z: validate row
    alt valid
      V->>DB: serializer.save() (pile + calc history)
    else invalid
      V->>V: collect serializer.errors
    end
  end
  alt errors exist
    V->>DB: rollback
    V-->>U: 400 + {created, errors}
  else no errors
    V->>DB: commit
    V-->>U: 200 + {created, errors:[]}
  end
```

**Notes**
- Tests assert 400 when payload is not list and when row has validation errors.

---

### 12) CSV Import (atomic + optional dry-run)

**Purpose**
Import piles from CSV with row-level errors and dry-run mode.

**Actors**
User, PileViewSet import_csv action, Serializer, Database

**Preconditions**
CSV file uploaded as multipart field `file`.

**Sequence Diagram**
```mermaid
sequenceDiagram
  participant U as User
  participant V as PileViewSet (POST /api/v1/piles/import-csv/)
  participant Z as PileCreateUpdateSerializer
  participant DB as Database

  U->>V: POST /api/v1/piles/import-csv/ (file, optional dry_run)
  V->>V: read file, parse CSV rows
  V->>DB: BEGIN transaction
  loop for each CSV row
    V->>Z: validate row data
    alt valid and dry_run=false
      V->>DB: serializer.save()
    else valid and dry_run=true
      V->>V: do not save (record status valid)
    else invalid
      V->>V: collect row errors
    end
  end
  alt dry_run=true or errors exist
    V->>DB: rollback
    V-->>U: 200 (dry-run) or 400 (errors)
  else
    V->>DB: commit
    V-->>U: 200 + created entries
  end
```

**Notes**
- `tests/test_api.py` validates dry_run success returns created rows with status `valid` and does not persist.

---

### 13) Evidence Upload

**Purpose**
Upload evidence and store metadata + hash.

**Actors**
User, EvidenceItemViewSet upload action, EvidenceUploadSerializer, evidence_service, EvidenceItem model, Database

**Preconditions**
User is authenticated.

**Sequence Diagram**
```mermaid
sequenceDiagram
  participant U as User
  participant V as EvidenceItemViewSet (POST /api/v1/evidence/upload/)
  participant Z as EvidenceUploadSerializer
  participant SV as evidence_service.upload_evidence
  participant M as EvidenceItem
  participant DB as Database

  U->>V: POST /api/v1/evidence/upload/ (multipart)
  V->>Z: validate upload payload
  Z-->>V: validated_data
  V->>SV: upload_evidence(validated_data, user)
  SV->>DB: store EvidenceItem + file metadata + sha256
  DB-->>SV: evidence object
  SV-->>V: evidence + warnings
  V-->>U: 201 + {evidence: serialized, warnings: [...]}
```

**Notes**
- Evidence upload action is implemented in `apps/evidence/views.py`.

---

### 14) Evidence Verify

**Purpose**
Verify an uploaded evidence item by updating `verification_status`.

**Actors**
User, EvidenceItemViewSet.verify action, EvidenceVerifySerializer, evidence_service

**Preconditions**
Evidence item exists and is visible.

**Sequence Diagram**
```mermaid
sequenceDiagram
  participant U as User
  participant V as EvidenceItemViewSet (POST /api/v1/evidence/{id}/verify/)
  participant Z as EvidenceVerifySerializer
  participant SV as evidence_service.verify_evidence

  U->>V: POST /api/v1/evidence/{id}/verify/ (verification_status)
  V->>Z: validate request
  Z-->>V: validated status
  V->>SV: verify_evidence(evidence, user, verification_status)
  SV-->>V: updated evidence
  V-->>U: 200 + EvidenceItem serialization
```

**Notes**
- Verification status transitions enforced in service (not shown here).

---

### 15) Evidence Link to Execution Record Version

**Purpose**
Create an immutable link from evidence to an `ExecutionRecordVersion` snapshot.

**Actors**
User, EvidenceItemViewSet.link action, EvidenceLinkRequestSerializer, evidence_service

**Preconditions**
ExecutionRecordVersion id is valid.

**Sequence Diagram**
```mermaid
sequenceDiagram
  participant U as User
  participant V as EvidenceItemViewSet (POST /api/v1/evidence/{id}/link/)
  participant Z as EvidenceLinkRequestSerializer
  participant SV as evidence_service.link_evidence_to_version

  U->>V: POST /api/v1/evidence/{id}/link/ (execution_record_version, is_primary)
  V->>Z: validate link request
  Z-->>V: validated_data
  V->>SV: link_evidence_to_version(evidence, execution_record_version, user, is_primary)
  alt invalid request
    SV-->>V: raise ValueError
    V-->>U: 409 + {detail}
  else valid
    SV-->>V: evidence_link
    V-->>U: 201 + EvidenceLink serialization
  end
```

**Notes**
- 409 is explicitly mapped for ValueError.

---

### 16) Verification: Run verification checks

**Purpose**
Run deterministic rule-based checks against an immutable execution record version and return variance flags.

**Actors**
User, RunVerificationChecksAPIView, ExecutionRecordVersion model, verification_service, VarianceFlag model

**Preconditions**
ExecutionRecordVersion exists.

**Sequence Diagram**
```mermaid
sequenceDiagram
  participant U as User
  participant V as RunVerificationChecksAPIView (POST /api/v1/verification/run-checks/{id}/)
  participant M as ExecutionRecordVersion
  participant SV as verification_service.run_verification_checks
  participant F as VarianceFlag

  U->>V: POST /api/v1/verification/run-checks/{id}/
  V->>M: get_object_or_404(ExecutionRecordVersion, pk=id)
  M-->>V: version
  V->>SV: run_verification_checks(version)
  SV->>F: create/find flags
  SV-->>V: flags
  V-->>U: 200 + {execution_record_version: version.id, flags:[...]}
```

**Notes**
- Schema description states idempotency and non-duplication semantics.

---

### 17) Verification: Transition variance flag (acknowledge/resolve/waive)

**Purpose**
Change variance flag state with an optional comment.

**Actors**
User, VarianceFlagViewSet, Transition serializer, verification services

**Preconditions**
Flag exists and is visible.

**Sequence Diagram**
```mermaid
sequenceDiagram
  participant U as User
  participant V as VarianceFlagViewSet (POST /api/v1/verification/flags/{id}/{transition}/)
  participant Z as VarianceFlagTransitionSerializer
  participant SV as verification_service.*_flag

  U->>V: POST /flags/{id}/acknowledge|resolve|waive (comment)
  V->>Z: validate transition payload
  Z-->>V: validated_data
  V->>SV: service_func(flag, user, comment)
  alt invalid transition
    SV-->>V: raise InvalidVarianceFlagTransition
    V-->>U: 409 + {detail}
  else valid
    SV-->>V: updated flag
    V-->>U: 200 + serialized flag (incl. action_logs)
  end
```

**Notes**
- 409 is explicitly mapped in `_transition()`.

---

### 18) Execution: Submit driving record (immutable snapshot)

**Purpose**
Submit a mutable driving record and create an immutable version.

**Actors**
User, PileDrivingRecordViewSet, submission service, state machine, ExecutionRecordVersion

**Preconditions**
Driving record is in DRAFT or RETURNED_FOR_CORRECTION (workflow-dependent).

**Sequence Diagram**
```mermaid
sequenceDiagram
  participant U as User
  participant V as PileDrivingRecordViewSet (POST /submit)
  participant SV as execution services (submit_execution_record)
  participant SM as state machine
  participant R as ExecutionRecordVersion
  participant DB as Database

  U->>V: POST /api/v1/execution/driving-records/{id}/submit/
  V->>SV: submit_execution_record(driving_record.execution_record, user)
  SV->>SM: validate workflow transition
  alt invalid transition
    SM-->>SV: raise InvalidExecutionTransition
    SV-->>V: exception
    V-->>U: 409 + {detail}
  else valid
    SV->>R: create immutable ExecutionRecordVersion snapshot
    SV->>DB: persist version
    V->>V: refresh_from_db
    V-->>U: 200 + updated driving record serialization
  end
```

**Notes**
- Implemented in `apps/execution/views.py::submit()`.

---

### 19) Execution: Revise returned record (create new version)

**Purpose**
Apply contractor corrections for returned records and create a new immutable version.

**Actors**
User, PileDrivingRecordViewSet, create_revision_from_record, ExecutionRecordVersion

**Preconditions**
Driving record is mutable and in a returned workflow stage.

**Sequence Diagram**
```mermaid
sequenceDiagram
  participant U as User
  participant V as PileDrivingRecordViewSet (POST /revise)
  participant SV as create_revision_from_record
  participant SM as state machine
  participant R as ExecutionRecordVersion

  U->>V: POST /api/v1/execution/driving-records/{id}/revise/ (revision data)
  V->>V: validate request via serializer (partial=True)
  V->>SV: create_revision_from_record(execution_record, user, revision_data)
  SV->>SM: validate transition
  alt invalid
    SV-->>V: raise InvalidExecutionTransition or ValueError
    V-->>U: 409 + {detail}
  else valid
    SV->>R: persist new version snapshot
    V->>V: refresh_from_db
    V-->>U: 200 + updated record serialization
  end
```

---

## Notes on recommendations section

This repository snapshot does not provide explicit additional recommendation workflows beyond what’s implemented in code and described in docstrings/schema.

