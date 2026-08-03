import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";
import { Boxes, FolderKanban, Layers, Wallet } from "lucide-react";

import { PageHeader, StatCard, StatCardGrid } from "@/components/shared";
import { ChartCard, useChartTheme } from "@/components/charts";
import { formatCurrency } from "@/lib/format/number";
import { PROJECTS, STEEL_BY_PROJECT } from "./fixtures";

/**
 * The dashboard from the client's design reference, built entirely from shared
 * components — no bespoke markup.
 *
 * Its purpose is to prove the library can express the agreed design. The real
 * dashboard is the Dashboard feature team's to build (roadmap F10); this is the
 * shape they should be able to reach for.
 */
export function DashboardDemo() {
  const chart = useChartTheme();

  const totalPiles = PROJECTS.reduce((sum, p) => sum + p.total_piles, 0);
  const totalSteel = PROJECTS.reduce((sum, p) => sum + p.total_steel_tons, 0);
  const totalCost = PROJECTS.reduce((sum, p) => sum + p.estimated_cost, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Welcome back, Engr. Yusuf"
        description="Company: BuildTech Solutions"
      />

      {/* Two-up on mobile, matching the reference; four-up on wide screens. */}
      <StatCardGrid columns={4}>
        <StatCard
          label="Projects"
          value={PROJECTS.length}
          caption="Active projects"
          icon={FolderKanban}
          tone="blue"
        />
        <StatCard
          label="Total Piles"
          value={totalPiles}
          caption="Across all projects"
          icon={Boxes}
          tone="green"
        />
        <StatCard
          label="Total Steel"
          value={`${totalSteel.toFixed(2)} t`}
          caption="Tons"
          icon={Layers}
          tone="purple"
        />
        <StatCard
          label="Est. Cost"
          value={formatCurrency(totalCost, { compact: true })}
          caption="Total estimated"
          icon={Wallet}
          tone="orange"
        />
      </StatCardGrid>

      <ChartCard
        title="Steel (Tons) by Project"
        action={{ to: "/projects", label: "View all" }}
        // A chart is invisible to assistive technology; this is its text
        // equivalent, not a decoration.
        summary={`Steel tonnage by project: ${STEEL_BY_PROJECT.map(
          (d) => `${d.name} ${d.tons} tons`,
        ).join(", ")}.`}
        height={280}
      >
        <BarChart data={STEEL_BY_PROJECT} margin={{ left: -16, right: 8 }}>
          <CartesianGrid stroke={chart.grid} vertical={false} />
          <XAxis
            dataKey="name"
            stroke={chart.axis}
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke={chart.axis}
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={chart.tooltip}
            cursor={{ fill: chart.grid, opacity: 0.3 }}
            formatter={(value) => [`${Number(value)} t`, "Steel"]}
          />
          <Bar dataKey="tons" fill={chart.series[0]} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ChartCard>
    </div>
  );
}
