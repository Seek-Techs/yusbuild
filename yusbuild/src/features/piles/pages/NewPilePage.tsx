import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Calculator, CheckCircle2, Save } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { projects } from "@/features/prototype/data";

export function NewPilePage() {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = React.useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="w-fit">
        <Link to="/piles">
          <ArrowLeft /> Back to piles
        </Link>
      </Button>

      <PageHeader
        eyebrow="Pile setup"
        title="New pile"
        description="Capture pile geometry, construction data, and reinforcement type for quantity calculation."
        actions={<Badge variant="outline">Engineer action</Badge>}
      />

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card className="rounded-md">
          <CardHeader className="p-4">
            <CardTitle className="text-base">Pile details</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Project</Label>
                  <Select defaultValue={projects[0]?.id}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pile-no">Pile number</Label>
                  <Input id="pile-no" defaultValue="LCB-B-P037" placeholder="LCB-B-P001" />
                </div>

                <div className="space-y-2">
                  <Label>Pile type</Label>
                  <Select defaultValue="TYPE_II">
                    <SelectTrigger>
                      <SelectValue placeholder="Select pile type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TYPE_I">TYPE_I</SelectItem>
                      <SelectItem value="TYPE_II">TYPE_II</SelectItem>
                      <SelectItem value="TYPE_III">TYPE_III</SelectItem>
                      <SelectItem value="BORED">BORED</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="diameter">Diameter</Label>
                  <Input id="diameter" defaultValue="500" inputMode="numeric" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="design-length">Design length</Label>
                  <Input id="design-length" defaultValue="20.0" inputMode="decimal" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="actual-length">Actual length</Label>
                  <Input id="actual-length" defaultValue="21.2" inputMode="decimal" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="method">Piling method</Label>
                  <Input
                    id="method"
                    defaultValue="Driven Cast In-Situ"
                    placeholder="Piling method"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="grade">Concrete grade</Label>
                  <Input id="grade" defaultValue="C35/40" placeholder="C35/40" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  defaultValue="Installed at Pier B gridline 4 with no obstruction recorded."
                  placeholder="Obstructions, remarks, test notes"
                />
              </div>

              {submitted ? (
                <div className="flex flex-col gap-3 rounded-md border border-accent/30 bg-accent/10 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 text-accent" />
                    <div>
                      <p className="font-medium">Pile record saved</p>
                      <p className="text-sm text-muted-foreground">
                        The record is ready for calculation review and BOQ inclusion.
                      </p>
                    </div>
                  </div>
                  <Button type="button" onClick={() => navigate("/piles")}>
                    Return to list
                  </Button>
                </div>
              ) : null}

              <div className="flex flex-wrap justify-end gap-2 border-t pt-4">
                <Button asChild variant="outline" type="button">
                  <Link to="/piles">Cancel</Link>
                </Button>
                <Button type="submit">
                  <Save /> Save pile
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="rounded-md">
          <CardHeader className="p-4">
            <CardTitle className="text-base">Calculation behavior</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-4 pt-0 text-sm text-muted-foreground">
            <div className="rounded-md border p-3">
              <p className="font-medium text-foreground">Required fields</p>
              <p>Project, pile number, type, diameter, and design/actual length.</p>
            </div>
            <div className="rounded-md border p-3">
              <p className="flex items-center gap-2 font-medium text-foreground">
                <Calculator className="h-4 w-4" /> Auto-calculation
              </p>
              <p>
                Steel and concrete quantities are calculated from type, diameter,
                design length, and actual length.
              </p>
            </div>
            <div className="rounded-md border p-3">
              <p className="font-medium text-foreground">Error states</p>
              <p>
                Check duplicate pile numbers, missing type configuration, invalid
                lengths, and read-only access.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
