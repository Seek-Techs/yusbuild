import { Link } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  ClipboardCheck,
  Cylinder,
  FolderKanban,
  Layers3,
  ListChecks,
  Table2,
  Weight,
} from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatKg, formatM3, piles, projects } from "../../data";
import { DashboardCharts } from "../components/DashboardCharts";

const stats = [
  {
    label: "Active projects",
    value: projects.filter((project) => project.status === "ACTIVE").length,
    icon: ClipboardCheck,
  },
  {
    label: "Tracked piles",
    value: piles.length,
    icon: Layers3,
  },
  {
    label: "Open workflow items",
    value: projects.reduce((total, project) => total + project.openItems, 0),
    icon: Activity,
  },
  {
    label: "Ready exports",
    value: 3,
    icon: Table2,
  },
];

export function DashboardPage() {
  const totalSteel = projects.reduce(
    (total, project) => total + project.steelKg,
    0,
  );
  const totalConcrete = projects.reduce(
    (total, project) => total + project.concreteM3,
    0,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operations"
        title="Operations dashboard"
        description="Monitor active foundation projects, pile quantities, review items, and BOQ readiness across engineering packages."
        actions={
          <Button asChild>
            <Link to="/_prototype/projects">
              Open projects <ArrowRight />
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="rounded-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.label}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="text-2xl font-semibold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <Card className="rounded-md">
          <CardHeader className="flex flex-row items-center gap-2 p-4">
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Active project packages</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-4 pt-0">
            {projects.map((project) => (
              <Link
                key={project.id}
                to={`/_prototype/projects/${project.id}`}
                className="flex flex-col gap-3 rounded-md border p-4 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{project.name}</p>
                    <Badge variant="secondary">{project.status}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {project.client} · {project.location}
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-3 text-right text-sm">
                  <span>
                    {project.piles > 0
                      ? `${project.piles} piles`
                      : "No piles imported"}
                  </span>
                  <span>{formatKg(project.steelKg)}</span>
                  <span>{formatM3(project.concreteM3)}</span>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-md">
          <CardHeader className="flex flex-row items-center gap-2 p-4">
            <ListChecks className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Review queue</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-4 pt-0">
            <div className="rounded-md border p-3">
              <p className="font-medium">
                4 pile records require engineering review
              </p>
              <p className="text-sm text-muted-foreground">
                Resolve field variances before final BOQ export.
              </p>
            </div>
            <div className="rounded-md border p-3">
              <p className="font-medium">1 project has no pile records</p>
              <p className="text-sm text-muted-foreground">
                Empty BOQ states are shown until pile schedules are imported.
              </p>
            </div>
            <div className="rounded-md border p-3">
              <p className="font-medium">Viewer access is read-only</p>
              <p className="text-sm text-muted-foreground">
                Write actions remain reserved for engineers and admins.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-md">
        <CardContent className="grid gap-4 p-4 sm:grid-cols-2">
          <div className="flex items-start gap-3">
            <Weight className="mt-1 h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">
                Total reinforcement steel
              </p>
              <p className="text-xl font-semibold">{formatKg(totalSteel)}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Cylinder className="mt-1 h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">
                Total concrete volume
              </p>
              <p className="text-xl font-semibold">{formatM3(totalConcrete)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <DashboardCharts />
    </div>
  );
}
