import type { StatusMap } from "@/components/shared";

/**
 * Fixtures for the component gallery.
 *
 * Shaped to the real API contract — field names and types match the DRF
 * serialisers — so the gallery demonstrates components against realistic data
 * rather than convenient data. Domain teams can read these as a sketch of what
 * their endpoints return.
 *
 * Development only; excluded from production builds along with the rest of
 * src/dev.
 */

// --- Status maps ----------------------------------------------------------
// Domain-owned in real code (features/<domain>/constants.ts). Reproduced here
// so the gallery can show StatusBadge without importing from a feature.

export const PROJECT_STATUS: StatusMap = {
  ACTIVE: { label: "Active", tone: "success" },
  ON_HOLD: { label: "On hold", tone: "warning" },
  COMPLETED: { label: "Completed", tone: "info" },
  CANCELLED: { label: "Cancelled", tone: "neutral" },
};

export const PILE_STATUS: StatusMap = {
  CALCULATED: { label: "Calculated", tone: "success" },
  NEEDS_REVIEW: { label: "Needs review", tone: "warning" },
  PENDING: { label: "Pending", tone: "info" },
};

// --- Projects -------------------------------------------------------------

export interface DemoProject {
  id: number;
  name: string;
  client: string;
  location: string;
  status: string;
  description: string;
  total_piles: number;
  total_steel_tons: number;
  total_concrete_m3: number;
  estimated_cost: number;
  image?: string;
  updated_at: string;
}

export const PROJECTS: DemoProject[] = [
  {
    id: 1,
    name: "Lekki Phase 1",
    client: "BuildTech Solutions",
    location: "Lekki, Lagos",
    status: "ACTIVE",
    description: "Residential development at Lekki, Lagos.",
    total_piles: 36,
    total_steel_tons: 18.2,
    total_concrete_m3: 174.72,
    estimated_cost: 21_600_000,
    // Deliberately unset: exercises the Media fallback rather than hiding it.
    updated_at: "2026-05-20T10:30:00Z",
  },
  {
    id: 2,
    name: "Bridge Project",
    client: "Lagos State Infrastructure",
    location: "Lekki Corridor",
    status: "ACTIVE",
    description: "Coastal bridge package B.",
    total_piles: 42,
    total_steel_tons: 12.5,
    total_concrete_m3: 210.4,
    estimated_cost: 14_800_000,
    updated_at: "2026-05-18T09:15:00Z",
  },
  {
    id: 3,
    name: "Warehouse Project",
    client: "EIL Nigeria",
    location: "Apapa, Lagos",
    status: "ON_HOLD",
    description: "Industrial warehouse foundation.",
    total_piles: 18,
    total_steel_tons: 8.7,
    total_concrete_m3: 96.3,
    estimated_cost: 9_450_000,
    updated_at: "2026-04-02T14:00:00Z",
  },
  {
    id: 4,
    name: "Estate Project",
    client: "BuildTech Solutions",
    location: "Ikeja, Lagos",
    status: "COMPLETED",
    description: "Residential estate, phase two.",
    total_piles: 24,
    total_steel_tons: 6.2,
    total_concrete_m3: 71.8,
    estimated_cost: 8_350_000,
    updated_at: "2026-03-11T11:45:00Z",
  },
];

// --- Piles ----------------------------------------------------------------

export interface DemoPile {
  id: number;
  pile_no: string;
  pile_type: string;
  diameter_mm: number;
  design_length_m: number;
  actual_length_m: number;
  steel_kg: number;
  concrete_m3: number;
  status: string;
}

const PILE_TYPES = ["TYPE_I", "TYPE_II", "TYPE_III"];
const PILE_STATUSES = ["CALCULATED", "NEEDS_REVIEW", "PENDING"];

/** 36 piles, matching the project's declared count. */
export const PILES: DemoPile[] = Array.from({ length: 36 }, (_, index) => {
  const typeIndex = index % 3;
  return {
    id: index + 1,
    pile_no: `P-${String(index + 1).padStart(3, "0")}`,
    pile_type: PILE_TYPES[typeIndex]!,
    diameter_mm: [500, 600, 750][typeIndex]!,
    design_length_m: [12, 20, 24][typeIndex]!,
    actual_length_m: [12.4, 20, 23.6][typeIndex]!,
    steel_kg: [220.3, 720.5, 380.4][typeIndex]! + index * 3.7,
    concrete_m3: [3.8, 6.7, 5.1][typeIndex]!,
    status: PILE_STATUSES[index % 3]!,
  };
});

// --- BOQ ------------------------------------------------------------------

/** Steel distribution, matching the donut in the product design. */
export const STEEL_DISTRIBUTION = [
  { name: "Main Bars", tons: 13.5, percentage: 74 },
  { name: "Helix", tons: 2.3, percentage: 13 },
  { name: "Stiffeners", tons: 1.6, percentage: 9 },
  { name: "Others", tons: 0.8, percentage: 4 },
];

export const BOQ_BY_TYPE = [
  { pile_type: "TYPE_I", count: 12, steel_tons: 4.2, concrete_m3: 45.6 },
  { pile_type: "TYPE_II", count: 16, steel_tons: 9.8, concrete_m3: 82.4 },
  { pile_type: "TYPE_III", count: 8, steel_tons: 4.2, concrete_m3: 46.72 },
];

/** Steel per project, for the dashboard bar chart. */
export const STEEL_BY_PROJECT = PROJECTS.map((project) => ({
  name: project.name.replace(" Project", ""),
  tons: project.total_steel_tons,
}));
