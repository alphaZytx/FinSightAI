import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { apiResetPassword } from '../../services/api/auth';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setApiError('Invalid or missing reset token.');
    }
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    if (password !== confirmPassword) {
      setApiError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setApiError('Password must be at least 8 characters.');
      return;
    }

    setIsLoading(true);
    setApiError(null);
    try {
      await apiResetPassword(token, password);
      setIsSuccess(true);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Password reset failed.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10 sm:px-8">
      <div className="w-full max-w-[420px]">
        {isSuccess ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-2xl backdrop-blur-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success">
              <CheckCircle2 className="h-7 w-7 text-success-foreground" />
            </div>
            <h2 className="mt-5 text-xl font-semibold text-foreground">Password reset complete</h2>
            <p className="mt-2 text-sm text-muted-foreground">Your password has been successfully updated.</p>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-primary-400 hover:text-primary-300"
            >
              <ArrowLeft className="h-4 w-4" />
              Return to sign in
            </button>
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card p-8 shadow-2xl shadow-elevation backdrop-blur-sm">
            <div className="mb-7">
              <h2 className="text-xl font-semibold text-foreground">Set new password</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">Enter your new password below.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="password"
                    placeholder="Minimum 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full rounded-xl border border-border bg-muted py-3 pl-10 pr-4 text-sm text-foreground focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-500/10"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="password"
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full rounded-xl border border-border bg-muted py-3 pl-10 pr-4 text-sm text-foreground focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-500/10"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !token || !password || !confirmPassword}
                className="mt-2 w-full rounded-xl bg-primary-600 py-3 text-sm font-semibold text-primary-foreground shadow-lg hover:bg-primary-500 disabled:opacity-50"
              >
                {isLoading ? 'Resetting...' : 'Reset Password'}
              </button>

              {apiError && (
                <p className="mt-3 rounded-lg border border-error-border bg-error px-4 py-2.5 text-sm text-error-foreground">
                  {apiError}
                </p>
              )}
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
