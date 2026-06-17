# ID
ADR-008

# Title
Immutability and traceability using append-only audit models

# Status
Accepted

# Context
Engineering workflows require traceable, non-editable history (decisions, events, timeline).

# Decision
Implement `AppendOnlyModel` that prevents updates/deletes by raising validation errors when `pk` exists.

# Consequences
- Advantages:
  - Strong integrity guarantees for audit timeline
  - Simplifies reasoning about historical correctness
- Trade-offs:
  - Requires new audit behaviors to be implemented as append-only creation

Evidence:
- `apps/audit/models.py` `AppendOnlyModel.save()` and `.delete()`.
- Audit serializers include actor/project/pile/event fields.

