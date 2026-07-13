import { type FormEvent, useEffect, useState } from 'react';
import { Upload, FileText, FileUp, Play, CheckCircle2, AlertCircle, FileSearch, Sigma, ShieldAlert, GitCompare, Trash2, Zap, Brain, ChevronDown, ChevronUp, TrendingUp, TrendingDown, Minus, BarChart3, PieChart, DollarSign, Landmark, Banknote, Activity } from 'lucide-react';
import { Card, Badge } from '../../components/Common';
import { uploadDocument, ingestDocument, listDocuments, deleteDocument, type DocumentUploadResponse, type IngestResponse } from '../../services/api/documents';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { useClearWorkspaceData } from '../../hooks/useClearWorkspaceData';
import type { AnalysisMetric, AnalysisRedFlag, ResearchStep } from '../../types';
import ResearchProgress from '../../components/Dashboard/ResearchProgress';

function formatMetric(value: number | null, unit?: string | null) {
  if (value === null || value === undefined) return 'Not reported';
  if (unit === 'percent') return `${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}%`;
  if (unit === 'x') return `${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}x`;
  return `${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}${unit ? ` ${unit}` : ''}`;
}

type LLMProvider = 'groq' | 'google';

// ── Metric categorization for display sections ──────────────────
const METRIC_CATEGORIES: Record<string, { label: string; icon: typeof DollarSign; metrics: string[] }> = {
  income: {
    label: 'Income Statement',
    icon: DollarSign,
    metrics: ['revenue', 'cost_of_revenue', 'gross_profit', 'operating_expenses', 'sga_expense', 'rd_expense', 'depreciation', 'ebitda', 'operating_income', 'interest_expense', 'pretax_income', 'tax_expense', 'net_income', 'eps', 'dps'],
  },
  margins: {
    label: 'Margins & Returns',
    icon: PieChart,
    metrics: ['gross_margin', 'operating_margin', 'net_margin', 'ebitda_margin', 'roe', 'roa', 'roce', 'revenue_growth'],
  },
  balance: {
    label: 'Balance Sheet',
    icon: Landmark,
    metrics: ['total_assets', 'current_assets', 'cash', 'short_term_investments', 'accounts_receivable', 'inventory', 'non_current_assets', 'ppe', 'goodwill', 'total_liabilities', 'current_liabilities', 'accounts_payable', 'short_term_debt', 'long_term_debt', 'total_debt', 'total_equity', 'book_value_per_share'],
  },
  cashflow: {
    label: 'Cash Flow',
    icon: Banknote,
    metrics: ['operating_cash_flow', 'capex', 'free_cash_flow', 'investing_cash_flow', 'financing_cash_flow', 'dividends_paid'],
  },
  ratios: {
    label: 'Financial Ratios',
    icon: Activity,
    metrics: ['current_ratio', 'debt_to_equity', 'debt_to_ebitda', 'interest_coverage', 'working_capital'],
  },
};

function categorizeMetrics(metrics: AnalysisMetric[]) {
  const categorized: Record<string, AnalysisMetric[]> = {};
  const uncategorized: AnalysisMetric[] = [];
  const allCategoryMetrics = new Set(Object.values(METRIC_CATEGORIES).flatMap(c => c.metrics));

  for (const metric of metrics) {
    let placed = false;
    for (const [key, cat] of Object.entries(METRIC_CATEGORIES)) {
      if (cat.metrics.includes(metric.metric_name)) {
        (categorized[key] ??= []).push(metric);
        placed = true;
        break;
      }
    }
    if (!placed && !allCategoryMetrics.has(metric.metric_name)) {
      uncategorized.push(metric);
    }
  }
  return { categorized, uncategorized };
}

