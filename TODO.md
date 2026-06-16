- [ ] Analyze current ViewSets for direct queryset usage.
- [x] Wire ProjectViewSet queryset to selector-based project scoping (visible_projects_queryset) while preserving current annotations/ordering.
- [ ] Replace any direct Project.objects access used for visibility with selector-based access.

- [ ] Ensure swagger_fake_view behavior preserved.
- [ ] Run py_compile on modified files.
- [ ] Run pytest (targeted) to ensure APIs unchanged.

