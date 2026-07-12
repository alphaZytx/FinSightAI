import type {
  ActivityItem,
  Agent,
  ChartDataPoint,
  Company,
  FinancialRatio,
  Notification,
  ResearchStep,
  StatCard,
} from '../types';

export const mockStats: StatCard[] = [
  { label: 'Research Sessions', value: 24, change: '+3 this week', icon: 'search' },
  { label: 'Uploaded Documents', value: 47, change: '+8 this month', icon: 'file' },
  { label: 'Companies Analyzed', value: 18, change: '+2 this week', icon: 'building' },
  { label: 'Reports Generated', value: 31, change: '+5 this month', icon: 'report' },
];

export const mockAgents: Agent[] = [
  { name: 'Document Agent', status: 'Ready' },
  { name: 'Extraction Agent', status: 'Ready' },
  { name: 'Red Flag Agent', status: 'Ready' },
  { name: 'Comparison Agent', status: 'Ready' },
  { name: 'Research Agent', status: 'Ready' },
  { name: 'Report Agent', status: 'Ready' },
];

export const mockActivities: ActivityItem[] = [
  {
    id: '1',
    type: 'upload',
    title: 'Q4 2025 Financial Report',
    description: 'Acme Corp annual report uploaded',
    timestamp: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: '2',
    type: 'analysis',
    title: 'AI Risk Analysis Complete',
    description: '3 red flags detected for TechFlow Inc',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: '3',
    type: 'report',
    title: 'Comparison Report Generated',
    description: 'Acme Corp vs TechFlow Inc analysis',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: '4',
    type: 'chat',
    title: 'AI Chat Session',
    description: 'Discussed debt-to-equity ratios',
    timestamp: new Date(Date.now() - 14400000).toISOString(),
  },
  {
    id: '5',
    type: 'upload',
    title: 'Balance Sheet Q3',
    description: 'GlobalTech balance sheet uploaded',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
  },
];

export const mockCompanies: Company[] = [
  {
    id: '1',
    name: 'Acme Corporation',
    industry: 'Manufacturing',
    uploadDate: '2026-07-08',
    analysisStatus: 'Complete',
  },
  {
    id: '2',
    name: 'TechFlow Inc',
    industry: 'Technology',
    uploadDate: '2026-07-09',
    analysisStatus: 'In Progress',
  },
  {
    id: '3',
    name: 'GlobalTech Solutions',
    industry: 'Software',
    uploadDate: '2026-07-10',
    analysisStatus: 'Complete',
  },
  {
    id: '4',
    name: 'GreenEnergy Ltd',
    industry: 'Energy',
    uploadDate: '2026-07-10',
    analysisStatus: 'Pending',
  },
  {
    id: '5',
    name: 'FinanceHub Corp',
    industry: 'Financial Services',
    uploadDate: '2026-07-11',
    analysisStatus: 'In Progress',
  },
];

export const mockResearchSteps: ResearchStep[] = [
  { id: '1', label: 'Document Uploaded', completed: true, active: false },
  { id: '2', label: 'Parsing', completed: true, active: false },
  { id: '3', label: 'Embedding Generated', completed: true, active: false },
  { id: '4', label: 'Metrics Extracted', completed: false, active: true },
  { id: '5', label: 'Red Flags Detected', completed: false, active: false },
  { id: '6', label: 'Report Generated', completed: false, active: false },
];

export const mockNotifications: Notification[] = [
  {
    id: '1',
    message: 'Report generated successfully.',
    type: 'success',
    timestamp: new Date(Date.now() - 900000).toISOString(),
    read: false,
  },
  {
    id: '2',
    message: 'New document uploaded.',
    type: 'info',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    read: false,
  },
  {
    id: '3',
    message: 'AI analysis completed.',
    type: 'success',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    read: true,
  },
  {
    id: '4',
    message: 'Red flags detected.',
    type: 'warning',
    timestamp: new Date(Date.now() - 14400000).toISOString(),
    read: true,
  },
];

export const revenueData: ChartDataPoint[] = [
  { period: 'Q1', value: 2.4 },
  { period: 'Q2', value: 2.8 },
  { period: 'Q3', value: 3.1 },
  { period: 'Q4', value: 3.6 },
  { period: 'Q1', value: 4.0 },
];

export const profitData: ChartDataPoint[] = [
  { period: 'Q1', value: 0.4 },
  { period: 'Q2', value: 0.5 },
  { period: 'Q3', value: 0.6 },
  { period: 'Q4', value: 0.7 },
  { period: 'Q1', value: 0.85 },
];

export const debtEquityData = [
  { period: 'Q1', debt: 1.2, equity: 2.8 },
  { period: 'Q2', debt: 1.1, equity: 3.0 },
  { period: 'Q3', debt: 1.0, equity: 3.2 },
  { period: 'Q4', debt: 0.9, equity: 3.5 },
  { period: 'Q1', debt: 0.8, equity: 3.8 },
];

export const cashFlowData: ChartDataPoint[] = [
  { period: 'Q1', value: 0.6 },
  { period: 'Q2', value: 0.75 },
  { period: 'Q3', value: 0.9 },
  { period: 'Q4', value: 1.1 },
  { period: 'Q1', value: 1.3 },
];

export const financialRatios: FinancialRatio[] = [
  { name: 'Current Ratio', value: 2.1, benchmark: 1.5 },
  { name: 'Debt/Equity', value: 0.45, benchmark: 0.6 },
  { name: 'ROE', value: 18.5, benchmark: 15 },
  { name: 'Profit Margin', value: 21.2, benchmark: 18 },
  { name: 'Quick Ratio', value: 1.6, benchmark: 1.0 },
];