function MetricCard({ metric }: { metric: AnalysisMetric }) {
  const conf = metric.confidence ?? 0;
  const confColor = conf >= 0.75 ? 'text-emerald-400' : conf >= 0.5 ? 'text-amber-400' : 'text-red-400';
  const confBg = conf >= 0.75 ? 'bg-emerald-500/10' : conf >= 0.5 ? 'bg-amber-500/10' : 'bg-red-500/10';

  return (
    <div className="rounded-lg border border-surface-700/30 bg-surface-800/40 p-3 hover:border-surface-600/50 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-primary-300 leading-tight">{metric.display_name || metric.metric_name}</p>
        <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${confBg} ${confColor}`}>
          {Math.round(conf * 100)}%
        </span>
      </div>
      <p className="mt-1.5 text-lg font-bold text-white leading-none">{formatMetric(metric.value, metric.unit)}</p>
      <div className="mt-2 flex items-center justify-between text-[10px]">
        <span className="text-surface-500">{metric.period || 'Not stated'}</span>
        <span className="text-surface-500">p. {metric.source_page ?? 'n/a'}</span>
      </div>
      {metric.extraction_method && (
        <div className="mt-1.5">
          <Badge variant={metric.extraction_method === 'derived_ratio' ? 'info' : metric.extraction_method === 'llm_review' ? 'warning' : 'neutral'}>
            {metric.extraction_method === 'derived_ratio' ? 'Derived' : metric.extraction_method === 'llm_review' ? 'AI Extracted' : 'Rule-based'}
          </Badge>
        </div>
      )}
    </div>
  );
}

function MetricSection({ categoryKey, metrics, defaultOpen = true }: { categoryKey: string; metrics: AnalysisMetric[]; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const cat = METRIC_CATEGORIES[categoryKey];
  if (!cat || metrics.length === 0) return null;
  const Icon = cat.icon;

  return (
    <div className="rounded-lg border border-surface-700/40 bg-surface-900/40 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-3 p-4 text-left hover:bg-surface-800/40 transition-colors"
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-500/10">
          <Icon className="h-4 w-4 text-primary-400" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-surface-100">{cat.label}</p>
          <p className="text-[10px] text-surface-500">{metrics.length} metric{metrics.length !== 1 ? 's' : ''} extracted</p>
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-surface-500" /> : <ChevronDown className="h-4 w-4 text-surface-500" />}
      </button>
      {open && (
        <div className="border-t border-surface-700/30 p-4">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {metrics.map((m) => <MetricCard key={m._id} metric={m} />)}
          </div>
        </div>
      )}
    </div>
  );
}

function ModelSelector({ value, onChange }: { value: LLMProvider; onChange: (v: LLMProvider) => void }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-surface-400">AI Model</label>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onChange('groq')}
          className={`flex items-center gap-2.5 rounded-lg border p-3 text-left transition-all ${
            value === 'groq'
              ? 'border-amber-500/60 bg-amber-500/10 shadow-sm shadow-amber-500/10'
              : 'border-surface-700 bg-surface-800/60 hover:border-surface-600'
          }`}
        >
          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
            value === 'groq' ? 'bg-amber-500/20' : 'bg-surface-700/60'
          }`}>
            <Zap className={`h-4 w-4 ${value === 'groq' ? 'text-amber-400' : 'text-surface-400'}`} />
          </div>
          <div className="min-w-0">
            <p className={`text-sm font-semibold ${value === 'groq' ? 'text-amber-300' : 'text-surface-300'}`}>Groq</p>
            <p className="text-[10px] leading-tight text-surface-500">Fast · Simple tasks</p>
          </div>
        </button>
        <button
          type="button"
          onClick={() => onChange('google')}
          className={`flex items-center gap-2.5 rounded-lg border p-3 text-left transition-all ${
            value === 'google'
              ? 'border-blue-500/60 bg-blue-500/10 shadow-sm shadow-blue-500/10'
              : 'border-surface-700 bg-surface-800/60 hover:border-surface-600'
          }`}
        >
          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
            value === 'google' ? 'bg-blue-500/20' : 'bg-surface-700/60'
          }`}>
            <Brain className={`h-4 w-4 ${value === 'google' ? 'text-blue-400' : 'text-surface-400'}`} />
          </div>
          <div className="min-w-0">
            <p className={`text-sm font-semibold ${value === 'google' ? 'text-blue-300' : 'text-surface-300'}`}>Google Gemini</p>
            <p className="text-[10px] leading-tight text-surface-500">Deep · Research & analysis</p>
          </div>
        </button>
      </div>
    </div>
  );
}

function PipelineStep({ label, icon: Icon, status, detail }: {
  label: string;
  icon: typeof FileSearch;
  status?: string;
  detail?: string;
}) {
  const successful = status === 'success';
  const failed = status === 'failed';
  return (
    <div className={`flex items-center gap-3 rounded-lg border p-3 transition-all ${
      successful ? 'border-emerald-500/30 bg-emerald-500/5' :
      failed ? 'border-red-500/30 bg-red-500/5' :
      'border-surface-700/40 bg-surface-900/40'
    }`}>
      <Icon className={`h-5 w-5 shrink-0 ${
        successful ? 'text-emerald-400' : failed ? 'text-red-400' : 'text-surface-500'
      }`} />
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${successful ? 'text-emerald-300' : failed ? 'text-red-300' : 'text-surface-300'}`}>{label}</p>
        {detail && <p className="text-xs text-surface-400 truncate">{detail}</p>}
      </div>
      {successful && <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />}
      {failed && <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />}
    </div>
  );
}

