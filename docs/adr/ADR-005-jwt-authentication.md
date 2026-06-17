# ID
ADR-005

# Title
Use SimpleJWT for bearer authentication

# Status
Accepted

# Context
Endpoints must be protected and integrate cleanly with mobile/web clients.

# Decision
Use `rest_framework_simplejwt.authentication.JWTAuthentication` as the default authentication and expose token obtain/refresh endpoints.

# Consequences
- Advantages:
  - Standard token workflow
  - Compatibility with OpenAPI schema generation
- Trade-offs:
  - Token lifecycle management required by clients

Evidence:
- `config/settings.py` default authentication class.
- `config/urls.py` registers `POST /api/auth/token/` and `POST /api/auth/token/refresh/`.

