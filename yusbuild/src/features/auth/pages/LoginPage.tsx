import * as React from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, LogIn } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";

export function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();
  const [email, setEmail] = React.useState("suba.engineer@yusbuild.local");
  const [password, setPassword] = React.useState("password");
  const [error, setError] = React.useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    try {
      await login(email, password);
      navigate("/dashboard");
    } catch {
      setError("Invalid credentials. Use a valid project account to continue.");
    }
  }

  return (
    <div className="grid min-h-screen bg-muted/30 lg:grid-cols-[1fr_460px]">
      <section className="hidden border-r bg-background p-10 lg:flex lg:flex-col lg:justify-between">
        <div>
          <p className="text-lg font-semibold">YusBuild</p>
          <p className="text-sm text-muted-foreground">Reinforcement quantity control</p>
        </div>
        <div className="max-w-xl space-y-4">
          <p className="text-sm font-semibold uppercase tracking-wider text-accent">
            Engineering workflow
          </p>
          <h1 className="text-4xl font-semibold tracking-normal">
            Track pile records, calculations, and BOQ outputs in one workspace.
          </h1>
          <p className="text-base text-muted-foreground">
            Sign in to manage project quantities, review calculation history, and
            prepare auditable exports for site and commercial teams.
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          Built for engineering review, quantity assurance, and certification.
        </p>
      </section>

      <main className="flex items-center justify-center p-4">
        <Card className="w-full max-w-md rounded-md">
          <CardHeader className="p-6">
            <CardTitle className="text-xl">Sign in</CardTitle>
            <p className="text-sm text-muted-foreground">
              Use your project account. Add "viewer" to the email to preview a
              read-only role.
            </p>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="name@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Password"
                />
              </div>
              {error ? (
                <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              ) : null}
              <Button className="w-full" type="submit" disabled={isLoading}>
                <LogIn /> {isLoading ? "Signing in" : "Sign in"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
