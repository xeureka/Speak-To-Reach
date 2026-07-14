import { useEffect, useMemo, useState } from 'react';
import {
  HiOutlineArrowRightOnRectangle,
  HiOutlineChatBubbleLeftRight,
  HiOutlineChevronLeft,
  HiOutlineCog6Tooth,
} from 'react-icons/hi2';
import { Link, Outlet, useLocation, useRouter } from '@tanstack/react-router';

import { useAuth } from '../../auth';
import { api } from '../../api';
import { ADMIN_ONLY_PATHS, isActiveAdminPath, getNavItems } from '../../lib/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '../ui/dropdown-menu';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Avatar, AvatarFallback } from '../ui/avatar';

const SIDEBAR_COMPACT_KEY = 'sidebar-compact';
const ROLE_COLORS = { admin: 'bg-primary/80 text-primary-foreground', teacher: 'bg-emerald-500/80 text-white' } as const;
const ROLE_LABELS = { admin: 'Admin', teacher: 'Teacher' } as const;

export function ProtectedLayout() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const location = useLocation();
  const [sidebarCompact, setSidebarCompact] = useState(() => localStorage.getItem(SIDEBAR_COMPACT_KEY) === 'true');
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [pwMsg, setPwMsg] = useState('');
  const [pwError, setPwError] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  const navItems = useMemo(() => (user ? getNavItems(user) : []), [user]);

  useEffect(() => {
    if (!isLoading && !user) router.navigate({ to: '/login' });
  }, [isLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    if (user.role !== 'admin' && isActiveAdminPath(location.pathname)) {
      router.navigate({ to: user.role === 'teacher' ? '/teacher' : '/' });
    }
  }, [user, location.pathname, router]);

  const toggleCompact = () => {
    const next = !sidebarCompact;
    setSidebarCompact(next);
    localStorage.setItem(SIDEBAR_COMPACT_KEY, String(next));
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwLoading(true);
    setPwMsg('');
    try {
      await api.changePassword({ currentPassword: currentPw, newPassword: newPw });
      setPwMsg('Password updated successfully.');
      setPwError(false);
      setCurrentPw('');
      setNewPw('');
    } catch (err) {
      setPwMsg(err instanceof Error ? err.message : 'Failed');
      setPwError(true);
    } finally {
      setPwLoading(false);
    }
  };

  if (isLoading || !user) return <div className="fixed inset-0 z-50 grid place-items-center bg-surface"><div className="text-surface-foreground/40 text-sm">Loading...</div></div>;

  const initials = user.name.split(' ').map(n => n[0]).join('').slice(0, 2);

  return (
    <div className={`grid min-h-svh transition-all duration-300 ease-in-out ${sidebarCompact ? 'grid-cols-[72px_minmax(0,1fr)]' : 'grid-cols-[260px_minmax(0,1fr)]'}`}>
      {/* Sidebar */}
      <aside className={`sticky top-0 z-30 h-svh flex flex-col bg-surface text-surface-foreground border-r border-white/10 transition-all duration-300 ease-in-out ${sidebarCompact ? 'px-2.5 py-4' : 'px-4 py-4'}`}>
        {/* Top Row: Brand + Collapse */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/12 shrink-0 transition-all duration-300">
            <HiOutlineChatBubbleLeftRight size={18} />
          </div>
          {!sidebarCompact && (
            <div className="flex-1 min-w-0 overflow-hidden">
              <strong className="block text-sm leading-tight whitespace-nowrap">Speak To Reach</strong>
            </div>
          )}
          <button
            onClick={toggleCompact}
            type="button"
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/10 text-surface-foreground/70 hover:bg-white/20 hover:text-white transition-all duration-200 shrink-0 group"
            aria-label={sidebarCompact ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <HiOutlineChevronLeft
              size={16}
              className={`transition-transform duration-300 ease-in-out ${sidebarCompact ? 'rotate-180' : 'rotate-0'} group-hover:scale-110`}
            />
          </button>
        </div>

        {/* User Profile Card */}
        <div className={`mt-4 mb-1 transition-all duration-300 ${sidebarCompact ? 'px-0' : 'px-0'}`}>
          <DropdownMenu>
            <DropdownMenuTrigger className="w-full outline-none">
              {sidebarCompact ? (
                <div className="flex justify-center py-1">
                  <div className="relative">
                    <Avatar className="h-9 w-9 ring-2 ring-white/15 ring-offset-2 ring-offset-surface transition-all duration-200 hover:ring-white/30">
                      <AvatarFallback className={`text-xs font-bold ${ROLE_COLORS[user.role]}`}>
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-surface" />
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 border border-white/8 hover:bg-white/8 transition-all duration-200 cursor-pointer group">
                  <div className="relative shrink-0">
                    <Avatar className="h-9 w-9 ring-2 ring-white/15 ring-offset-2 ring-offset-surface transition-all duration-200 group-hover:ring-white/30">
                      <AvatarFallback className={`text-xs font-bold ${ROLE_COLORS[user.role]}`}>
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-surface" />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="text-sm font-semibold truncate leading-tight">{user.name}</div>
                    <div className="text-[11px] text-surface-foreground/45 truncate leading-tight mt-0.5">{ROLE_LABELS[user.role]}</div>
                  </div>
                  <HiOutlineCog6Tooth size={14} className="text-surface-foreground/30 group-hover:text-surface-foreground/60 transition-colors shrink-0" />
                </div>
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <div className="px-3 py-2 border-b border-border/50 mb-1">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
              <DropdownMenuItem onClick={() => setShowPasswordDialog(true)}>
                <HiOutlineCog6Tooth size={15} className="mr-2.5 opacity-60" />
                Change Password
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => { logout(); router.navigate({ to: '/login' }); }} className="text-destructive focus:text-destructive">
                <HiOutlineArrowRightOnRectangle size={15} className="mr-2.5 opacity-60" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Divider */}
        <div className="h-px bg-white/8 my-1" />

        {/* Navigation */}
        <nav className="flex-1 flex flex-col gap-0.5 mt-2 overflow-y-auto scrollbar-hide" aria-label="Main navigation">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-2.5 rounded-lg text-sm font-medium transition-all duration-200 text-surface-foreground/70 hover:bg-white/8 hover:text-white [&.active]:bg-white/10 [&.active]:text-white ${sidebarCompact ? 'justify-center px-0 py-2.5 mx-0' : 'px-3 py-2.5 mx-0'}`}
              activeOptions={{ exact: item.to === '/' }}
              activeProps={{ className: 'active' }}
            >
              <item.icon size={19} className="shrink-0 transition-transform duration-200 hover:scale-110" />
              {!sidebarCompact && <span className="whitespace-nowrap overflow-hidden">{item.label}</span>}
            </Link>
          ))}
        </nav>

        {/* Bottom Collapse Hint (compact only) */}
        {sidebarCompact && (
          <div className="mt-auto pt-2 border-t border-white/8">
            <button
              onClick={toggleCompact}
              type="button"
              className="w-full flex items-center justify-center py-2 rounded-lg bg-white/8 text-surface-foreground/50 hover:text-white/80 hover:bg-white/15 transition-all duration-200"
              title="Expand sidebar"
            >
              <HiOutlineChevronLeft size={14} className="rotate-180" />
            </button>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="min-w-0 p-7 relative z-0" id="main-content">
        <Outlet />
      </main>

      {/* Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleChangePassword} className="space-y-4 mt-4">
            {pwMsg && (
              <div className={`p-3 rounded-xl text-sm ${pwError ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                {pwMsg}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="currentPw">Current Password</Label>
              <Input id="currentPw" type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPw">New Password</Label>
              <Input id="newPw" type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} required minLength={6} />
            </div>
            <Button type="submit" disabled={pwLoading || !currentPw || !newPw}>
              {pwLoading ? 'Updating...' : 'Update Password'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
