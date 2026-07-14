import { useEffect, useState, type FormEvent } from 'react';
import { HiOutlineAcademicCap, HiOutlineChatBubbleLeftRight, HiOutlineShieldCheck } from 'react-icons/hi2';
import { useRouter } from '@tanstack/react-router';

import { useAuth } from '../auth';
import { roleRedirect } from '../lib/role-redirect';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

const DEMO_ACCOUNTS = [
  { label: 'Admin', email: 'admin@speaktoreach.local', password: 'admin123', icon: HiOutlineShieldCheck },
  { label: 'Teacher', email: 'maya@speaktoreach.local', password: 'teacher123', icon: HiOutlineAcademicCap },
] as const;

export function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const user = await login(email, password);
      router.navigate({ to: roleRedirect(user) });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (nextEmail: string, nextPassword: string) => {
    setEmail(nextEmail);
    setPassword(nextPassword);
    setError('');
  };

  return (
    <div className="min-h-screen grid place-items-center bg-gradient-to-br from-[#0a1f22] via-[#13292d] to-[#1a3a3f] p-6">
      <div className="w-full max-w-md">
        <form onSubmit={handleSubmit} noValidate className="bg-white rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.3)] p-8 space-y-6">
          {/* Brand */}
          <div className="flex items-center gap-3.5">
            <div className="flex items-center justify-center w-13 h-13 rounded-xl bg-surface-foreground/5 text-primary">
              <HiOutlineChatBubbleLeftRight size={26} />
            </div>
            <div>
              <strong className="text-lg block text-foreground">Speak To Reach</strong>
              <small className="text-muted-foreground text-sm">Management System</small>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">Choose a demo account or enter your credentials</p>

          {/* Demo account picker */}
          <div className="grid grid-cols-2 gap-3" role="group" aria-label="Demo accounts">
            {DEMO_ACCOUNTS.map((account) => (
              <button
                key={account.label}
                type="button"
                className={`flex items-center justify-center gap-2 p-3 border-2 rounded-xl text-sm font-semibold transition-all ${
                  email === account.email
                    ? 'border-primary bg-primary/5 text-primary shadow-sm'
                    : 'border-border hover:border-primary/40 hover:bg-accent'
                }`}
                onClick={() => fillCredentials(account.email, account.password)}
                aria-pressed={email === account.email}
              >
                <account.icon size={20} />
                <span>{account.label}</span>
              </button>
            ))}
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-200" role="alert">
              {error}
            </div>
          )}

          {/* Fields */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              autoComplete="email"
              placeholder="you@example.com"
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="Enter your password"
              className="h-11"
            />
          </div>

          <Button type="submit" className="w-full h-11 text-sm font-semibold" disabled={loading}>
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Signing in...
              </span>
            ) : 'Sign In'}
          </Button>
        </form>
      </div>
    </div>
  );
}

export function LoginRoute() {
  const { user } = useAuth();
  const router = useRouter();
  useEffect(() => { if (user) router.navigate({ to: roleRedirect(user) }); }, [user, router]);
  if (user) return null;
  return <LoginPage />;
}
