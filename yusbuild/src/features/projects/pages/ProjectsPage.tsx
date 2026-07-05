import { Link } from "react-router-dom";
import { Download, Eye, Plus, Search } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatKg,
  formatM3,
  projects,
} from "@/features/prototype/data";
import { useAuth } from "@/hooks/useAuth";

export function ProjectsPage() {
  const { user } = useAuth();
  const isViewer = user?.roles.includes("viewer") ?? false;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Project register"
        title="Projects"
        description="Manage active foundation packages, project totals, and BOQ entry points for engineering review."
        actions={
          <>
            <Button variant="outline" disabled={isViewer}>
              <Download /> Import
            </Button>
            <Button asChild={!isViewer} disabled={isViewer}>
              {isViewer ? (
                <>
                  <Plus /> New project
                </>
              ) : (
                <Link to="/projects/new">
                  <Plus /> New project
                </Link>
              )}
            </Button>
          </>
        }
      />

      <Card className="rounded-md">
        <CardContent className="space-y-4 p-4">
          <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search project, client, location" />
            </div>
            <Button variant="secondary">Status: all</Button>
            <Button variant="secondary">Role: {isViewer ? "viewer" : "engineer"}</Button>
          </div>

          {isViewer ? (
            <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
              Viewer mode: create, import, edit, and export actions are read-only
              for this account.
            </div>
          ) : null}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Piles</TableHead>
                <TableHead className="text-right">Steel</TableHead>
                <TableHead className="text-right">Concrete</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell>
                    <div className="font-medium">{project.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {project.client} · {project.location}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={project.status === "ACTIVE" ? "default" : "secondary"}>
                      {project.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{project.piles}</TableCell>
                  <TableCell className="text-right">{formatKg(project.steelKg)}</TableCell>
                  <TableCell className="text-right">{formatM3(project.concreteM3)}</TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="outline" size="sm">
                      <Link to={`/projects/${project.id}`}>
                        <Eye /> View
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
