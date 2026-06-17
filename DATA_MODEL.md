# Data Model — YusBuild (repo-verified)

This document reverse-engineers the **major entities** and their relationships from repository evidence in:
- `apps/*/models.py`
- migrations (implicitly)
- serializers/views (shape references)
- selectors/services/tests (usage references)

It does **not invent** entities not present in the codebase snapshot.

Legend:
- **Verified Fact**: directly supported by code shown in models.
- **Inferred Relationship**: derived from how relationships are referenced in code (e.g., serializer fields) but relationship is still grounded in model fields.
- **Recommendation**: none; this is a data-documentation file.

---

## Entity Relationship Overview (high-level)

### Aggregate roots
- `Project` (domain: projects)
- `Pile` + `PileCalculation` (+ `PileCalculationHistory`)
- `ExecutionRecord` (+ immutable `ExecutionRecordVersion`)
- `EvidenceItem` (+ `EvidenceLink`)
- `VarianceFlag` (+ `VerificationActionLog`)
- `CertificationPackage` (+ `CertificationLine` + `CertifiedQuantity`)
- `AuditEvent` / `TimelineEvent` / `DomainEvent`

### Cross-domain linkage (verified)
- `PileExecution` stage connects through:
  - `ExecutionRecord` references `Project` and `Pile`
  - `ExecutionRecordVersion` snapshots execution data
- Evidence links reference an immutable `ExecutionRecordVersion`
- Verification flags reference an `ExecutionRecordVersion`
- Certification lines reference an `ExecutionRecordVersion`

---

## Project

### Purpose (Verified Fact)
A project contains multiple piles and membership assignments.

### Fields (Verified Fact)
- `name: CharField(max_length=200)` with `MinLengthValidator(2)`
- `location: CharField(max_length=300, blank=True)`
- `client: CharField(max_length=200, blank=True)`
- `description: TextField(blank=True)`
- `status: CharField(choices=ProjectStatus.choices, default=ACTIVE)`
- `created_by: CharField(max_length=100, blank=True)`
- `created_at`, `updated_at`

### Relationships (Verified Fact)
- One-to-Many: `Project` → `piles` via `Pile.project (related_name='piles')`
- One-to-Many: `Project` → `memberships` via `ProjectMembership.project (related_name='memberships')`
- One-to-Many: `Project` → `execution_records` via `ExecutionRecord.project (related_name='execution_records')`
- One-to-Many: `Project` → `evidence_items` via `EvidenceItem.project (related_name='evidence_items')`
- One-to-Many: `Project` → `variance_flags` via `VarianceFlag.project (related_name='variance_flags')`
- One-to-Many: `Project` → `certification_packages` via `CertificationPackage.project (related_name='certification_packages')`
- One-to-Many (audit): `AuditEvent.project` and `TimelineEvent.project` exist in shared append-only base model.

### Ownership (Verified Fact)
- Access control uses `ProjectMembership`.

### Cardinality
- `Project` : `ProjectMembership` is 1..N (unique per user/project).

### Invariants (Verified Fact)
- `ProjectMembership` uniqueness: unique constraint on `(project, user)`.

### Aggregate Root
- `Project`

### State Fields
- `Project.status` in `ACTIVE|ON_HOLD|COMPLETED|CANCELLED`.

### Lifecycle
- Standard CRUD (views).

### Domain Dependencies
- Depends on Django auth user model for membership.

---

## ProjectMembership

### Purpose (Verified Fact)
Assigns a user role per project.

### Fields (Verified Fact)
- `project: FK(Project)`
- `user: FK(settings.AUTH_USER_MODEL)`
- `role`: `admin|engineer|viewer`
- `created_at`

### Relationships (Verified Fact)
- Many-to-One: memberships → project
- Many-to-One: memberships → user

### Ownership
- Belongs to `apps/projects`.

### Cardinality
- Unique per `(project,user)`.

### Invariants
- UniqueConstraint `(project,user)`.

---

## Pile

### Purpose (Verified Fact)
A single pile within a project.

