# TODO

## Step plan approval required
- [x] Inspect remaining orchestration layers (views/serializers/selectors/permissions)
- [x] Cross-check URL routing + endpoints
- [ ] Generate documentation set (README.md, ARCHITECTURE.md, ROADMAP.md, DOMAINS.md, API_GUIDE.md, TESTING.md, DEPLOYMENT.md) strictly from verified facts

## Progress
- [x] Identified base permission class: IsAdminEngineerOrReadOnly
- [x] Verified project/pile/execution/evidence/audit/certification/verification selectors enforce query scoping by project membership
- [x] Verified endpoints in views + key serializers + actions
- [x] Verified URL routing for projects/piles/execution/evidence/verification/certification/audit/approvals
- [x] Confirmed OpenAPI generation via drf-spectacular and existing tests/CI


