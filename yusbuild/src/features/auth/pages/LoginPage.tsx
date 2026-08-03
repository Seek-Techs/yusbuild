import * as React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, LogIn } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { InlineLoader } from "@/components/shared/Loaders";
import { Logo } from "@/components/shared/Logo";
import { Footer } from "@/layouts/Footer";
import { useAuth } from "@/hooks/useAuth";
import { loginSchema, type LoginValues } from "../schemas/login";

/**
 * Sign-in page.
 *
 * Also serves as the reference react-hook-form + zod pattern for domain teams:
 * schema-driven validation, `<Form>` primitives for accessible labelling and
 * error wiring, and a form-level error for failures that are not field-specific.
 *
 * Note the field is **username**, not email — the backend is SimpleJWT's
 * TokenObtainPairView, which authenticates against Django's username field.
 */
export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading } = useAuth();
  const [formError, setFormError] = React.useState("");

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  // Where the user was headed before ProtectedRoute intercepted them.
  const from =
    (location.state as { from?: { pathname?: string } } | null)?.from
      ?.pathname ?? "/dashboard";

  async function onSubmit(values: LoginValues) {
    setFormError("");

    try {
      await login(values.username, values.password);
      navigate(from, { replace: true });
    } catch {
      // The backend returns 401 with no field attribution, so this is a
      // form-level error rather than one bound to username or password.
      setFormError(
        "We could not sign you in. Check your username and password, then try again.",
      );
    }
  }

  return (
    <div className="grid min-h-svh bg-muted/30 lg:grid-cols-[1fr_460px]">
      <section className="hidden border-r bg-background p-10 lg:flex lg:flex-col lg:justify-between">
        <Logo withText withTagline />
        <div className="max-w-xl space-y-4">
          <p className="text-overline text-brand">Engineering workflow</p>
          <h1 className="text-4xl font-semibold tracking-normal">
            Track pile records, calculations, and BOQ outputs in one workspace.
          </h1>
          <p className="text-base text-muted-foreground">
            Sign in to manage project quantities, review calculation history,
            and prepare auditable exports for site and commercial teams.
          </p>
        </div>
        <div className="space-y-2">
          <p className="text-body text-muted-foreground">
            Built for engineering review, quantity assurance, and certification.
          </p>
          <Footer />
        </div>
      </section>

      <main className="flex items-center justify-center p-4">
        <Card className="w-full max-w-md rounded-md">
          <CardHeader className="p-6">
            <CardTitle className="text-h2">Sign in</CardTitle>
            <p className="text-body text-muted-foreground">
              Use your YusBuild project account.
            </p>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <Form {...form}>
              <form
                className="space-y-4"
                onSubmit={form.handleSubmit(onSubmit)}
                noValidate
              >
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input
                          autoComplete="username"
                          // Sign-in is a single-purpose page whose only action
                          // is this form, so focusing the first field matches
                          // the user's intent rather than hijacking it. This
                          // is the narrow case the rule allows for.
                          // eslint-disable-next-line jsx-a11y/no-autofocus
                          autoFocus
                          placeholder="your.username"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          autoComplete="current-password"
                          placeholder="Password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {formError ? (
                  <div
                    role="alert"
                    className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive-muted p-3 text-body text-destructive-muted-foreground"
                  >
                    <AlertCircle
                      className="mt-0.5 h-4 w-4 shrink-0"
                      aria-hidden="true"
                    />
                    <span>{formError}</span>
                  </div>
                ) : null}

                <Button className="w-full" type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <InlineLoader label="Signing in" />
                  ) : (
                    <>
                      <LogIn aria-hidden="true" /> Sign in
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
