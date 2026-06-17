# ID
ADR-010

# Title
Multi-stage workflow implemented across domains

# Status
Inferred

# Context
There are distinct workflow concerns:
- execution records (submit/revise)
- consultant decisions (approve/reject/return for correction)
- deterministic verification rules (run checks)
- certification package lifecycle (submit/approve/certify/lock)

# Decision
Split workflow stages across separate apps with dedicated APIs and serializers, connected by immutable snapshots (e.g., execution record versions referenced by evidence/verification/certification).

# Consequences
- Advantages:
  - Cleaner separation of responsibilities
  - Easier to enforce immutability per stage
- Trade-offs:
  - Requires careful reference management across apps

Evidence:
- Execution: `apps/execution/views.py` submit/revise actions.
- Approvals: `apps/approvals/views.py` actions target immutable `ExecutionRecordVersion`.
- Verification: `apps/verification/views.py` runs checks against `ExecutionRecordVersion` snapshots.
- Certification: `apps/certification/views.py` transitions per package.

