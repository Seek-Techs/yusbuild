# ID
ADR-004

# Title
JWT + group-based permission with object-level membership inference

# Status
Accepted

# Context
The system requires authorization for create/update/delete while allowing read access for viewers and full access for admin/engineer groups.

# Decision
Use `IsAdminEngineerOrReadOnly` as `DEFAULT_PERMISSION_CLASSES` and implement object-level permission checks based on the user’s groups and an inferred `project` attribute when available.

# Consequences
- Advantages:
  - Enforces read vs write consistently across endpoints
  - Supports role differentiation using Django groups
- Trade-offs:
  - Object-level permission inference may not cover every edge case for new models unless they expose a `project` relationship

Evidence:
- `config/settings.py` sets `REST_FRAMEWORK['DEFAULT_PERMISSION_CLASSES']`.
- `apps/common/permissions.py` implements `has_permission` and `has_object_permission`.

