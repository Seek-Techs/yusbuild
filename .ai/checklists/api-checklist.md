# YusBuild API checklist (AI)

Derived from how endpoints are structured + ADRs.

## Endpoint implementation
- [ ] Endpoint is registered under the correct domain router (`apps/<domain>/urls.py`).
- [ ] Views remain thin: orchestrate request/response only.
- [ ] Business logic is in services.
- [ ] Visibility scoping is handled by selectors in `get_queryset()`.

## Serializers
- [ ] Serializers validate inputs and shape outputs.
- [ ] Serializer methods don’t implement workflow transitions beyond validation.

## Permissions
- [ ] Endpoint respects `IsAdminEngineerOrReadOnly` default behavior.
- [ ] Object-level permission inference can resolve project membership where relevant.

## Tests/schema
- [ ] API behavior tests exist for happy path + failure modes.
- [ ] Schema generation test covers/validates the endpoint.

