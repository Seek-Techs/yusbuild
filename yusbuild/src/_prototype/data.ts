export type UserMode = "engineer" | "viewer";

export interface ProjectPrototype {
  id: string;
  name: string;
  client: string;
  location: string;
  status: "ACTIVE" | "ON_HOLD" | "COMPLETED";
  piles: number;
  steelKg: number;
  concreteM3: number;
  openItems: number;
}

export interface PilePrototype {
  id: string;
  projectId: string;
  pileNo: string;
  pileType: "TYPE_I" | "TYPE_II" | "TYPE_III" | "BORED";
  diameterMm: number;
  designLengthM: number;
  actualLengthM: number;
  steelKg: number;
  concreteM3: number;
  state: "Calculated" | "Needs review" | "Pending";
}

export interface BoqLinePrototype {
  pileType: string;
  count: number;
  steelKg: number;
  concreteM3: number;
}

export const prototypeEndpoints = {
  auth: "POST /api/auth/token/",
  projects: "GET /api/v1/projects/",
  projectBoq: "GET /api/v1/projects/{id}/boq/",
  projectBoqCsv: "GET /api/v1/projects/{id}/boq-csv/",
  piles: "GET /api/v1/piles/",
  pileBreakdown: "GET /api/v1/piles/{id}/breakdown/",
  pileHistory: "GET /api/v1/piles/{id}/calculation-history/",
  pileImportCsv: "POST /api/v1/piles/import-csv/",
};

export const projects: ProjectPrototype[] = [
  {
    id: "lekki-bridge",
    name: "Lekki Coastal Bridge - Package B",
    client: "Lagos State Infrastructure Works",
    location: "Lekki Corridor, Lagos",
    status: "ACTIVE",
    piles: 42,
    steelKg: 27823.32,
    concreteM3: 174.72,
    openItems: 4,
  },
  {
    id: "refinery-extension",
    name: "EIL Refinery Extension - Unit 42",
    client: "Engineers India Limited",
    location: "Port Harcourt Refinery",
    status: "ACTIVE",
    piles: 18,
    steelKg: 11918.28,
    concreteM3: 75.12,
    openItems: 1,
  },
  {
    id: "warehouse-foundation",
    name: "Abeokuta Logistics Hub - Phase 1",
    client: "Northline Logistics",
    location: "Abeokuta Industrial Estate",
    status: "ON_HOLD",
    piles: 0,
    steelKg: 0,
    concreteM3: 0,
    openItems: 0,
  },
];

export const piles: PilePrototype[] = [
  {
    id: "p-001",
    projectId: "lekki-bridge",
    pileNo: "LCB-B-P001",
    pileType: "TYPE_II",
    diameterMm: 500,
    designLengthM: 20,
    actualLengthM: 21.2,
    steelKg: 662.46,
    concreteM3: 4.163,
    state: "Calculated",
  },
  {
    id: "p-002",
    projectId: "lekki-bridge",
    pileNo: "LCB-B-P002",
    pileType: "TYPE_II",
    diameterMm: 500,
    designLengthM: 20,
    actualLengthM: 21.1,
    steelKg: 662.46,
    concreteM3: 4.144,
    state: "Calculated",
  },
  {
    id: "p-014",
    projectId: "lekki-bridge",
    pileNo: "LCB-B-P014",
    pileType: "TYPE_III",
    diameterMm: 600,
    designLengthM: 24,
    actualLengthM: 23.6,
    steelKg: 811.22,
    concreteM3: 6.671,
    state: "Needs review",
  },
  {
    id: "tp-003",
    projectId: "refinery-extension",
    pileNo: "EIL-U42-TP003",
    pileType: "TYPE_I",
    diameterMm: 500,
    designLengthM: 19,
    actualLengthM: 19.4,
    steelKg: 524.1,
    concreteM3: 3.809,
    state: "Calculated",
  },
];

export const boqLines: BoqLinePrototype[] = [
  { pileType: "TYPE_I", count: 8, steelKg: 4192.8, concreteM3: 30.47 },
  { pileType: "TYPE_II", count: 22, steelKg: 14574.12, concreteM3: 91.25 },
  { pileType: "TYPE_III", count: 6, steelKg: 4867.32, concreteM3: 40.03 },
];

export function formatKg(value: number) {
  return `${value.toLocaleString(undefined, { maximumFractionDigits: 2 })} kg`;
}

export function formatM3(value: number) {
  return `${value.toLocaleString(undefined, { maximumFractionDigits: 3 })} m3`;
}

// NOTE: these silently fall back to the first record rather than signalling
// "not found", which is why the prototype has no 404 handling. Real screens must
// surface a not-found state instead. The non-null assertions are safe only
// because the fixture arrays above are non-empty literals.
export function findProject(projectId: string | undefined): ProjectPrototype {
  return projects.find((project) => project.id === projectId) ?? projects[0]!;
}

export function findPile(pileId: string | undefined): PilePrototype {
  return piles.find((pile) => pile.id === pileId) ?? piles[0]!;
}

export function pilesForProject(projectId: string) {
  return piles.filter((pile) => pile.projectId === projectId);
}
