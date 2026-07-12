import { Card } from '../../components/Common';

export default function SettingsPage() {
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
    </div>
  );
}
