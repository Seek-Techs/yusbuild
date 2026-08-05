import { Building2, Plus } from "lucide-react";

import {
  DataTable,
  DescriptionList,
  DetailTabs,
  FilterBar,
  FilterSelect,
  Media,
  PageHeader,
  SearchInput,
  StatCard,
  StatCardGrid,
  StatusBadge,
  type DataTableColumn,
} from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useDataTableParams } from "@/hooks/useDataTableParams";
import { formatCurrency, formatKg, formatMetres } from "@/lib/format/number";
import { formatDate } from "@/lib/format/date";
import {
  PILES,
  PILE_STATUS,
  PROJECTS,
  PROJECT_STATUS,
  type DemoPile,
} from "./fixtures";

/**
 * The project detail screen from the design reference: hero image, metric
 * strip, and a tabbed body whose Piles tab is a filterable, sortable,
 * paginated table.
 *
 * Every piece is a shared component. Note the pile list is driven by
 * `useDataTableParams`, so its filter, sort and page live in the URL and the
 * view is shareable — try `?tab=piles&search=P-01&ordering=-steel_kg`.
 */

const FILTER_KEYS = ["pile_type"] as const;
const PAGE_SIZE = 10;

const COLUMNS: DataTableColumn<DemoPile>[] = [
  {
    id: "pile_no",
    header: "Pile",
    cell: (pile) => (
      <div className="flex items-center gap-2">
        <span className="rounded-md bg-muted p-1.5" aria-hidden="true">
          <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
        </span>
        <div className="min-w-0">
          <p className="truncate">{pile.pile_no}</p>
          <p className="truncate text-caption font-normal text-muted-foreground">
            {pile.pile_type.replace("_", " ")} ·{" "}
            {formatMetres(pile.actual_length_m)}
          </p>
        </div>
      </div>
    ),
    sortable: true,
  },
  {
    id: "diameter_mm",
    header: "Diameter",
    cell: (pile) => `${pile.diameter_mm} mm`,
    align: "right",
    hideBelow: "md",
  },
  {
    id: "steel_kg",
    header: "Steel",
    cell: (pile) => formatKg(pile.steel_kg),
    align: "right",
    sortable: true,
  },
  {
    id: "status",
    header: "Status",
    cell: (pile) => <StatusBadge status={pile.status} map={PILE_STATUS} />,
    hideBelow: "sm",
  },
];

export function ProjectDetailDemo() {
  const project = PROJECTS[0]!;
  const params = useDataTableParams({
    filterKeys: FILTER_KEYS,
    defaultOrdering: "pile_no",
  });

  // Filtering in memory stands in for the API call a real screen would make.
  let rows = PILES;
  if (params.debouncedSearch) {
    const needle = params.debouncedSearch.toLowerCase();
    rows = rows.filter((pile) => pile.pile_no.toLowerCase().includes(needle));
  }
  if (params.filters.pile_type) {
    rows = rows.filter((pile) => pile.pile_type === params.filters.pile_type);
  }

  const descending = params.ordering?.startsWith("-");
  const sortKey = params.ordering?.replace("-", "") as
    keyof DemoPile | undefined;
  if (sortKey) {
    rows = [...rows].sort(
      (a, b) => (a[sortKey] > b[sortKey] ? 1 : -1) * (descending ? -1 : 1),
    );
  }

  const count = rows.length;
  const paged = rows.slice(
    (params.page - 1) * PAGE_SIZE,
    params.page * PAGE_SIZE,
  );

  const pilesTab = (
    <div className="space-y-4">
      <FilterBar
        search={
          <SearchInput
            value={params.search}
            onChange={params.setSearch}
            placeholder="Search pile ID or type…"
          />
        }
        filters={
          <FilterSelect
            label="Type"
            value={params.filters.pile_type ?? null}
            onChange={(value) => params.setFilter("pile_type", value)}
            options={[
              { label: "Type I", value: "TYPE_I" },
              { label: "Type II", value: "TYPE_II" },
              { label: "Type III", value: "TYPE_III" },
            ]}
          />
        }
        activeFilterCount={params.activeFilterCount}
        onClearAll={params.clearFilters}
        actions={
          <Button>
            <Plus aria-hidden="true" /> Add Pile
          </Button>
        }
      />

      <DataTable
        columns={COLUMNS}
        rows={paged}
        getRowId={(pile) => pile.id}
        rowHref={(pile) => `/piles/${pile.id}`}
        caption={`Piles in ${project.name}`}
        sorting={{
          ordering: params.ordering,
          onOrderingChange: params.setOrdering,
        }}
        pagination={{
          page: params.page,
          count,
          onPageChange: params.setPage,
        }}
      />
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={project.client}
        title={project.name}
        description={project.description}
        badge={<StatusBadge status={project.status} map={PROJECT_STATUS} />}
        backLink={{ to: "/projects", label: "Back to projects" }}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <Media
          // No src: shows the fallback, which is the realistic case for a
          // project before anyone uploads a site photo.
          alt={`Site photograph of ${project.name}`}
          ratio="photo"
          fallbackLabel="No site photo yet"
        />

        <Card className="rounded-lg shadow-card">
          <CardContent className="space-y-6 p-6">
            <DescriptionList
              columns={2}
              items={[
                { label: "Client", value: project.client },
                { label: "Location", value: project.location },
                {
                  label: "Last updated",
                  value: formatDate(project.updated_at),
                },
                {
                  label: "Estimated cost",
                  value: formatCurrency(project.estimated_cost),
                },
              ]}
            />
          </CardContent>
        </Card>
      </div>

      <StatCardGrid columns={3}>
        <StatCard label="Piles" value={project.total_piles} tone="blue" />
        <StatCard
          label="Tons Steel"
          value={project.total_steel_tons.toFixed(2)}
          tone="green"
        />
        <StatCard
          label="Est. Cost"
          value={formatCurrency(project.estimated_cost, { compact: true })}
          tone="orange"
        />
      </StatCardGrid>

      <DetailTabs
        tabs={[
          { value: "piles", label: "Piles", content: pilesTab },
          {
            value: "summary",
            label: "Summary",
            content: (
              <Card className="rounded-lg">
                <CardContent className="p-6">
                  <DescriptionList
                    columns={3}
                    items={[
                      { label: "Total piles", value: project.total_piles },
                      {
                        label: "Steel",
                        value: `${project.total_steel_tons.toFixed(2)} t`,
                      },
                      {
                        label: "Concrete",
                        value: `${project.total_concrete_m3} m³`,
                      },
                    ]}
                  />
                </CardContent>
              </Card>
            ),
          },
          {
            value: "boq",
            label: "BOQ",
            content: (
              <Card className="rounded-lg">
                <CardContent className="p-6 text-body text-muted-foreground">
                  See the BOQ demo for the full breakdown.
                </CardContent>
              </Card>
            ),
          },
          {
            value: "documents",
            label: "Documents",
            content: (
              <Card className="rounded-lg">
                <CardContent className="p-6 text-body text-muted-foreground">
                  Document management is on the roadmap.
                </CardContent>
              </Card>
            ),
          },
        ]}
      />
    </div>
  );
}
