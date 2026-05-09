# YusBuild - Pile Reinforcement Quantification API

**For BuildTech Solutions** | Built by Engr. Yusuf (HNG Stage 3 Backend)

> Automate calculations. Eliminate spreadsheets. Deliver accurate BOQs.

## What It Does

YusBuild replaces Excel-based pile reinforcement calculations for civil engineering projects. Given a pile's type, diameter, and depth, it automatically calculates:

- **Main bar steel** (kg) - per section with BS 8666 bar sizes
- **Helix/spiral steel** (kg) - cage circumference x turns x kg/m  
- **Stiffener ring steel** (kg) - ring count x circumference x kg/m
- **Concrete volume** (m3) - πR2H with actual depth
- **Full BOQ** - grouped by pile type with steel distribution charts

### Verified Against TECON Construction Excel

All formulas reverse-engineered from Engineers India Limited (EIL) Refinery Extension project data and verified against TECON's Excel output:

| Parameter | Excel Value | API Value | Match |
|-----------|-------------|-----------|-------|
| Main bars (Type II) | 585.83 kg | 585.83 kg | Exact |
| Helix (Type II) | 52.37 kg | 52.37 kg | Exact |
| Stiffeners (Type II) | 24.26 kg | 24.26 kg | Exact |
| Concrete (21.2m) | 4.163 m3 | 4.163 m3 | Exact |

## Tech Stack

- **Django 5.0** + **Django REST Framework** (API)
- **PostgreSQL 16** (database)
- **Docker + Docker Compose** (deployment)
- **pytest** with 85%+ coverage (testing)
- **BS 8666** rebar standards (engineering)
- **Structured logging** with rotation (operations)

## Quick Start

```bash
# 1. Clone/copy the project
cd yusbuild

# 2. Set environment
cp .env.example .env
# Edit .env with your values

# 3. Run with Docker
docker compose up --build

# 4. Access API
# API: http://localhost:8000/api/v1/
# Admin: http://localhost:8000/admin/
# Health: http://localhost:8000/health/
# Docs: http://localhost:8000/api/v1/ (DRF browsable API)
```

## API Endpoints

### Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/projects/` | List all projects |
| POST | `/api/v1/projects/` | Create new project |
| GET | `/api/v1/projects/{id}/` | Get project detail with piles |
| PUT | `/api/v1/projects/{id}/` | Update project |
| DELETE | `/api/v1/projects/{id}/` | Delete project |
| GET | `/api/v1/projects/{id}/boq/` | Generate BOQ for project |

### Piles (with auto-calculation)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/piles/` | List all piles |
| POST | `/api/v1/piles/` | Create pile + auto-calculate |
| GET | `/api/v1/piles/{id}/` | Get pile with calculation |
| PATCH | `/api/v1/piles/{id}/` | Update pile + recalculate |
| DELETE | `/api/v1/piles/{id}/` | Delete pile |
| POST | `/api/v1/piles/{id}/recalculate/` | Force recalculation |
| GET | `/api/v1/piles/{id}/breakdown/` | Full engineering breakdown |

### Pile Type Configurations
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/piles/configs/` | List pile type configs |
| GET | `/api/v1/piles/configs/{type}/` | Get specific config |

### System
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health/` | Health check |

## Example API Call

### Create a pile (auto-calculates)

```bash
curl -X POST http://localhost:8000/api/v1/piles/ \
  -H "Content-Type: application/json" \
  -d '{
    "pile_no": "P-001",
    "pile_type": "TYPE_II",
    "project": 1,
    "diameter_mm": 500,
    "design_length_m": 20.0,
    "actual_length_m": 21.2,
    "piling_method": "Driven Cast In-Situ",
    "concrete_grade": "C35/40"
  }'
```

### Response

```json
{
  "pile_no": "P-001",
  "pile_type": "TYPE_II",
  "calculation_result": {
    "steel": {
      "main_bars": {
        "total_kg": 585.831,
        "sections": [
          {"section_name": "full_cage_y16", "bar_size": "Y16", "count": 10, "weight_kg": 249.055},
          {"section_name": "short_piece_y25", "bar_size": "Y25", "count": 10, "weight_kg": 336.776}
        ]
      },
      "helix": {"bar_size": "Y8", "n_turns": 88, "weight_kg": 52.367},
      "stiffeners": {"bar_size": "Y16", "n_rings": 9, "weight_kg": 24.264},
      "total_kg": 662.462,
      "total_tons": 0.662
    },
    "concrete": {
      "design_m3": 3.9275,
      "actual_m3": 4.16315
    }
  }
}
```

## Project BOQ

```bash
curl http://localhost:8000/api/v1/projects/1/boq/
```

Returns:
- Summary by pile type (count, steel kg, concrete m3)
- Steel distribution (main bars %, helix %, stiffeners %)
- Per-pile detail with breakdown
- Grand totals

## Engineering Standards

- **BS 8666**: Rebar shapes and scheduling
- **kg/m formula**: d / 162.2 (TECON Excel constant)
- **PI value**: 3.142 (TECON Excel constant, not math.pi)
- **Pile types**: I, II, III (configurable per project/drawing)

## Running Tests

```bash
# Run all tests with coverage
docker compose exec web pytest

# Run specific test file
docker compose exec web pytest tests/test_calculations.py -v

# Run with coverage report
docker compose exec web pytest --cov=apps --cov-report=term-missing
```

## Project Structure

```
yusbuild/
 apps/
   projects/          # Project CRUD + BOQ
   piles/             # Pile CRUD + Calculation Engine
 config/              # Django settings
 tests/               # pytest test suite
 docker-compose.yml   # Docker orchestration
 Dockerfile           # API container
 requirements.txt     # Python dependencies
 manage.py            # Django CLI
```

## For HNG Reviewers

This project demonstrates:
- [x] Proper model design with relationships
- [x] Calculation engine with verified formulas
- [x] Auto-calculation on create/update (signals pattern)
- [x] Full CRUD API with DRF
- [x] Custom actions (recalculate, breakdown, BOQ)
- [x] Input validation with meaningful errors
- [x] Structured logging (no bare excepts)
- [x] pytest with >85% coverage
- [x] Docker + docker-compose production setup
- [x] Health check endpoint
- [x] Configurable pile types (data-driven, not hardcoded)

---

**Built for BuildTech Solutions**
From Drawings to BOQ, Without the Headache.