### Fields (Verified Fact)
- `project: FK(Project)`
- `pile_no: CharField(max_length=50)`
- `pile_type: CharField(choices=PILE_TYPE_CHOICES)` where `PILE_TYPE_CHOICES` include `TYPE_I`, `TYPE_II`, `TYPE_III`, `BORED`
- Geometry: `diameter_mm`, `design_length_m`, `actual_length_m`
- Construction: `piling_method`, `concrete_grade`, `location_on_site`, `drawing_reference`, `date_installed`, `notes`
- `created_at`, `updated_at`

### Relationships (Verified Fact)
- One-to-Many: `Project.piles` → many piles via `related_name='piles'`.
- One-to-One: `Pile` → `PileCalculation` via `PileCalculation.pile (related_name='calculation')`
- One-to-Many: `Pile` → `PileCalculationHistory` via `PileCalculationHistory.pile (related_name='calculation_history')`
- One-to-Many: `Pile` → `ExecutionRecord` (through `ExecutionRecord.pile` FK)
- One-to-Many: `Pile` → `Evidence linkage indirectly via links` (EvidenceLink references ExecutionRecordVersion; EvidenceItem also stores project)
- One-to-Many: `Pile` → `VarianceFlag` via `VarianceFlag.pile`
- One-to-Many: `Pile` → `CertificationLine` via `CertificationLine.pile` (PROTECT)
- One-to-Many: `Pile` → `CertifiedQuantity` via `CertifiedQuantity.pile` (PROTECT)

### Ownership (Verified Fact)
- Belongs to `apps/piles`.

### Invariants (Verified Fact)
- UniqueConstraint on `(project, pile_no)`.

### Aggregate Root
- `Pile` (with associated calculation entities)

### State Fields
- No explicit “workflow” state field on `Pile` in shown model.

### Lifecycle
- Created/updated via piles APIs; calculations are derived.

---

## PileTypeConfiguration

### Purpose (Verified Fact)
Data-driven configuration for reinforcement templates.

### Fields (Verified Fact)
- `pile_type: CharField(max_length=20, choices=..., unique=True)`
- `description`
- `main_bar_sections: JSONField`
- helix/stiffener geometry: `helix_bar_size_mm`, `helix_pitch_mm`, `cage_diameter_mm`, `helix_end_turns`, `stiffener_bar_size_mm`, `stiffener_ring_diameter_mm`, `stiffener_spacing_m`, `concrete_cover_mm`
- `is_active: BooleanField`
- `version: PositiveIntegerField`
- timestamps

### Relationships
- Referenced by calculation logic (service layer) and serializer reads.

### Invariants
- Unique per `pile_type`.

---

## PileCalculation

### Purpose (Verified Fact)
Stores current computed reinforcement and concrete volumes.

### Fields (Verified Fact)
- `pile: OneToOneField(Pile)`
- Steel totals: `main_bars_kg`, `helix_kg`, `stiffeners_kg`, `total_steel_kg`
- Concrete: `design_concrete_m3`, `actual_concrete_m3`
- metadata: `calculation_version`, `calculated_at`

### Relationships (Verified Fact)
- One-to-One: `Pile` ↔ `PileCalculation`

### Invariants
- Calculations are updated by service; history exists separately.

---

## PileCalculationHistory

### Purpose (Verified Fact)
Immutable audit record for each calculation run.

### Fields (Verified Fact)
- `pile: FK(Pile)`
- `calculation: FK(PileCalculation)` nullable
- `triggered_by: FK(User)` nullable
- `trigger`: `create|update|recalculate|boq_repair`
- `reason` and versions: `calculation_version`, `config_version`
- snapshots: `input_snapshot`, `config_snapshot`, `constants_snapshot`, `result_snapshot`
- `created_at`

### Relationships
- Many history rows per pile.

### Invariants (Verified Fact)
- No explicit immutability method shown here, but history semantics are implemented and used as immutable in endpoints/tests.

---

## ExecutionRecord

