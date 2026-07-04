export type FinancialMetric = {
  metric_name: string;
  value: number | null;
  unit?: string;
  period?: string;
  source_page: number;
};
