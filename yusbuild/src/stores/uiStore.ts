import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Device-local UI preferences.
 *
 * SCOPE — read this before adding anything here.
 *
 * This store holds ONLY UI preferences that should survive navigation and
 * reload on this device. That is a deliberately narrow remit:
 *
 *   ✓ sidebar collapsed          persisted, survives reload
 *   ✓ table density preference   (when added)
 *   ✓ dismissed banner ids       (when added)
 *
 *   ✗ server data                → TanStack Query owns this. Caching it here
 *                                  duplicates the cache and goes stale.
 *   ✗ auth tokens / current user → lib/auth + AuthProvider.
 *   ✗ table filters, search, page → the URL (useDataTableParams). Putting them
 *                                  here breaks shareable links and the back
 *                                  button.
 *   ✗ dialog open/closed, selected row → local useState. Ephemeral, and
 *                                  scoped to one component.
 *
 * The mobile drawer's open state is deliberately NOT here: it must not persist
 * across reloads, and only one component needs it.
 */

interface UiState {
  /** Desktop sidebar collapsed to an icon rail. */
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
    }),
    {
      name: "yusbuild-ui",
      version: 1,
    },
  ),
);
