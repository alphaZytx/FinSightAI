import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Brain,
  Bot,
  FileSearch,
  ShieldAlert,
  GitCompare,
  FileOutput,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowLeft,
  CheckCircle2,
  Sun,
  Moon,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { saveSession } from '../../utils/auth';
import { apiLogin, apiRegister, apiForgotPassword, apiGoogleLogin } from '../../services/api/auth';
import { useGoogleLogin } from '@react-oauth/google';

type AuthMode = 'login' | 'register' | 'forgot';

const agents = [
  { icon: Bot, label: 'Document Agent' },
  { icon: FileSearch, label: 'Extraction Agent' },
  { icon: ShieldAlert, label: 'Red Flag Agent' },
  { icon: GitCompare, label: 'Comparison Agent' },
  { icon: Brain, label: 'Research Agent' },
  { icon: FileOutput, label: 'Report Agent' },
];

const modeConfig = {
  login: {
    title: 'Welcome back',
    subtitle: 'Sign in to access your research workspace',
    submitLabel: 'Sign In',
  },
  register: {
    title: 'Create account',
    subtitle: 'Start analyzing financial documents with AI agents',
    submitLabel: 'Create Account',
  },
  forgot: {
    title: 'Reset password',
    subtitle: 'Enter your email and we will send reset instructions',
    submitLabel: 'Send Reset Link',
  },
};

