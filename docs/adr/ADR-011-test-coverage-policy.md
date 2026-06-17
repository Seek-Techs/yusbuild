# ID
ADR-011

# Title
Enforce CI and quality by requiring 85%+ coverage

# Status
Accepted

# Context
To keep architecture consistent and prevent regressions, the repo enforces a coverage threshold.

# Decision
Require `pytest-cov` to enforce `--cov-fail-under=85` and run ruff lint/format checks in CI.

# Consequences
- Advantages:
  - Prevents large untested changes
- Trade-offs:
  - Some low-level modules may remain partially uncovered (acceptable if tests focus on behavior)

Evidence:
- `pytest.ini` includes `--cov-fail-under=85`.
- `.github/workflows/ci.yml` runs ruff checks, migrations checks, and pytest.

