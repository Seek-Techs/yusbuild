import { Link } from "react-router-dom";
import { FileUp, Plus, Search } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { PrototypeState } from "@/components/shared/PrototypeState";
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
  piles,
  projects,
} from "@/features/prototype/data";
import { useAuth } from "@/hooks/useAuth";

export function PilesPage() {
  const { user } = useAuth();
  const isViewer = user?.roles.includes("viewer") ?? false;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Pile register"
        title="Piles"
        description="Manage pile records, calculation status, CSV imports, and engineering review actions."
        actions={
          <>
            <Button variant="outline" disabled={isViewer}>
              <FileUp /> Import CSV
            </Button>
            <Button asChild={!isViewer} disabled={isViewer}>
              {isViewer ? (
                <>
                  <Plus /> New pile
                </>
              ) : (
                <Link to="/piles/new">
                  <Plus /> New pile
                </Link>
              )}
            </Button>
          </>
        }
      />

      <Card className="rounded-md">
        <CardContent className="space-y-4 p-4">
          <div className="grid gap-3 md:grid-cols-[1fr_auto_auto_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search pile number or site location" />
            </div>
            <Button variant="secondary">Project: all</Button>
            <Button variant="secondary">Type: all</Button>
            <Button variant="secondary">Diameter: all</Button>
          </div>

          <PrototypeState
            state="error"
            label="CSV import validation: 3 rows need project, pile type, or length corrections."
          />

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pile</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Diameter</TableHead>
                <TableHead className="text-right">Steel</TableHead>
                <TableHead className="text-right">Concrete</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {piles.map((pile) => {
                const project = projects.find((item) => item.id === pile.projectId);
                return (
                  <TableRow key={pile.id}>
                    <TableCell className="font-medium">{pile.pileNo}</TableCell>
                    <TableCell>{project?.name}</TableCell>
                    <TableCell>{pile.pileType}</TableCell>
                    <TableCell className="text-right">{pile.diameterMm} mm</TableCell>
                    <TableCell className="text-right">{formatKg(pile.steelKg)}</TableCell>
                    <TableCell className="text-right">{formatM3(pile.concreteM3)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={pile.state === "Needs review" ? "destructive" : "secondary"}
                      >
                        {pile.state}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="outline" size="sm">
                        <Link to={`/piles/${pile.id}`}>Open</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
