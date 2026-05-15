YusBuild from **Functional MVP** to **production-grade commercial construction software** without rewriting the project. 
# YusBuild Production Roadmap 
## PHASE 1 — Access Control & Project Security **Objective** 
Ensure users can only access and modify projects they are authorized to work on. 
**Why It Matters** 

JWT authentication proves identity, but production software also needs authorization. Right now, role checks exist, but project-level isolation is still incomplete. 

**Likely Files/Modules** 
- apps/common/permissions.py 
- apps/projects/models.py 
- apps/projects/views.py 
- apps/projects/serializers.py 
- apps/piles/views.py 
- tests/test_api.py 
- New: tests/test_permissions.py 

**Implementation Tasks** 
- Add project membership/assignment model. 
- Add object-level permission checks for projects. 
- Ensure piles inherit access rules from their parent project. 
- Define role behavior: 
- admin: all access 
- engineer: read/write assigned projects 
- viewer: read-only assigned projects 
- Restrict queryset results by user role. 
- Add negative authorization tests. 

**Recommended Patterns** 
- Use DRF BasePermission. 
- Use get_queryset() filtering for row-level isolation. 
- Use object-level has_object_permission(). 
- Avoid permission logic inside serializers. 

**Acceptance Criteria** 
- Anonymous users cannot access APIs. 
- Viewers cannot create/update/delete. 
- Engineers cannot access unassigned projects. 
- Admins can access all projects. 
- Piles cannot be accessed outside permitted projects. 

**Testing Requirements** 
- Authenticated/unauthenticated tests. 
- Role tests. 
- Cross-project access denial tests. 
- Viewer write-denial tests. 

**Branch** 
text
feature/access-control-project-security

**Commit Format** 
text
feat(authz): add project-level access control
test(authz): cover role and object permissions

**Complexity**: High 
**Production Blocker**: Yes 

--- 
## PHASE 2 — Calculation Auditability 
**Objective** 
Make every calculation traceable, reproducible, and auditable. 

**Why It Matters** 
Engineering software must answer: “What formula, config, inputs, and user produced this quantity?” Current calculations store outputs but not enough historical context. 

**Likely Files/Modules** 
- apps/piles/models.py 
- apps/piles/calculations.py 
- apps/piles/serializers.py 
- apps/piles/views.py 
- apps/piles/admin.py 
- apps/piles/migrations/ 
- New: tests/test_calculation_audit.py 

**Implementation Tasks** 
- Add version fields to PileTypeConfiguration. 
- Add immutable PileCalculationHistory. 
- Snapshot calculation inputs: 
- pile diameter 
- design length 
- actual length 
- pile type 
- config JSON 
- formula version 
- constants used 
- Store recalculation actor. 
- Store recalculation reason. 
- Keep latest PileCalculation for fast reads, but append every run to history. 
- Add endpoint to view calculation history. 

**Recommended Patterns** 
- Append-only history table. 
- Keep mutable summary table for current result. 
- Store JSON snapshot for reproducibility. 
- Use service/helper function for shared persistence logic. 

**Acceptance Criteria** 
- Every create/update/recalculate creates a history record. 
- Historical calculations do not change when config changes. 
- Latest calculation remains easily accessible. 
- API can retrieve calculation history per pile. 

**Testing Requirements** 
- Create pile creates history. 
- Update quantity fields creates new history. 
- Non-quantity update does not create new history. 
- Recalculate creates new history. 
- Config changes do not mutate old history. 

**Branch** 
text feature/calculation-audit-history

**Commit Format** 
text
feat(calc): add immutable calculation history
test(calc): cover calculation snapshots and audit trail
**Complexity**: Critical 
**Production Blocker**: Yes 
--- 
## PHASE 3 — Production Infrastructure Hardening **Objective** 
Make deployment safer, observable, and environment-aware. 

**Why It Matters** 
A stable app can still fail in production because of bad secrets, weak Docker defaults, missing observability, or poor health checks. 

**Likely Files/Modules** 
- config/settings.py 
- config/urls.py 
- Dockerfile 
- docker-compose.yml 
- .env.example 
- README.md 
- New: config/health.py or apps/common/views.py 

**Implementation Tasks** 
- Remove unsafe Docker defaults. 
- Split settings by environment if needed: 
- base 
- test 
- production 
- Add readiness check: 
- database reachable 
- migrations applied 
- Keep lightweight health check public. 
- Add structured logging. 
- Add request ID middleware. 
- Add Sentry or equivalent error reporting hook. 
- Configure secure production settings: 
- SECURE_SSL_REDIRECT 
- SESSION_COOKIE_SECURE 
- CSRF_COOKIE_SECURE 
- trusted origins 
- allowed hosts 
- Review static file serving strategy. 