function AuthInput({
  id,
  label,
  type = 'text',
  placeholder,
  icon: Icon,
  value,
  onChange,
  showToggle,
  onToggle,
  visible,
  error,
}: {
  id: string;
  label: string;
  type?: string;
  placeholder: string;
  icon: typeof Mail;
  value: string;
  onChange: (v: string) => void;
  showToggle?: boolean;
  onToggle?: () => void;
  visible?: boolean;
  error?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </label>
      <div className="relative">
        <Icon className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          id={id}
          type={showToggle ? (visible ? 'text' : 'password') : type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
          className={`w-full rounded-xl border bg-muted py-3 pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground shadow-sm transition-all duration-200 focus:bg-muted focus:outline-none focus:ring-4 ${error
              ? 'border-error-border focus:border-error-border focus:ring-error-border/20'
              : 'border-border focus:border-primary-500 focus:ring-primary-500/10'
            }`}
        />
        {showToggle && (
          <button
            type="button"
            onClick={onToggle}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground-muted"
            aria-label={visible ? 'Hide password' : 'Show password'}
          >
            {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
      {error && <p className="mt-1.5 text-xs text-error-foreground">{error}</p>}
    </div>
  );
}

function SuccessCard({
  title,
  message,
  actionLabel,
  onAction,
}: {
  title: string;
  message: React.ReactNode;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-8 text-center backdrop-blur-sm">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success">
        <CheckCircle2 className="h-7 w-7 text-success-foreground" />
      </div>
      <h2 className="mt-5 text-xl font-semibold text-foreground">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{message}</p>
      <button
        type="button"
        onClick={onAction}
        className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-primary-400 transition-colors hover:text-primary-300"
      >
        <ArrowLeft className="h-4 w-4" />
        {actionLabel}
      </button>
    </div>
  );
}

export default function AuthPage() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [registerDone, setRegisterDone] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const config = modeConfig[mode];
  const passwordMismatch =
    mode === 'register' && password.length > 0 && confirmPassword.length > 0 && password !== confirmPassword;

  const handleGoogleSuccess = async (tokenResponse: any) => {
    setIsLoading(true);
    try {
      const { access_token, user } = await apiGoogleLogin(tokenResponse.access_token);
      saveSession(access_token, user, false);
      navigate('/');
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Google sign in failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onError: () => setApiError('Google sign in failed.')
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setApiError(null);

    if (mode === 'forgot') {
      setIsLoading(true);
      try {
        await apiForgotPassword(email);
        setForgotSent(true);
      } catch (err) {
        setApiError(err instanceof Error ? err.message : 'Failed to send reset email.');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (mode === 'register') {
      if (password !== confirmPassword || password.length < 8) return;
      setIsLoading(true);
      try {
        const { access_token, user } = await apiRegister(email, fullName, password);
        saveSession(access_token, user, false);
        setRegisterDone(true);
      } catch (err) {
        setApiError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // login
    setIsLoading(true);
    try {
      const { access_token, user } = await apiLogin(email, password);
      saveSession(access_token, user, rememberMe);
      navigate('/');
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Sign in failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  function switchMode(next: AuthMode) {
    setMode(next);
    setForgotSent(false);
    setRegisterDone(false);
    setPassword('');
    setConfirmPassword('');
    setApiError(null);
  }

  return (
    <div className="flex min-h-screen">
      {/* Left — branding panel (desktop) */}
      <div className="relative hidden w-[45%] overflow-hidden bg-card lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 bg-gradient-to-br from-auth-from via-auth-via to-auth-to" />
        <div className="absolute -left-24 top-1/4 h-72 w-72 rounded-full bg-primary-600/10 blur-3xl" />
        <div className="absolute -right-16 bottom-1/4 h-56 w-56 rounded-full bg-primary-500/10 blur-2xl" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '32px 32px',
          }}
        />

        <div className="relative z-10 flex flex-col justify-between p-10 xl:p-14">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-600 shadow-lg shadow-primary">
                <Brain className="h-6 w-6 text-primary-foreground" />
              </div>
              <p className="text-xs font-semibold tracking-widest text-primary-400 uppercase">
                Enterprise Platform
              </p>
            </div>

            <h1 className="mt-10 max-w-md text-3xl leading-tight font-bold tracking-tight text-foreground xl:text-4xl">
              Multi Agent Financial Research System
            </h1>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
              Orchestrate specialized AI agents to parse documents, extract metrics,
              detect red flags, and generate institutional-grade research reports.
            </p>
          </div>

          <div className="mt-12">
            <p className="mb-4 text-xs font-semibold tracking-widest text-muted-foreground uppercase">
              Specialized Agents
            </p>
            <div className="grid grid-cols-2 gap-3">
              {agents.map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-2.5 rounded-lg border border-border bg-muted px-3 py-2.5 backdrop-blur-sm"
                >
                  <Icon className="h-4 w-4 shrink-0 text-primary-400" />
                  <span className="text-xs font-medium text-foreground-muted">{label}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="mt-10 text-xs text-muted-foreground">
            Secure · Compliant · AI-Powered Financial Intelligence
          </p>
        </div>
      </div>

      {/* Right — form panel */}
      <div className="relative flex flex-1 flex-col items-center justify-center bg-background px-4 py-10 sm:px-8">

        {/* Theme Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="absolute right-4 top-4 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground-muted sm:right-6 sm:top-6"
        >
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>

        {/* Mobile header */}
        <div className="mb-8 w-full max-w-[420px] text-center lg:hidden">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600">
            <Brain className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="mt-4 text-lg font-bold leading-snug text-foreground">
            Multi Agent Financial Research System
          </h1>
          <p className="mt-2 text-xs text-muted-foreground">
            AI-powered document analysis &amp; research
          </p>
        </div>

        <div className="w-full max-w-[420px]">
          {mode === 'forgot' && forgotSent ? (
            <SuccessCard
              title="Check your email"
              message={
                <>
                  We sent password reset instructions to{' '}
                  <span className="font-medium text-foreground-muted">{email}</span>
                </>
              }
              actionLabel="Back to sign in"
              onAction={() => switchMode('login')}
            />
          ) : mode === 'register' && registerDone ? (
            <SuccessCard
              title="Account created"
              message={
                <>
                  Welcome, <span className="font-medium text-foreground-muted">{fullName}</span>.
                  Your account is ready — you are now signed in.
                </>
              }
              actionLabel="Go to dashboard"
              onAction={() => navigate('/')}
            />
          ) : (
            <div
              key={mode}
              className="rounded-2xl border border-border bg-card p-8 shadow-2xl shadow-elevation backdrop-blur-sm"
            >
              <div className="mb-7">
                <h2 className="text-xl font-semibold text-foreground">{config.title}</h2>
                <p className="mt-1.5 text-sm text-muted-foreground">{config.subtitle}</p>
              </div>

              {/* Tab switcher — Sign In / Create Account */}
              {mode !== 'forgot' && (
                <div className="mb-6 flex rounded-xl border border-border bg-muted p-1">
                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-all duration-200 ${mode === 'login'
                        ? 'bg-primary-600 text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground-muted'
                      }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => switchMode('register')}
                    className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-all duration-200 ${mode === 'register'
                        ? 'bg-primary-600 text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground-muted'
                      }`}
                  >
                    Create Account
                  </button>
                </div>
              )}

              {mode === 'forgot' && (
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground-muted"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back to sign in
                </button>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'register' && (
                  <AuthInput
                    id="fullName"
                    label="Full Name"
                    placeholder="Alex Morgan"
                    icon={User}
                    value={fullName}
                    onChange={setFullName}
                  />
                )}

                <AuthInput
                  id="email"
                  label="Email Address"
                  type="email"
                  placeholder="you@company.com"
                  icon={Mail}
                  value={email}
                  onChange={setEmail}
                />

                {mode !== 'forgot' && (
                  <AuthInput
                    id="password"
                    label="Password"
                    placeholder={mode === 'register' ? 'Minimum 8 characters' : 'Enter your password'}
                    icon={Lock}
                    value={password}
                    onChange={setPassword}
                    showToggle
                    visible={showPassword}
                    onToggle={() => setShowPassword((v) => !v)}
                    error={
                      mode === 'register' && password.length > 0 && password.length < 8
                        ? 'Password must be at least 8 characters'
                        : undefined
                    }
                  />
                )}

                {mode === 'register' && (
                  <AuthInput
                    id="confirmPassword"
                    label="Confirm Password"
                    placeholder="Re-enter your password"
                    icon={Lock}
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    showToggle
                    visible={showConfirmPassword}
                    onToggle={() => setShowConfirmPassword((v) => !v)}
                    error={passwordMismatch ? 'Passwords do not match' : undefined}
                  />
                )}

                {mode === 'login' && (
                  <div className="flex items-center justify-between pt-1">
                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="h-4 w-4 rounded border-border accent-primary-500"
                      />
                      <span className="text-xs text-muted-foreground">Remember me</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => switchMode('forgot')}
                      className="text-xs font-medium text-primary-400 transition-colors hover:text-primary-300"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={
                    isLoading ||
                    (mode === 'register' &&
                      (password !== confirmPassword || password.length < 8 || !fullName.trim())) ||
                    (mode !== 'forgot' && !password) ||
                    !email.trim()
                  }
                  className="mt-2 w-full rounded-xl bg-primary-600 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary transition-all hover:bg-primary-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      {mode === 'register' ? 'Creating account…' : 'Signing in…'}
                    </span>
                  ) : (
                    config.submitLabel
                  )}
                </button>

                {apiError && (
                  <p className="mt-3 rounded-lg border border-error-border bg-error px-4 py-2.5 text-sm text-error-foreground">
                    {apiError}
                  </p>
                )}
              </form>

              {mode !== 'forgot' && (
                <div className="mt-6">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => loginWithGoogle()}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-muted py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted-hover"
                  >
                    <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Google
                  </button>
                </div>
              )}

              {mode === 'login' && (
                <p className="mt-6 text-center text-sm text-muted-foreground">
                  Don&apos;t have an account?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('register')}
                    className="font-medium text-primary-400 transition-colors hover:text-primary-300"
                  >
                    Create one
                  </button>
                </p>
              )}

              {mode === 'register' && (
                <p className="mt-6 text-center text-sm text-muted-foreground">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    className="font-medium text-primary-400 transition-colors hover:text-primary-300"
                  >
                    Sign in
                  </button>
                </p>
              )}

              {mode === 'forgot' && (
                <p className="mt-6 text-center text-xs text-muted-foreground">
                  Didn&apos;t receive the email? Check your spam folder or{' '}
                  <button
                    type="button"
                    onClick={() => setForgotSent(false)}
                    className="text-primary-400 hover:text-primary-300"
                  >
                    try again
                  </button>
                </p>
              )}
            </div>
          )}

          <p className="mt-6 text-center text-xs text-muted-foreground">
            By continuing, you agree to our{' '}
            <Link to="/login" className="text-muted-foreground hover:text-muted-foreground">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link to="/login" className="text-muted-foreground hover:text-muted-foreground">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
