/**
 * Chart building blocks.
 *
 * Always take colours from `useChartTheme()`. Reading a CSS variable at module
 * scope resolves it once, before any theme is applied, and silently paints
 * light-mode colours on a dark page.
 */
export { ChartCard, type ChartCardProps } from "./ChartCard";
export { useChartTheme, type ChartTheme } from "./useChartTheme";
