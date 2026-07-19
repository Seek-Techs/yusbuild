import { Link, useParams } from "react-router-dom";
import { ArrowLeft, History, RefreshCw } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  findPile,
  formatKg,
  formatM3,
  projects,
} from "@/features/prototype/data";
import { useAuth } from "@/hooks/useAuth";

const breakdownRows = [
  { label: "Main bars", value: "585.831 kg", detail: "Y16 + Y25 sections" },
  { label: "Helix", value: "52.367 kg", detail: "Y8 @ 250 mm pitch" },
  { label: "Stiffeners", value: "24.264 kg", detail: "Y16 rings @ 2.5 m" },
  { label: "Concrete", value: "4.163 m3", detail: "500 mm dia x actual length" },
];

export function PileDetailPage() {
  const { pileId } = useParams();
  const pile = findPile(pileId);
  const project = projects.find((item) => item.id === pile.projectId);
  const { user } = useAuth();
  const isViewer = user?.roles.includes("viewer") ?? false;

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="w-fit">
        <Link to="/piles">
          <ArrowLeft /> Back to piles
        </Link>
      </Button>

      <PageHeader
        eyebrow="Calculation detail"
        title={`${pile.pileNo} calculation`}
        description={`${project?.name}. Pile attributes, persisted calculation summary, recalculate affordance, and history preview.`}
        actions={
          <Button disabled={isViewer}>
            <RefreshCw /> Recalculate
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="rounded-md">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Pile type</p>
            <p className="text-xl font-semibold">{pile.pileType}</p>
          </CardContent>
        </Card>
        <Card className="rounded-md">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Diameter</p>
            <p className="text-xl font-semibold">{pile.diameterMm} mm</p>
          </CardContent>
        </Card>
        <Card className="rounded-md">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Steel</p>
            <p className="text-xl font-semibold">{formatKg(pile.steelKg)}</p>
          </CardContent>
        </Card>
        <Card className="rounded-md">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Concrete</p>
            <p className="text-xl font-semibold">{formatM3(pile.concreteM3)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card className="rounded-md">
          <CardHeader className="p-4">
            <CardTitle className="text-base">Calculation breakdown</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Detail</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {breakdownRows.map((row) => (
                  <TableRow key={row.label}>
                    <TableCell className="font-medium">{row.label}</TableCell>
                    <TableCell>{row.detail}</TableCell>
                    <TableCell className="text-right">{row.value}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="rounded-md">
          <CardHeader className="flex flex-row items-center justify-between p-4">
            <CardTitle className="text-base">History preview</CardTitle>
            <History className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-3 p-4 pt-0">
            {["Pile created", "Quantity inputs updated", "Manual recalculation"].map(
              (event, index) => (
                <div key={event} className="rounded-md border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium">{event}</p>
                    <Badge variant="outline">v{index + 1}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Calculation history and quantity audit record
                  </p>
                </div>
              ),
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
