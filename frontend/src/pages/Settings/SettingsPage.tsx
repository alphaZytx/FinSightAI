import { Trash2 } from 'lucide-react';
import { Card } from '../../components/Common';
import { useClearWorkspaceData } from '../../hooks/useClearWorkspaceData';

export default function SettingsPage() {
  const { clearAll, clearing, error } = useClearWorkspaceData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="mt-1 text-sm text-surface-400">Manage your account and preferences</p>
      </div>

      <Card title="Profile">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-surface-400">Full Name</label>
            <input
              type="text"
              defaultValue="Alex Morgan"
              className="w-full rounded-lg border border-surface-700 bg-surface-800 px-4 py-2 text-sm text-surface-100 focus:border-primary-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-surface-400">Email</label>
            <input
              type="email"
              defaultValue="alex@finintel.ai"
              className="w-full rounded-lg border border-surface-700 bg-surface-800 px-4 py-2 text-sm text-surface-100 focus:border-primary-500 focus:outline-none"
            />
          </div>
        </div>
      </Card>

      <Card title="Notifications">
        <div className="space-y-3">
          {['Report generation alerts', 'Document upload confirmations', 'Red flag detections', 'AI analysis completions'].map((label) => (
            <label key={label} className="flex items-center justify-between rounded-lg border border-surface-700/40 p-3">
              <span className="text-sm text-surface-200">{label}</span>
              <input type="checkbox" defaultChecked className="h-4 w-4 rounded accent-primary-500" />
            </label>
          ))}
        </div>
      </Card>

      <Card
        title="Data Management"
        subtitle="Remove all uploaded documents and analysis from this workspace"
      >
        <p className="mb-4 text-sm text-surface-400">
          Clear all documents, financial metrics, red flags, and extracted data to start a fresh analysis session.
          Your workspace will remain, but all previous research data will be permanently deleted.
        </p>
        {error && (
          <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {error}
          </p>
        )}
        <button
          type="button"
          onClick={() => clearAll()}
          disabled={clearing}
          className="inline-flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/20 disabled:opacity-50"
        >
          {clearing ? (
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
          {clearing ? 'Clearing data…' : 'Clear all data & start fresh'}
        </button>
      </Card>
    </div>
  );
}