### Purpose (Verified Fact)
Generic workflow header for execution records.

### Fields (Verified Fact)
- `project: FK(Project)`
- `pile: FK(Pile)`
- `record_type` in `ExecutionRecordType` (includes `PILE_DRIVING`)
- `current_state` in `ExecutionRecordState`:
  - `DRAFT`, `SUBMITTED`, `UNDER_REVIEW`, `APPROVED`, `RETURNED_FOR_CORRECTION`, `REJECTED`, `CERTIFIED`, `LOCKED`
- `current_version_no`
- `latest_version: FK(ExecutionRecordVersion) PROTECT` nullable
- contractor/actors fields: `contractor`, `created_by`, `submitted_by`
- timestamps: `submitted_at`, `created_at`, `updated_at`

### Relationships (Verified Fact)
- One-to-Many: `ExecutionRecord` → `versions` via `ExecutionRecordVersion.execution_record (related_name='versions')`
- One-to-One (domain-specific): `PileDrivingRecord.execution_record` OneToOneField

### Invariants (Verified Fact)
- `is_editable` property restricts editable states to `DRAFT` and `RETURNED_FOR_CORRECTION`.

### Aggregate Root
- `ExecutionRecord` (workflow header)

---

## ExecutionRecordVersion

### Purpose (Verified Fact)
Immutable submitted execution snapshot.

### Fields (Verified Fact)
- `execution_record: FK(ExecutionRecord, related_name='versions')`
- `version_no: PositiveIntegerField(validators MinValueValidator(1))`
- `submitted_by: FK(User)` nullable
- `submitted_at`
- `data_snapshot: JSONField`
- `source_record_hash`
- `supersedes_version: FK(self, PROTECT)` nullable
- `created_at`

### Relationships
- Many versions per execution record.

### Invariants (Verified Fact)
- `save()` raises ValidationError if `self.pk` exists (no updates).
- `delete()` raises ValidationError.

### Aggregate Root
- `ExecutionRecordVersion` as immutable snapshot.

---

## PileDrivingRecord

### Purpose (Verified Fact)
Driven pile field execution record.

### Fields (Verified Fact)
- `execution_record: OneToOneField(ExecutionRecord, related_name='pile_driving_record')`
- `project: FK(Project)`
- `pile: FK(Pile)`
- driving metrics:
  - `start_time`, `end_time`
  - `reported_depth_m`, `verified_depth_m`
  - `hammer_type`, `hammer_energy`, `final_set`, `total_blows`
  - `remarks`, `contractor_comments`
- timestamps

### Relationships
- One-to-Many: `PileDrivingRecord` → `resistance_logs` via `DrivingResistanceLog.driving_record`.

### Invariants (Verified Fact)
- `save()` checks editable state of parent execution record; raises ValidationError when submitted.

---

## DrivingResistanceLog

### Purpose (Verified Fact)
Blow count progression log.

### Fields (Verified Fact)
- `driving_record: FK(PileDrivingRecord)`
- `sequence_no`
- `depth_from_m`, `depth_to_m`, `penetration_mm`, `blow_count`
- `set_per_blow`, `notes`

### Relationships
- Many logs per driving record.

### Invariants (Verified Fact)
- UniqueConstraint on `(driving_record, sequence_no)`.
- `save()` prevents edits if driving record’s execution record is not editable.
- `delete()` prevents deletion for submitted execution record.

---

## EvidenceItem

### Purpose (Verified Fact)
Stores uploaded evidence metadata and content hash.

### Fields (Verified Fact)
- `project: FK(Project)`
- `uploaded_by: FK(User)` nullable
- `file: FileField`
- `original_filename`, `content_type`, `file_size`, `sha256_hash`
- `uploaded_at`
- capture metadata: `captured_at`, `gps_lat`, `gps_lng`, `device_metadata`
- `evidence_type` (`photo|video|document|field_note|other`)
- `verification_status` (`pending|verified|rejected`)
- verifier fields: `verified_by`, `verified_at`
- `is_deleted: BooleanField`

