import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { projects, type ProjectPrototype } from "../../data";

const AXIS_COLOR = "hsl(var(--muted-foreground))";
const GRID_COLOR = "hsl(var(--border))";
const STEEL_COLOR = "hsl(var(--primary))";
const CONCRETE_COLOR = "hsl(var(--chart-2))";

const STATUS_COLORS: Record<ProjectPrototype["status"], string> = {
  ACTIVE: "hsl(var(--chart-2))",
  ON_HOLD: "hsl(var(--primary))",
  COMPLETED: "hsl(var(--muted-foreground))",
};

const STATUS_LABELS: Record<ProjectPrototype["status"], string> = {
  ACTIVE: "Active",
  ON_HOLD: "On hold",
  COMPLETED: "Completed",
};

const tooltipStyle = {
  backgroundColor: "hsl(var(--card))",
  borderColor: "hsl(var(--border))",
  color: "hsl(var(--card-foreground))",
  borderRadius: "var(--radius)",
  fontSize: 12,
};

const quantityData = projects.map((project) => ({
  name: project.name.split(" - ")[0],
  steelKg: project.steelKg,
  concreteM3: project.concreteM3,
}));

const statusCounts = Object.entries(
  projects.reduce<Record<string, number>>((counts, project) => {
    counts[project.status] = (counts[project.status] ?? 0) + 1;
    return counts;
  }, {}),
).map(([status, count]) => ({
  status: status as ProjectPrototype["status"],
  count,
}));

export function DashboardCharts() {
  return (
    <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
      <Card className="rounded-md">
        <CardHeader className="p-4">
          <CardTitle className="text-base">
            Steel &amp; concrete by project
          </CardTitle>
        </CardHeader>
        <CardContent className="h-72 p-4 pt-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={quantityData} margin={{ left: 4, right: 4 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={GRID_COLOR}
                vertical={false}
              />
              <XAxis
                dataKey="name"
                tick={{ fill: AXIS_COLOR, fontSize: 12 }}
                axisLine={{ stroke: GRID_COLOR }}
                tickLine={false}
              />
              <YAxis
                yAxisId="steel"
                tick={{ fill: AXIS_COLOR, fontSize: 12 }}
                axisLine={{ stroke: GRID_COLOR }}
                tickLine={false}
                width={56}
              />
              <YAxis
                yAxisId="concrete"
                orientation="right"
                tick={{ fill: AXIS_COLOR, fontSize: 12 }}
                axisLine={{ stroke: GRID_COLOR }}
                tickLine={false}
                width={48}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value, key) =>
                  key === "steelKg"
                    ? [`${Number(value).toLocaleString()} kg`, "Steel"]
                    : [`${Number(value).toLocaleString()} m3`, "Concrete"]
                }
              />
              <Legend
                formatter={(value) =>
                  value === "steelKg" ? "Steel (kg)" : "Concrete (m3)"
                }
                wrapperStyle={{ fontSize: 12, color: AXIS_COLOR }}
              />
              <Bar
                yAxisId="steel"
                dataKey="steelKg"
                fill={STEEL_COLOR}
                radius={[4, 4, 0, 0]}
              />
              <Bar
                yAxisId="concrete"
                dataKey="concreteM3"
                fill={CONCRETE_COLOR}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="rounded-md">
        <CardHeader className="p-4">
          <CardTitle className="text-base">Project status</CardTitle>
        </CardHeader>
        <CardContent className="h-72 p-4 pt-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value, _key, entry) => [
                  value,
                  STATUS_LABELS[
                    (entry.payload as { status: ProjectPrototype["status"] })
                      .status
                  ],
                ]}
              />
              <Legend
                formatter={(_value, entry) => {
                  const payload = entry.payload as unknown as {
                    status: ProjectPrototype["status"];
                  };
                  return STATUS_LABELS[payload.status];
                }}
                wrapperStyle={{ fontSize: 12, color: AXIS_COLOR }}
              />
              <Pie
                data={statusCounts}
                dataKey="count"
                nameKey="status"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
              >
                {statusCounts.map((entry) => (
                  <Cell key={entry.status} fill={STATUS_COLORS[entry.status]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
