import * as React from "react";

export interface ErrorFallbackProps {
  error: Error;
  reset: () => void;
}

export interface ErrorBoundaryProps {
  children: React.ReactNode;
  /** Rendered in place of children when an error is caught. */
  fallback?: React.ComponentType<ErrorFallbackProps>;
  /** Called on reset — wire this to QueryErrorResetBoundary's `reset`. */
  onReset?: () => void;
  /** Called when an error is caught. Hook up error reporting here. */
  onError?: (error: Error, info: React.ErrorInfo) => void;
  /**
   * Clears the error when any of these change. Pass the route pathname so
   * navigating away from a broken screen recovers instead of staying stuck on
   * the fallback forever.
   */
  resetKeys?: unknown[];
}

interface ErrorBoundaryState {
  error: Error | null;
}

function DefaultFallback({ error, reset }: ErrorFallbackProps) {
  return (
    <div
      role="alert"
      className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-lg border bg-card p-8 text-center"
    >
      <h2 className="text-h2 text-card-foreground">Something went wrong</h2>
      <p className="max-w-prose text-body text-muted-foreground">
        {error.message || "An unexpected error occurred."}
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-2 inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-body font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        Try again
      </button>
    </div>
  );
}

function areKeysEqual(a: unknown[] = [], b: unknown[] = []): boolean {
  return a.length === b.length && a.every((value, i) => Object.is(value, b[i]));
}

/**
 * Error boundary.
 *
 * Still a class component — React provides no hook equivalent for
 * componentDidCatch.
 *
 * Pair with QueryErrorResetBoundary so "Try again" also resets failed queries;
 * otherwise the retry re-renders straight back into the same cached error:
 *
 *   <QueryErrorResetBoundary>
 *     {({ reset }) => (
 *       <ErrorBoundary onReset={reset} resetKeys={[pathname]}>
 *         …
 *       </ErrorBoundary>
 *     )}
 *   </QueryErrorResetBoundary>
 */
export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    this.props.onError?.(error, info);
    if (import.meta.env.DEV) {
      console.error("[ErrorBoundary]", error, info.componentStack);
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    if (
      this.state.error !== null &&
      !areKeysEqual(prevProps.resetKeys, this.props.resetKeys)
    ) {
      this.reset();
    }
  }

  reset = (): void => {
    this.props.onReset?.();
    this.setState({ error: null });
  };

  render(): React.ReactNode {
    const { error } = this.state;
    if (error === null) return this.props.children;

    const Fallback = this.props.fallback ?? DefaultFallback;
    return <Fallback error={error} reset={this.reset} />;
  }
}

/**
 * Last-resort boundary for the application root.
 *
 * Deliberately renders inline-styled markup with no dependency on the theme,
 * router, or query client — any of those may be exactly what failed. A reload
 * is the only offered recovery, because at this level nothing else is trusted.
 */
export class RootErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error("[RootErrorBoundary]", error, info.componentStack);
  }

  render(): React.ReactNode {
    const { error } = this.state;
    if (error === null) return this.props.children;

    return (
      <div
        role="alert"
        style={{
          minHeight: "100svh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.75rem",
          padding: "2rem",
          textAlign: "center",
          fontFamily: "system-ui, sans-serif",
          color: "#0f172a",
          background: "#ffffff",
        }}
      >
        <h1 style={{ fontSize: "1.5rem", fontWeight: 600, margin: 0 }}>
          YusBuild could not start
        </h1>
        <p style={{ margin: 0, color: "#64748b", maxWidth: "40rem" }}>
          {error.message || "An unexpected error occurred during startup."}
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          style={{
            marginTop: "0.5rem",
            height: "2.5rem",
            padding: "0 1rem",
            borderRadius: "0.375rem",
            border: "none",
            background: "#0a2472",
            color: "#ffffff",
            fontSize: "0.875rem",
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Reload
        </button>
      </div>
    );
  }
}