function PipelineResults({ result }: { result: IngestResponse }) {
  const doc = result.results.document;
  const extraction = result.results.extraction;
  const risks = result.results.red_flags;
  const comparison = result.results.comparison;

  const steps = [
    { label: 'Document index', icon: FileSearch, status: doc?.status, detail: doc?.output?.chunks_created ? `${doc.output.pages_processed ?? 0} pages · ${doc.output.chunks_created} chunks` : undefined },
    { label: 'Financial extraction', icon: Sigma, status: extraction?.status, detail: extraction?.output?.metrics_saved !== undefined ? `${extraction.output.metrics_saved} saved · ${extraction.output.derived_ratio_count ?? 0} derived` : undefined },
    { label: 'Risk scan', icon: ShieldAlert, status: risks?.status, detail: risks?.output?.red_flags_saved !== undefined ? `${risks.output.red_flags_saved} signals saved` : undefined },
    { label: 'Peer comparison', icon: GitCompare, status: comparison?.status, detail: comparison?.output?.coverage?.company_count ? `${comparison.output.coverage.company_count} companies in scope` : undefined },
  ];

  const allMetrics = (extraction?.output?.metrics as AnalysisMetric[] | undefined) ?? [];
  const allFlags = (risks?.output?.red_flags as AnalysisRedFlag[] | undefined) ?? [];
  const { categorized, uncategorized } = categorizeMetrics(allMetrics);

  return (
    <div className="space-y-5">
      {/* Pipeline Status */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold tracking-widest text-primary-400 uppercase">Ingestion complete</p>
          <h3 className="mt-1 text-lg font-semibold text-white">Agent Analysis Summary</h3>
        </div>
        <Badge variant="info">{result.document_id.slice(0, 8)}…</Badge>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {steps.map((step) => <PipelineStep key={step.label} {...step} />)}
      </div>

      {/* Extraction Summary Stats */}
      {allMetrics.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg border border-surface-700/30 bg-surface-800/40 p-3 text-center">
            <p className="text-2xl font-bold text-white">{allMetrics.length}</p>
            <p className="text-[10px] font-medium text-surface-400 uppercase tracking-wider">Total Metrics</p>
          </div>
          <div className="rounded-lg border border-surface-700/30 bg-surface-800/40 p-3 text-center">
            <p className="text-2xl font-bold text-emerald-400">{allMetrics.filter(m => (m.confidence ?? 0) >= 0.75).length}</p>
            <p className="text-[10px] font-medium text-surface-400 uppercase tracking-wider">High Confidence</p>
          </div>
          <div className="rounded-lg border border-surface-700/30 bg-surface-800/40 p-3 text-center">
            <p className="text-2xl font-bold text-blue-400">{allMetrics.filter(m => m.extraction_method === 'derived_ratio').length}</p>
            <p className="text-[10px] font-medium text-surface-400 uppercase tracking-wider">Derived Ratios</p>
          </div>
          <div className="rounded-lg border border-surface-700/30 bg-surface-800/40 p-3 text-center">
            <p className="text-2xl font-bold text-amber-400">{new Set(allMetrics.map(m => m.period).filter(Boolean)).size}</p>
            <p className="text-[10px] font-medium text-surface-400 uppercase tracking-wider">Periods Covered</p>
          </div>
        </div>
      )}

      {/* Categorized Metrics */}
      {allMetrics.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-semibold tracking-widest text-surface-400 uppercase">Extracted Financial Data</h4>
          {Object.entries(METRIC_CATEGORIES).map(([key]) =>
            categorized[key]?.length ? (
              <MetricSection key={key} categoryKey={key} metrics={categorized[key]} defaultOpen={key === 'income' || key === 'margins'} />
            ) : null
          )}
          {uncategorized.length > 0 && (
            <div className="rounded-lg border border-surface-700/40 bg-surface-900/40 p-4">
              <p className="mb-3 text-sm font-semibold text-surface-100">Other Financial Data</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {uncategorized.map((m) => <MetricCard key={m._id} metric={m} />)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Risk Signals — show ALL */}
      {allFlags.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold tracking-widest text-surface-400 uppercase">Risk Signals</h4>
            <Badge variant="error">{allFlags.length} detected</Badge>
          </div>
          <div className="space-y-2">
            {allFlags.map((flag) => (
              <div key={flag._id} className="rounded-lg border border-surface-700/30 bg-surface-800/40 p-4">
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                    flag.severity === 'critical' ? 'bg-red-500/20' :
                    flag.severity === 'high' ? 'bg-orange-500/20' :
                    flag.severity === 'medium' ? 'bg-amber-500/20' : 'bg-surface-700/40'
                  }`}>
                    <ShieldAlert className={`h-3.5 w-3.5 ${
                      flag.severity === 'critical' ? 'text-red-400' :
                      flag.severity === 'high' ? 'text-orange-400' :
                      flag.severity === 'medium' ? 'text-amber-400' : 'text-surface-400'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={flag.severity === 'critical' || flag.severity === 'high' ? 'error' : flag.severity === 'medium' ? 'warning' : 'neutral'}>{flag.severity}</Badge>
                      <span className="text-xs text-surface-400">{flag.company_name}</span>
                      <span className="text-xs text-surface-500">· {flag.category}</span>
                    </div>
                    <p className="text-sm font-medium text-surface-200">{flag.title}</p>
                    <p className="mt-1 text-xs text-surface-400 leading-relaxed">{flag.explanation}</p>
                    {flag.evidence && (
                      <p className="mt-2 rounded border border-surface-700/30 bg-surface-900/40 p-2 text-[10px] text-surface-500 italic leading-relaxed line-clamp-3">
                        "{flag.evidence}"
                      </p>
                    )}
                    <div className="mt-2 flex items-center gap-3 text-[10px] text-surface-500">
                      <span>p. {flag.source_page ?? 'n/a'}</span>
                      <span>Confidence: {Math.round((flag.confidence ?? 0) * 100)}%</span>
                      <span>{flag.detection_method}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AnalysisProgressOverlay({ companyName, isBusy }: { companyName: string, isBusy: boolean }) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isStepActive, setIsStepActive] = useState(true);
  const [visible, setVisible] = useState(false);

  const steps = [
    'Document Uploaded',
    'Parsing',
    'Embedding Generated',
    'Metrics Extracted',
    'Red Flags Detected',
    'Report Generated'
  ];

  useEffect(() => {
    if (isBusy) {
      setCurrentStepIndex(0);
      setIsStepActive(true);
      setVisible(true);
    }
  }, [isBusy]);

  useEffect(() => {
    if (!visible) return;

    let timeoutId: ReturnType<typeof setTimeout>;

    if (isBusy && currentStepIndex >= steps.length - 1 && isStepActive) {
      return; // Pause at the last step if still busy
    }

    if (currentStepIndex < steps.length) {
      if (isStepActive) {
        // Currently processing the step. Next state is completing it.
        let delay = 300;
        if (isBusy) {
          const unevenDelays = [
            150,   // Document Uploaded processing
            400,   // Parsing processing
            600,   // Embedding Generated processing
            300,   // Metrics Extracted processing
            500,   // Red Flags Detected processing
            300    // Report Generated processing
          ];
          delay = unevenDelays[currentStepIndex] || 500;
        } else {
          delay = 50; // Super fast if backend is already done
        }
        
        timeoutId = setTimeout(() => {
          setIsStepActive(false); // Mark step as complete
        }, delay);

      } else {
        // We are in the transition gap between steps
        let delay = 30; // Very short gap if backend is done
        if (isBusy) {
          delay = 100; // 100ms gap before the next step starts processing
        }
        
        timeoutId = setTimeout(() => {
          setCurrentStepIndex(prev => prev + 1);
          setIsStepActive(true); // Start processing next step
        }, delay);
      }
    }

    return () => clearTimeout(timeoutId);
  }, [isBusy, visible, currentStepIndex, isStepActive, steps.length]);

  const allDone = currentStepIndex >= steps.length || (currentStepIndex === steps.length - 1 && !isStepActive);

  useEffect(() => {
    if (!isBusy && allDone) {
      const timeout = setTimeout(() => {
        setVisible(false);
      }, 200);
      return () => clearTimeout(timeout);
    }
  }, [isBusy, allDone]);

  if (!visible) return null;

  const progressSteps: ResearchStep[] = steps.map((label, index) => {
    const isCompleted = index < currentStepIndex || (index === currentStepIndex && !isStepActive);
    const isActive = index === currentStepIndex && isStepActive;
    
    return {
      id: String(index + 1),
      label,
      completed: isCompleted,
      active: isActive
    };
  });

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-surface-950/80 backdrop-blur-sm p-4 transition-all duration-500 ${allDone && !isBusy ? 'opacity-0' : 'opacity-100'}`}>
      <div className="w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-300">
        <ResearchProgress steps={progressSteps} companyName={companyName} />
      </div>
    </div>
  );
}

export default function WorkspacePage() {
  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);
  const [companyName, setCompanyName] = useState('');
  const [fiscalYear, setFiscalYear] = useState('2025');
  const [documentType, setDocumentType] = useState('annual_report');
  const [autoIngest, setAutoIngest] = useState(true);
  const [llmProvider, setLlmProvider] = useState<LLMProvider>('groq');
  const [file, setFile] = useState<File | null>(null);
  const [uploaded, setUploaded] = useState<DocumentUploadResponse | null>(null);
  const [ingestResult, setIngestResult] = useState<IngestResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [documents, setDocuments] = useState<DocumentUploadResponse[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { clearAll, clearing: clearingAll } = useClearWorkspaceData();

  useEffect(() => {
    if (!activeWorkspaceId) return;
    setLoadingDocs(true);
    listDocuments(activeWorkspaceId)
      .then(setDocuments)
      .catch(() => {})
      .finally(() => setLoadingDocs(false));
  }, [activeWorkspaceId, uploaded]);

  async function deleteDoc(documentId: string) {
    if (!confirm('Delete this document and all its extracted data?')) return;
    setDeletingId(documentId);
    try {
      await deleteDocument(documentId);
      setDocuments((prev) => prev.filter((d) => d._id !== documentId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setDeletingId(null);
    }
  }

  async function clearAllData() {
    const cleared = await clearAll();
    if (!cleared) return;
    setDocuments([]);
    setUploaded(null);
    setIngestResult(null);
    setError(null);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!file || !activeWorkspaceId) return;
    setBusy(true);
    setError(null);
    setIngestResult(null);
    try {
      const formData = new FormData();
      formData.append('workspace_id', activeWorkspaceId);
      formData.append('company_name', companyName.trim());
      formData.append('fiscal_year', fiscalYear.trim());
      formData.append('document_type', documentType);
      formData.append('auto_ingest', String(autoIngest));
      formData.append('llm_provider', llmProvider);
      formData.append('file', file);
      const response = await uploadDocument(formData);
      setUploaded(response);
      if (response.ingestion_result) setIngestResult(response.ingestion_result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setBusy(false);
    }
  }

  async function runIngestion() {
    if (!uploaded) return;
    setBusy(true);
    setError(null);
    try {
      setIngestResult(await ingestDocument(uploaded._id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ingestion failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <AnalysisProgressOverlay isBusy={busy} companyName={uploaded?.company_name || companyName || 'Company'} />
      <div>
        <h1 className="text-2xl font-bold text-white">Workspace</h1>
        <p className="mt-1 text-sm text-surface-400">Upload and analyze financial documents</p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Upload Form */}
        <Card title="Upload Documents" subtitle="Ingest a financial filing">
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-surface-400">Company Name</label>
              <input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
                placeholder="Company Ltd"
                className="w-full rounded-lg border border-surface-700 bg-surface-800 px-4 py-2.5 text-sm text-surface-100 placeholder:text-surface-500 focus:border-primary-500 focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-surface-400">Fiscal Year</label>
                <input
                  value={fiscalYear}
                  onChange={(e) => setFiscalYear(e.target.value)}
                  required
                  className="w-full rounded-lg border border-surface-700 bg-surface-800 px-4 py-2.5 text-sm text-surface-100 focus:border-primary-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-surface-400">Document Type</label>
                <select
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                  className="w-full rounded-lg border border-surface-700 bg-surface-800 px-4 py-2.5 text-sm text-surface-100 focus:border-primary-500 focus:outline-none"
                >
                  <option value="annual_report">Annual Report</option>
                  <option value="10_k">10-K</option>
                  <option value="10_q">10-Q</option>
                  <option value="transcript">Transcript</option>
                </select>
              </div>
            </div>

            {/* AI Model Selector */}
            <ModelSelector value={llmProvider} onChange={setLlmProvider} />

            <div
              className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-surface-600 bg-surface-900/40 py-10 transition-colors hover:border-primary-500/40 hover:bg-surface-800/40"
            >
              <Upload className="h-8 w-8 text-surface-500" />
              <p className="mt-3 text-sm font-medium text-surface-200">
                {file ? file.name : 'Select a PDF file'}
              </p>
              {file && <p className="mt-1 text-xs text-surface-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>}
              <label className="mt-3 cursor-pointer rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-500 transition-colors">
                Browse Files
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="hidden"
                />
              </label>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoIngest}
                onChange={(e) => setAutoIngest(e.target.checked)}
                className="h-4 w-4 rounded accent-primary-500"
              />
              <span className="text-xs text-surface-400">Run extraction, risk scan, and comparison after upload</span>
            </label>

            <button
              type="submit"
              disabled={busy || !file || !activeWorkspaceId}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-primary-600/20 hover:bg-primary-500 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FileUp className="h-4 w-4" />
              {busy ? 'Processing…' : autoIngest ? 'Upload & Analyze' : 'Upload Document'}
            </button>

            {!activeWorkspaceId && <p className="text-xs text-surface-500 text-center">Preparing workspace…</p>}
            {error && <p className="text-sm text-red-400">{error}</p>}
          </form>
        </Card>

        {/* Results Area — full width when results present */}
        <Card title="Analysis Results" className={ingestResult ? 'xl:col-span-1' : ''}>
          {ingestResult ? (
            <PipelineResults result={ingestResult} />
          ) : uploaded && !ingestResult ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-lg border border-surface-700/40 p-4">
                <FileText className="h-8 w-8 text-primary-400" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-surface-100 truncate">{uploaded.file_name}</p>
                  <p className="text-xs text-surface-400">{uploaded.company_name} · FY {uploaded.fiscal_year} · {uploaded.status}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={runIngestion}
                disabled={busy}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-500 transition-colors disabled:opacity-50"
              >
                <Play className="h-4 w-4" />
                Run Analysis
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FileUp className="h-10 w-10 text-surface-500" />
              <h3 className="mt-4 text-sm font-medium text-surface-200">Analysis will appear here</h3>
              <p className="mt-1 max-w-sm text-xs text-surface-500">
                After ingestion, review processing status, extracted financial evidence, risk signals, and peer comparison coverage.
              </p>
            </div>
          )}
        </Card>
      </div>

      {/* Document Library */}
      <div className="rounded-xl border border-surface-700/60 bg-surface-900/50 p-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-white">Document Library</h2>
            <p className="mt-0.5 text-xs text-surface-400">All uploaded documents in this workspace</p>
          </div>
          {documents.length > 0 && (
            <button
              type="button"
              onClick={clearAllData}
              disabled={clearingAll || deletingId !== null}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/20 disabled:opacity-50"
            >
              {clearingAll ? (
                <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
              Clear all & start fresh
            </button>
          )}
        </div>
        {loadingDocs ? (
          <div className="flex items-center justify-center py-10">
            <svg className="h-5 w-5 animate-spin text-primary-400" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          </div>
        ) : documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <FileText className="h-8 w-8 text-surface-600" />
            <p className="mt-3 text-sm text-surface-500">No documents uploaded yet</p>
          </div>
        ) : (
          <div className="divide-y divide-surface-700/40">
            {documents.map((doc) => (
              <div key={doc._id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <FileText className="h-5 w-5 shrink-0 text-primary-400" />
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-surface-100">{doc.file_name}</p>
                  <p className="text-xs text-surface-400">{doc.company_name} · FY {doc.fiscal_year}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                  doc.status === 'indexed' ? 'bg-emerald-500/15 text-emerald-400' :
                  doc.status === 'uploaded' ? 'bg-primary-500/15 text-primary-400' :
                  'bg-surface-700/50 text-surface-400'
                }`}>
                  {doc.status}
                </span>
                <button
                  type="button"
                  onClick={() => deleteDoc(doc._id)}
                  disabled={deletingId === doc._id}
                  className="shrink-0 rounded-lg p-1.5 text-surface-500 transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:opacity-40"
                  aria-label="Delete document"
                >
                  {deletingId === doc._id ? (
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