### Relationships (Verified Fact)
- One-to-Many: EvidenceItem → EvidenceLink via `EvidenceLink.evidence (related_name='links')`.

### Invariants (Verified Fact)
- `save()` prevents modification of immutable fields after initial creation.
- `delete()` is soft-delete with `is_deleted=True` but blocks deletion when evidence is linked to approved execution versions.

---

## EvidenceLink

### Purpose (Verified Fact)
Immutable link tying evidence to an execution snapshot.

### Fields (Verified Fact)
- `evidence: FK(EvidenceItem)`
- `execution_record_version: FK(ExecutionRecordVersion)`
- `linked_by: FK(User)` nullable
- `linked_at`
- `is_primary`

### Relationships
- Many links per evidence.
- Many links per execution record version.

### Invariants (Verified Fact)
- UniqueConstraint `(evidence, execution_record_version)`.
- `save()` prevents changing immutable link fields after creation.
- `delete()` blocks deletion if `version.execution_record.current_state == APPROVED`.

---

## VarianceFlag

### Purpose (Verified Fact)
Represents a deterministic verification rule result.

### Fields (Verified Fact)
- `project: FK(Project)`
- `pile: FK(Pile)`
- `execution_record_version: FK(ExecutionRecordVersion)` PROTECT
- `category`, `severity`
- `status`: `open|acknowledged|resolved|waived`
- expected/reported/verified values: `expected_value`, `reported_value`, `verified_value`
- message, `rule_code`
- `triggered_at`
- resolution fields: `resolved_at`, `resolved_by`, `resolution_comment`

### Relationships (Verified Fact)
- One-to-Many: VarianceFlag → VerificationActionLog via `action_logs`.

### Invariants (Verified Fact)
- UniqueConstraint on `(execution_record_version, rule_code)`.
- `save()` prevents editing most immutable fields.
- `delete()` raises ValidationError.

---

## VerificationActionLog

### Purpose (Verified Fact)
Append-only audit log of verification transitions for a flag.

### Fields (Verified Fact)
- `variance_flag: FK(VarianceFlag, related_name='action_logs')`
- `actor: FK(User)` nullable
- `action`, `previous_status`, `new_status`, `comment`, `created_at`

### Invariants (Verified Fact)
- `save()` raises if updating existing rows (append-only).
- `delete()` raises.

---

## CertificationPackage

### Purpose (Verified Fact)
Workflow header grouping quantities ready for certification.

### Fields (Verified Fact)
- `project: FK(Project)`
- `package_no` unique per project
- `description`
- `current_state` in `DRAFT|SUBMITTED|APPROVED|CERTIFIED|LOCKED`
- `quantity_snapshot: JSONField`
- actor fields: `created_by`, `submitted_by`, `approved_by`, `certified_by`
- timestamps: `submitted_at`, `approved_at`, `certified_at`, `locked_at`, `created_at`, `updated_at`

### Relationships (Verified Fact)
- One-to-Many: CertificationPackage → CertificationLine (`related_name='lines'` via model field `lines`)
- One-to-Many: CertificationPackage → CertifiedQuantity (`related_name='certified_quantities'`)

### Invariants (Verified Fact)
- `is_editable` property: only when `current_state == DRAFT`.
- `save()` blocks changes when existing state is CERTIFIED or LOCKED, allowing only mutable system fields.

---

## CertificationLine

### Purpose (Verified Fact)
A line item within a certification package referencing an execution version.

### Fields (Verified Fact)
- `package: FK(CertificationPackage, related_name='lines')`
- `pile: FK(Pile, PROTECT)`
- `source_execution_version: FK(ExecutionRecordVersion, PROTECT)`
- `certified_depth_m`, `certified_concrete_m3`, `certified_reinforcement_kg`
- `quantity_snapshot`
- timestamps

### Relationships
- One-to-Many: package → many lines.
- One-to-One: line → CertifiedQuantity via `CertifiedQuantity.certification_line`.

