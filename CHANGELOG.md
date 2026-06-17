# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) and adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased

### Added
- Architecture Decision Records (ADRs) split from `DECISIONS.md` into individual files under `docs/adr/`.
- ADR index added at `docs/adr/README.md`.
- AI-native repository guardrails added under `.ai/`:
  - `.ai/rules/*`
  - `.ai/prompts/*`
  - `.ai/checklists/*`
  - `.ai/templates/*`

### Documentation
- Phase and architecture guardrails incorporated into AI agent rules (derived from repo documentation and existing ADRs).
- ADR directory introduced to structure architecture decisions.

### Testing & Coverage
- CI policy continues to enforce minimum test coverage of 85% (repo evidence: `pytest.ini` / CI workflows).

## Versioning Philosophy

This project uses Semantic Versioning:
- **MAJOR**: incompatible API changes.
- **MINOR**: backward-compatible functionality.
- **PATCH**: backward-compatible bug fixes.

### Notes on version numbers
This changelog records only evidence-supported release items. Repository history inspection did not produce clear, explicit release tags/versions suitable for assigning semantic versions without inventing unsupported version numbers.

