/**
 * Format a number as a compact currency string for chart axis labels.
 * e.g. 1200000 → "$1.2M", 450000 → "$450K", 1200 → "$1.2K"
 */
export function formatCurrencyCompact(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (abs >= 1_000_000_000) return `${sign}$${(abs / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(1)}K`;
  return `${sign}$${abs.toFixed(0)}`;
}

/**
 * Format a number as a compact value (no currency symbol).
 * e.g. 1200000 → "1.2M", 450000 → "450K"
 */
export function formatCompact(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (abs >= 1_000_000_000) return `${sign}${(abs / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}${(abs / 1_000).toFixed(1)}K`;
  return `${sign}${abs.toFixed(1)}`;
}

/**
 * Format a number as a percentage string for chart axis labels.
 */
export function formatPercentAxis(value: number): string {
  return `${value.toFixed(1)}%`;
}

/**
 * Format a metric value for display based on its unit.
 */
export function formatMetricValue(value: number | null, unit?: string | null): string {
  if (value === null || value === undefined) return 'N/A';
  if (unit === 'percent') return `${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}%`;
  if (unit === 'x') return `${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}x`;
  if (unit === 'USD' || unit === 'usd') return formatCurrencyCompact(value);
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

/**
 * Truncate long metric/label names for chart axes.
 */
export function truncateLabel(label: string, maxLength = 16): string {
  if (label.length <= maxLength) return label;
  return `${label.slice(0, maxLength - 1)}…`;
}

/**
 * Prettify a metric_name key into a display name.
 * e.g. "operating_cash_flow" → "Operating Cash Flow"
 */
export function prettifyMetricName(metricName: string): string {
  return metricName
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
