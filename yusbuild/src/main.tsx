import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";

// Self-hosted so the app has no runtime dependency on a font CDN — this is a
// tool used on construction sites with unreliable connectivity. Imported before
// index.css so the @font-face rules are registered first.
import "@fontsource-variable/inter";
import "./index.css";

import { RootErrorBoundary } from "@/components/shared/ErrorBoundary";
import { queryClient } from "@/lib/query/client";
import { ThemeProvider } from "@/providers/ThemeProvider";

import App from "./App.tsx";

/**
 * Application entry point.
 *
 * Provider order matters, and two of these are easy to get backwards:
 *
 *   RootErrorBoundary  — outermost, and dependency-free: the thing that failed
 *                        may be the theme, the router, or the query client.
 *   ThemeProvider      — wraps everything so even error fallbacks are themed.
 *   QueryClientProvider— must sit ABOVE AuthProvider. AuthProvider needs
 *                        useQueryClient() to clear the cache on logout;
 *                        without that, the next user on a shared site tablet
 *                        sees the previous user's cached data.
 *
 * BrowserRouter and AuthProvider live inside <App /> (src/routes/index.tsx),
 * with the router above AuthProvider so the auth layer can call navigate() when
 * a token refresh fails.
 */
const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element #root not found in index.html");
}

createRoot(rootElement).render(
  <StrictMode>
    <RootErrorBoundary>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </ThemeProvider>
    </RootErrorBoundary>
  </StrictMode>,
);
