import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Calculator, FileText, Plus } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { PrototypeState } from "@/components/shared/PrototypeState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  findProject,
  formatKg,
  formatM3,
  pilesForProject,
} from "@/features/prototype/data";
import { useAuth } from "@/hooks/useAuth";

export function ProjectDetailPage() {
  const { projectId } = useParams();
  const project = findProject(projectId);
  const projectPiles = pilesForProject(project.id);
  const { user } = useAuth();
  const isViewer = user?.roles.includes("viewer") ?? false;

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="w-fit">
        <Link to="/projects">
          <ArrowLeft /> Back to projects
        </Link>
      </Button>

      <PageHeader
        eyebrow="Project detail"
        title={project.name}
        description={`${project.client} - ${project.location}. Review pile quantities, calculation status, BOQ totals, and recent project activity.`}
        actions={
          <>
            <Button asChild variant="outline">
              <Link to={`/projects/${project.id}/boq`}>
                <FileText /> BOQ
              </Link>
            </Button>
            <Button disabled={isViewer}>
              <Plus /> Add pile
            </Button>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="rounded-md">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Status</p>
            <Badge className="mt-2">{project.status}</Badge>
          </CardContent>
        </Card>
        <Card className="rounded-md">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Piles</p>
            <p className="text-xl font-semibold">{project.piles}</p>
          </CardContent>
        </Card>
        <Card className="rounded-md">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Steel</p>
            <p className="text-xl font-semibold">{formatKg(project.steelKg)}</p>
          </CardContent>
        </Card>
        <Card className="rounded-md">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Concrete</p>
            <p className="text-xl font-semibold">{formatM3(project.concreteM3)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Card className="rounded-md">
          <CardHeader className="flex flex-row items-center justify-between p-4">
            <CardTitle className="text-base">Piles in project</CardTitle>
            <Badge variant="outline">Project scope</Badge>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {projectPiles.length === 0 ? (
              <PrototypeState
                state="empty"
                label="No pile records have been added for this project."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pile</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Actual length</TableHead>
                    <TableHead className="text-right">Steel</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projectPiles.map((pile) => (
                    <TableRow key={pile.id}>
                      <TableCell className="font-medium">{pile.pileNo}</TableCell>
                      <TableCell>{pile.pileType}</TableCell>
                      <TableCell className="text-right">{pile.actualLengthM} m</TableCell>
                      <TableCell className="text-right">{formatKg(pile.steelKg)}</TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="outline" size="sm">
                          <Link to={`/piles/${pile.id}`}>Open</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-md">
          <CardHeader className="p-4">
            <CardTitle className="text-base">Project controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-4 pt-0">
            <div className="rounded-md border p-3">
              <div className="flex items-center gap-2 font-medium">
                <Calculator className="h-4 w-4" /> Calculation summary
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Review current reinforcement, concrete, and calculation totals.
              </p>
            </div>
            <div className="rounded-md border p-3">
              <div className="flex items-center gap-2 font-medium">
                <FileText className="h-4 w-4" /> BOQ export
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Generate commercial-ready BOQ exports for quantity review.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
