import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Save } from "lucide-react";

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

export function NewProjectPage() {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = React.useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="w-fit">
        <Link to="/projects">
          <ArrowLeft /> Back to projects
        </Link>
      </Button>

      <PageHeader
        eyebrow="Project setup"
        title="New project"
        description="Create a foundation package with project ownership, site location, and status ready for pile scheduling."
        actions={<Badge variant="outline">Engineer action</Badge>}
      />

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card className="rounded-md">
          <CardHeader className="p-4">
            <CardTitle className="text-base">Project details</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="project-name">Project name</Label>
                  <Input
                    id="project-name"
                    defaultValue="Apapa Wharf Berth 4 Foundation"
                    placeholder="e.g. Lekki Coastal Bridge - Package B"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client">Client</Label>
                  <Input
                    id="client"
                    defaultValue="Nigerian Ports Authority"
                    placeholder="Client, owner, or contractor"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    defaultValue="Apapa Port, Lagos"
                    placeholder="Site location"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select defaultValue="ACTIVE">
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="ON_HOLD">On hold</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  defaultValue="Marine berth foundation package covering driven cast in-situ piles and BOQ certification."
                  placeholder="Scope, contract package, or construction notes"
                />
              </div>

              {submitted ? (
                <div className="flex flex-col gap-3 rounded-md border border-accent/30 bg-accent/10 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 text-accent" />
                    <div>
                      <p className="font-medium">Project details saved</p>
                      <p className="text-sm text-muted-foreground">
                        The project is ready for pile schedule import and quantity
                        review.
                      </p>
                    </div>
                  </div>
                  <Button type="button" onClick={() => navigate("/projects")}>
                    Return to list
                  </Button>
                </div>
              ) : null}

              <div className="flex flex-wrap justify-end gap-2 border-t pt-4">
                <Button asChild variant="outline" type="button">
                  <Link to="/projects">Cancel</Link>
                </Button>
                <Button type="submit">
                  <Save /> Save project
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="rounded-md">
          <CardHeader className="p-4">
            <CardTitle className="text-base">Setup checklist</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-4 pt-0 text-sm text-muted-foreground">
            <div className="rounded-md border p-3">
              <p className="font-medium text-foreground">Required fields</p>
              <p>Project name, client, location, and current status.</p>
            </div>
            <div className="rounded-md border p-3">
              <p className="font-medium text-foreground">Next step</p>
              <p>Add piles manually or import a pile schedule from CSV.</p>
            </div>
            <div className="rounded-md border p-3">
              <p className="font-medium text-foreground">Review checks</p>
              <p>Confirm the package belongs to the correct client and site.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
