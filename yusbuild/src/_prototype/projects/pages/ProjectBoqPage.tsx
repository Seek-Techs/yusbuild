import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Download, FileSpreadsheet } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { PrototypeState } from "@/components/shared/PrototypeState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { boqLines, findProject, formatKg, formatM3 } from "../../data";

export function ProjectBoqPage() {
  const { projectId } = useParams();
  const project = findProject(projectId);
  const hasPiles = project.piles > 0;
  const totalSteel = boqLines.reduce((total, line) => total + line.steelKg, 0);
  const totalConcrete = boqLines.reduce(
    (total, line) => total + line.concreteM3,
    0,
  );

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="w-fit">
        <Link to={`/_prototype/projects/${project.id}`}>
          <ArrowLeft /> Back to project
        </Link>
      </Button>

      <PageHeader
        eyebrow="Bill of quantities"
        title={`BOQ · ${project.name}`}
        description="Review reinforcement steel and concrete totals by pile type before export."
        actions={
          <>
            <Button variant="outline" disabled={!hasPiles}>
              <Download /> CSV
            </Button>
            <Button disabled={!hasPiles}>
              <FileSpreadsheet /> XLSX
            </Button>
          </>
        }
      />

      {!hasPiles ? (
        <PrototypeState
          state="empty"
          label="No piles exist for this project, so the BOQ table remains empty."
        />
      ) : (
        <Card className="rounded-md">
          <CardHeader className="flex flex-row items-center justify-between p-4">
            <CardTitle className="text-base">BOQ by pile type</CardTitle>
            <Badge variant="outline">Export ready</Badge>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pile type</TableHead>
                  <TableHead className="text-right">Count</TableHead>
                  <TableHead className="text-right">Steel</TableHead>
                  <TableHead className="text-right">Concrete</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {boqLines.map((line) => (
                  <TableRow key={line.pileType}>
                    <TableCell className="font-medium">
                      {line.pileType}
                    </TableCell>
                    <TableCell className="text-right">{line.count}</TableCell>
                    <TableCell className="text-right">
                      {formatKg(line.steelKg)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatM3(line.concreteM3)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell>Total</TableCell>
                  <TableCell className="text-right">{project.piles}</TableCell>
                  <TableCell className="text-right">
                    {formatKg(totalSteel)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatM3(totalConcrete)}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