**Recommended Patterns** 
- Fail fast on missing production env vars. 
- Keep dev/test convenient, production strict. 
- Do not hardcode secrets in compose. 
- Use environment-specific .env files. 

**Acceptance Criteria** 
- App refuses unsafe production startup. 
- Docker compose no longer encourages wildcard hosts/default secrets. 
- /health/ works without DB dependency. 
- /readiness/ checks DB/migrations. 
- Logs include request correlation ID. 

**Testing Requirements** 
- Settings import tests. 
- Health endpoint tests. 
- Readiness endpoint tests. 
- Production config smoke test. 

**Branch** 
text chore/production-infra-hardening

**Commit Format** 
text chore(config): harden production environment settings
feat(obs): add readiness checks and request logging

**Complexity**: High 
**Production Blocker**: Yes 
--- 
## PHASE 4 — CI/CD & Quality Assurance 
**Objective** 
Make every change automatically validated before merge/deployment. 

**Why It Matters**   
Commercial software cannot rely on manual test execution. 

**Likely Files/Modules** 
- .github/workflows/ci.yml 
- pytest.ini 
- requirements.txt 
- New: .flake8, pyproject.toml, or ruff.toml 
- New: deployment workflow later 

**Implementation Tasks** 
- Add GitHub Actions CI. 
- Run tests on pull requests. 
- Add migration check. 
- Add formatting/linting. 
- Add coverage threshold. 
- Add Docker build validation. 
- Add dependency vulnerability scanning. 
- Add branch protection rules. 

**Recommended Patterns** 
- Use ruff for linting. 
- Use black or Ruff formatter. 
- Use python manage.py makemigrations 
--check --dry-run. 
- Use PostgreSQL service in CI. 
- Keep CI fast initially. 

**Acceptance Criteria** 
- PRs cannot merge with failing tests. 
- Missing migrations fail CI. 
- Lint violations fail CI. 
- Docker image builds successfully. 
- Coverage threshold enforced. 

**Testing Requirements** 
- CI workflow must run full test suite. 
- Add one deliberate migration-check verification locally. 

**Branch** 
text
chore/ci-quality-gates

**Commit Format** 
text ci: add test, lint, migration, and docker checks

**Complexity**: Medium 
**Production Blocker**: Yes 
--- 
## PHASE 5 — Engineering Workflow Features 
**Objective** 
Make YusBuild useful in real engineering workflows, not just API demos. 

**Why It Matters** 
Construction users need imports, exports, BOQ outputs, and practical config management. 

**Likely Files/Modules** 
- apps/projects/views.py 
- apps/projects/serializers.py 
- apps/piles/views.py 
- apps/piles/serializers.py 
- apps/piles/models.py 
- New: apps/piles/importers.py 
- New: apps/projects/exporters.py 
- New: tests/test_import_export.py 

**Implementation Tasks** 
- Add BOQ CSV export. 
- Add BOQ Excel export. 
- Add pile CSV import. 
- Validate imports before saving. 
- Return row-level import errors. 
- Add dry-run import mode. 
- Add config management endpoints for admins/engineers. 
- Add bulk pile creation with atomic behavior. 
- Add operational filters: 
- project 
- pile type 
- install date 
- steel range 
- concrete range 

**Recommended Patterns** 
- Keep import/export logic outside views. 
- Use service modules: 
- importers.py 
- exporters.py 
- Validate before writing. 
- Use transactions for bulk saves. 
- Avoid partial imports unless explicitly supported.

**Acceptance Criteria** 
- Users can export BOQ to CSV/Excel. 
- Users can import pile schedules safely. 
- Invalid rows return clear errors. 
- Dry-run mode does not write data. 
- Bulk import creates calculations atomically. 

**Testing Requirements** 
- Valid import test. 
- Invalid import test. 
- Duplicate pile import test. 
- Dry-run test. 
- Export content test. 
- Large import test. 

**Branch** 
text
feature/engineering-import-export

**Commit Format** 
text
feat(boq): add CSV and Excel export
feat(import): add validated pile schedule import

**Complexity**: High 
**Production Blocker**: No, but required for strong internal adoption 
--- 

## Phase 5A — Field Execution Records

Build:

apps/execution/

Models:

PileDrivingRecord
DrivingResistanceLog
ConcreteRecord
ReinforcementInspection
EquipmentRecord

## PHASE 6 — Commercial SaaS Readiness 
**Objective** 
Prepare YusBuild for multi-company use, billing, enterprise controls, and long-term commercial operation. 

**Why It Matters** 
A paid SaaS product needs tenant isolation, billing boundaries, auditability, and enterprise-grade access control. 

**Likely Files/Modules** 
- New: apps/accounts/ 
- New: apps/organizations/ 
- apps/projects/models.py 
- apps/common/permissions.py 
- config/settings.py 
- Existing serializers/views across apps 
- New: tests/test_tenant_isolation.py

