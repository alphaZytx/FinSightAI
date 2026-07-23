import { useMemo } from 'react';
import { useTheme } from '../context/ThemeContext';

/**
 * Returns chart color tokens from CSS custom properties, keyed to the current
 * theme so Recharts picks up the right palette in both light and dark mode.
 */
export function useChartColors() {
  const { theme } = useTheme();

  return useMemo(() => {
    const style = getComputedStyle(document.documentElement);
    const get = (name: string) => style.getPropertyValue(name).trim();

    return {
      grid:            get('--chart-grid')            || '#1e3050',
      axis:            get('--chart-axis')            || '#64748b',
      tooltipBg:       get('--chart-tooltip-bg')      || '#131c2e',
      tooltipBorder:   get('--chart-tooltip-border')  || '#1e3050',
      tooltipText:     get('--chart-tooltip-text')    || '#94a3b8',
      linePrimary:     get('--chart-line-primary')     || '#3b82f6',
      lineSecondary:   get('--chart-line-secondary')   || '#4ade80',
      barPrimary:      get('--chart-bar-primary')      || '#22d3ee',
      barDebt:         get('--chart-bar-debt')         || '#f87171',
      barEquity:       get('--chart-bar-equity')       || '#a78bfa',
      radarPrimary:    get('--chart-radar-primary')    || '#3b82f6',
      radarSecondary:  get('--chart-radar-secondary')  || '#64748b',
      legendText:      get('--chart-legend-text')      || '#94a3b8',
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme]);
}

/**
 * Extended color palette for multi-company / multi-series charts.
 * These are vibrant, visually distinct colors that work on both dark and light backgrounds.
 */
export const CHART_PALETTE = [
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#8b5cf6', // Violet
  '#ef4444', // Red
  '#06b6d4', // Cyan
  '#ec4899', // Pink
  '#84cc16', // Lime
  '#f97316', // Orange
  '#6366f1', // Indigo
];

/**
 * Returns a standard Recharts tooltip style object from chart colors.
 */
export function buildTooltipStyle(c: ReturnType<typeof useChartColors>) {
  return {
    contentStyle: {
      backgroundColor: c.tooltipBg,
      border: `1px solid ${c.tooltipBorder}`,
      borderRadius: '8px',
      fontSize: '12px',
    },
    labelStyle: { color: c.tooltipText },
  };
}