### Invariants (Verified Fact)
- UniqueConstraint `(package, source_execution_version)`.
- Save/delete enforce immutability after package is no longer editable (non-DRAFT).

---

## CertifiedQuantity

### Purpose (Verified Fact)
Immutable frozen quantities when package reaches CERTIFIED.

### Fields (Verified Fact)
- `package: FK(CertificationPackage)` PROTECT
- `certification_line: OneToOneField(CertificationLine)` PROTECT
- `pile: FK(Pile)` PROTECT
- `source_execution_version: FK(ExecutionRecordVersion)` PROTECT
- certified numeric fields + `frozen_snapshot`
- `certified_by`, `certified_at`

### Invariants (Verified Fact)
- `save()` raises if `pk` exists.
- `delete()` raises.

---

## AuditEvent / TimelineEvent / DomainEvent (Append-only)

### Purpose (Verified Fact)
Stores immutable audit timeline events.

### Fields (Verified Fact)
Common base `AppendOnlyModel`:
- `actor: FK(User)` nullable
- `project: FK(Project)` PROTECT
- `pile: FK(Pile)` PROTECT
- `event_type` (`EventType` choices)
- `timestamp`
- `metadata: JSONField`

### Relationships
- Many events per project/pile.

### Invariants (Verified Fact)
- `save()` raises if row already has a pk (no modifications).
- `delete()` raises.

---

## Approval

### Purpose (Verified Fact)
Records consultant/decision outcomes for execution record versions.

### Entities (Verified Fact)
- `ApprovalDecision` (append-only)
- `ConsultantComment` (append-only)
- `ApprovalActionLog` (append-only)

### ApprovalDecision
- Fields: `execution_record_version` (PROTECT), `decision`, `decided_by`, `decided_at`, `comments`, `previous_state`, `new_state`
- Invariants: save/delete prevent updates/deletes.

### ConsultantComment
- Fields: `execution_record_version` (PROTECT), `author`, `comment`, `created_at`
- Invariants: append-only.

### ApprovalActionLog
- Fields: `execution_record_version` (PROTECT), `actor`, `action`, `metadata`, `created_at`
- Invariants: append-only.

---

## Entity Relationship Detail: Aggregate boundaries (Verified)

- **Project aggregate**: Project + ProjectMembership.
- **Pile aggregate**: Pile + PileCalculation + PileCalculationHistory.
- **Execution aggregate**: ExecutionRecord + ExecutionRecordVersion + PileDrivingRecord (+ DrivingResistanceLog).
- **Verification aggregate**: VarianceFlag + VerificationActionLog.
- **Certification aggregate**: CertificationPackage + CertificationLine + CertifiedQuantity.
- **Evidence aggregate**: EvidenceItem + EvidenceLink.
- **Audit aggregate**: AuditEvent/TimelineEvent/DomainEvent.
- **Approval aggregate**: ApprovalDecision + ConsultantComment + ApprovalActionLog.

---

## Domain Dependencies

- Piles depend on Projects (`Pile.project`).
- Execution depends on Projects and Piles (`ExecutionRecord.project`, `ExecutionRecord.pile`).
- Execution versions are immutable and referenced by evidence/verification/certification.
- Evidence links reference `ExecutionRecordVersion`.
- Verification flags reference `ExecutionRecordVersion`.
- Certification lines reference `ExecutionRecordVersion`.
- Audit timeline entities reference `Project` and `Pile`.

---

## State Machines embedded in models (Verified Facts)

### ExecutionRecordState (Verified Fact)
- `DRAFT → SUBMITTED → UNDER_REVIEW → APPROVED → ...` and includes `RETURNED_FOR_CORRECTION`, `REJECTED`, `CERTIFIED`, `LOCKED`.

### CertificationPackageState (Verified Fact)
- `DRAFT → SUBMITTED → APPROVED → CERTIFIED → LOCKED`.

### VarianceStatus (Verified Fact)
- `open → acknowledged → resolved|waived`.

---

## Recommendations

None. This file is documentation-only.