**Implementation Tasks** 
- Add Organization or Company model. 
- Associate users with organizations. 
- Associate projects with organizations. 
- Enforce tenant isolation in every queryset. 
- Add organization roles: 
- owner - admin - engineer - viewer 
- Add audit trail: 
- create - update - delete - recalculate - export - import 
- Add billing-ready fields: 
- plan - subscription status - usage counters - Add soft-delete or archival strategy. - Add enterprise export history. 

**Recommended Patterns** 
- Tenant filtering in base queryset/mixins. 
- Avoid passing organization IDs blindly from client. - Derive organization context from authenticated user. 
- Add audit middleware/service. 
- Keep billing integration decoupled until needed.

**Acceptance Criteria** 
- User from Company A cannot access Company B data. 
- Every project belongs to an organization. 
- Every user belongs to one or more organizations. 
- Audit events are recorded. 
- Billing metadata can be attached without changing core engineering models. 

**Testing Requirements** 
- Cross-tenant denial tests. - Organization admin tests. 
- Viewer/engineer role tests. 
- Audit event tests. 
- Export/import tenant isolation tests.

**Branch** 
text
feature/saas-tenant-foundation

**Commit Format** 
text
feat(tenancy): add organization isolation
feat(audit): add enterprise audit events

**Complexity**: Critical 
**Production Blocker**: For SaaS, yes. For single-company deployment, no. 
--- 
# A. Recommended Implementation Order 
1. **Phase 1 — Access Control & Project Security** 
2. **Phase 2 — Calculation Auditability** 
3. **Phase 4 — CI/CD & Quality Assurance** 
4. **Phase 3 — Production Infrastructure Hardening** 
5. **Phase 5 — Engineering Workflow Features** 
6. **Phase 6 — Commercial SaaS Readiness** 

# B. Parallelization Plan Can run in parallel: 
- Contributor A: Phase 1 permissions and project membership 
- Contributor B: Phase 2 calculation history models/services 
- Contributor C: Phase 4 CI/lint/migration checks 
- Contributor D: Phase 3 Docker/settings/observability 
- Contributor E: Phase 5 import/export after BOQ API stabilizes Should not run fully in parallel: 
- Phase 6 tenancy should wait until Phase 1 access control is merged. 
- Import/export should wait until calculation history persistence is clear. 
- Deployment hardening should coordinate with CI.

# C. Complexity Summary | Task | Complexity | |
---|---| | Project ownership model | High | | Object-level permissions | High | | Authorization tests | Medium | | Calculation snapshot fields | High | | Immutable calculation history | Critical | | Config versioning | High | | Production env hardening | High | | Health/readiness checks | Medium | | Request ID logging | Medium | | CI pipeline | Medium | | Lint/format setup | Low | | Migration checks | Low | | Docker build validation | Medium | | BOQ CSV export | Medium | | Excel export | Medium | | CSV/Excel import | High | | Bulk import validation | High | | Tenant/company model | Critical | | Tenant isolation | Critical | | Enterprise audit trail | High | | Billing-ready architecture | High | 

# D. Production Deployment Blockers These must be done before real production deployment: 
1. Project-level access control 
2. Object-level permission tests 
3. Calculation audit/history 
4. Production settings hardening 
5. CI test/migration/lint pipeline 
6. Secure Docker/env defaults 
7. Readiness checks 
8. Backup/restore plan 
9. Error monitoring/logging 
10. Deployment documentation For paid SaaS, 
add: 
1. Tenant/company isolation 
2. Enterprise audit trail 
3. Organization-level roles 
4. Billing-ready account model 

# E. YusBuild Release Path 
## Functional MVP Current state. Capabilities: 
- Core calculations work 
- JWT auth exists - BOQ works 
- Tests pass 
- API is usable by developers Remaining risk: 
- Not enough access isolation 
- Not enough auditability 
- Not production-hardened 

## Beta Required: 
- Phase 1 complete 
- Phase 2 complete 
- Phase 4 complete 
- Basic Phase 3 complete Beta means: 
- Safe for controlled real users 
- Safe for pilot projects 
- Still supervised by engineering team 

## Production Required: 
- Full Phase 1 
- Full Phase 2 
- Full Phase 3 
- Full Phase 4 
- Backup/restore 
- Observability 
- Deployment runbook Production means: 
- Safe for internal construction-firm usage 
- Reliable enough for real project data 
- Auditable enough for engineering review 

## Commercial SaaS Required: 
- Full Phase 6 
- Strong Phase 5 
- Enterprise audit trail 
- Tenant isolation 
- Billing-ready account boundaries 
- Support/ops workflows Commercial SaaS means: 
- Multiple companies can use it safely 
- Data is isolated 
- Actions are auditable 
- Product can support paid customers 



