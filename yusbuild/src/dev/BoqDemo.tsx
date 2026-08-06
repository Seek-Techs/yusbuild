import { Cell, Legend, Pie, PieChart, Tooltip } from "recharts";
import {
  CalendarClock,
  Download,
  Layers,
  ListChecks,
  Wallet,
} from "lucide-react";

import {
  DataTable,
  DetailTabs,
  PageHeader,
  StatCard,
  StatCardGrid,
  type DataTableColumn,
} from "@/components/shared";
import { ChartCard, useChartTheme } from "@/components/charts";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatPercent } from "@/lib/format/number";
import { formatDate } from "@/lib/format/date";
import { BOQ_BY_TYPE, PROJECTS, STEEL_DISTRIBUTION } from "./fixtures";

/**
 * The BOQ screen from the design reference: Summary and Detailed tabs, a stat
 * grid, and the steel-distribution donut with its legend.
 *
 * The donut is where the chart palette matters most — four adjacent slices have
 * to stay distinguishable, which is why the colours are sampled from the
 * client's reference rather than chosen freehand.
 */

interface BoqLine {
  pile_type: string;
  count: number;
  steel_tons: number;
  concrete_m3: number;
}

const COLUMNS: DataTableColumn<BoqLine>[] = [
  {
    id: "pile_type",
    header: "Pile type",
    cell: (line) => line.pile_type.replace("_", " "),
  },
  {
    id: "count",
    header: "Count",
    cell: (line) => line.count,
    align: "right",
  },
  {
    id: "steel_tons",
    header: "Steel (t)",
    cell: (line) => line.steel_tons.toFixed(2),
    align: "right",
  },
  {
    id: "concrete_m3",
    header: "Concrete (m³)",
    cell: (line) => line.concrete_m3.toFixed(2),
    align: "right",
    hideBelow: "sm",
  },
];

export function BoqDemo() {
  const chart = useChartTheme();
  const project = PROJECTS[0]!;

  const summaryTab = (
    <div className="space-y-6">
      <StatCardGrid columns={4}>
        <StatCard
          label="Total Steel"
          value={project.total_steel_tons.toFixed(2)}
          caption="Tons"
          icon={Layers}
          tone="blue"
        />
        <StatCard
          label="Total Cost"
          value={formatCurrency(project.estimated_cost, { compact: true })}
          caption="Estimated"
          icon={Wallet}
          tone="green"
        />
        <StatCard
          label="Piles Count"
          value={project.total_piles}
          caption="Piles"
          icon={ListChecks}
          tone="purple"
        />
        <StatCard
          label="Last Updated"
          value={formatDate(project.updated_at)}
          icon={CalendarClock}
          tone="orange"
        />
      </StatCardGrid>

      <ChartCard
        title="Steel Distribution"
        summary={`Steel distribution: ${STEEL_DISTRIBUTION.map(
          (slice) => `${slice.name} ${slice.tons} tons, ${slice.percentage}%`,
        ).join("; ")}.`}
        height={320}
      >
        <PieChart>
          <Pie
            data={STEEL_DISTRIBUTION}
            dataKey="tons"
            nameKey="name"
            innerRadius="55%"
            outerRadius="80%"
            paddingAngle={2}
          >
            {STEEL_DISTRIBUTION.map((slice, index) => (
              <Cell
                key={slice.name}
                fill={chart.series[index % chart.series.length]}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={chart.tooltip}
            formatter={(value, name) => {
              const slice = STEEL_DISTRIBUTION.find((s) => s.name === name);
              return [
                `${Number(value)} t (${formatPercent(slice?.percentage ?? 0)})`,
                String(name),
              ];
            }}
          />
          <Legend
            // Recharts reorders legend entries by default; the reference lists
            // them largest-share first, matching how the slices read.
            payloadUniqBy
            verticalAlign="middle"
            align="right"
            layout="vertical"
            iconType="circle"
            formatter={(value) => {
              const slice = STEEL_DISTRIBUTION.find((s) => s.name === value);
              return (
                <span
                  style={{ color: chart.foreground }}
                  className="text-caption"
                >
                  {value}{" "}
                  <span style={{ color: chart.axis }}>
                    {slice?.tons}t ({slice?.percentage}%)
                  </span>
                </span>
              );
            }}
          />
        </PieChart>
      </ChartCard>
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Bill of quantities"
        title={`BOQ — ${project.name}`}
        description="Quantities derived from the current pile schedule."
        backLink={{ to: "/_dev/project", label: "Back to project" }}
        actions={
          <Button variant="outline">
            <Download aria-hidden="true" /> Export CSV
          </Button>
        }
      />

      <DetailTabs
        tabs={[
          { value: "summary", label: "Summary", content: summaryTab },
          {
            value: "detailed",
            label: "Detailed BOQ",
            content: (
              <DataTable
                columns={COLUMNS}
                rows={BOQ_BY_TYPE}
                getRowId={(line) => line.pile_type}
                caption="Bill of quantities by pile type"
              />
            ),
          },
        ]}
      />
    </div>
  );
}
