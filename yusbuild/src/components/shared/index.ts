/**
 * The shared component library — the domain teams' import surface.
 *
 *   import { DataTable, StatCard, PageHeader } from "@/components/shared";
 *
 * Everything here is domain-agnostic by design. Before adding a component,
 * check it is genuinely generic across domains: a one-off that solves a single
 * screen belongs in `features/<domain>/components/` instead.
 *
 * See FRONTEND_PLATFORM.md for prop tables and usage guidance.
 */

// Page structure
export { PageHeader, type PageHeaderProps } from "./PageHeader";
export { Logo } from "./Logo";
export { Media, MediaThumb, type MediaProps } from "./Media";
export { ThemeToggle } from "./ThemeToggle";

// Data display
export {
  DataTable,
  type DataTableColumn,
  type DataTableProps,
} from "./DataTable";
export {
  StatCard,
  StatCardGrid,
  type StatCardProps,
  type StatTone,
} from "./StatCard";
export { Pagination, type PaginationProps } from "./Pagination";
export {
  StatusBadge,
  type StatusBadgeProps,
  type StatusDescriptor,
  type StatusMap,
  type StatusTone,
} from "./StatusBadge";

// Filtering
export { SearchInput, type SearchInputProps } from "./SearchInput";
export {
  FilterBar,
  FilterSelect,
  type FilterBarProps,
  type FilterOption,
  type FilterSelectProps,
} from "./FilterBar";

// States
export {
  EmptyState,
  ErrorState,
  type EmptyStateProps,
  type ErrorStateProps,
  type ErrorVariant,
} from "./EmptyState";
export {
  CardSkeleton,
  FullPageLoader,
  InlineLoader,
  PageSkeleton,
  TableSkeleton,
} from "./Loaders";
export {
  ErrorBoundary,
  RootErrorBoundary,
  type ErrorBoundaryProps,
  type ErrorFallbackProps,
} from "./ErrorBoundary";

// Forms
export {
  FormPageLayout,
  SuccessBanner,
  type FormPageLayoutProps,
} from "./FormPageLayout";
export { DatePicker, type DatePickerProps } from "./DatePicker";
export { FileDropzone, type FileDropzoneProps } from "./FileDropzone";

// Detail screens
export { DetailTabs, type DetailTab, type DetailTabsProps } from "./DetailTabs";
export {
  DescriptionList,
  InfoTile,
  InfoTileList,
  type InfoTileProps,
} from "./InfoTile";

// Actions and permissions
export { ConfirmDialog, type ConfirmDialogProps } from "./ConfirmDialog";
export { RoleGate, type RoleGateProps } from "./RoleGate";
// Role predicates live in @/hooks/useRole (a hooks module cannot be re-exported
// from a component barrel without breaking React Fast Refresh).
