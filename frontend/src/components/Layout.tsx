import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Button } from './ui';

function navClass({ isActive }: { isActive: boolean }): string {
  return [
    'rounded-lg px-3 py-1.5 text-sm font-medium transition',
    isActive ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100',
  ].join(' ');
}

export default function Layout() {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'admin';

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-6">
            <span className="text-sm font-semibold tracking-tight">🛡️ Content Moderation</span>
            <nav className="flex items-center gap-1">
              <NavLink to="/submit" className={navClass}>Submit</NavLink>
              <NavLink to="/history" className={navClass}>History</NavLink>
              <NavLink to="/appeals" className={navClass}>My Appeals</NavLink>
              {isAdmin && (
                <>
                  <span className="mx-1 h-4 w-px bg-slate-200" />
                  <NavLink to="/admin/analytics" className={navClass}>Analytics</NavLink>
                  <NavLink to="/admin/queue" className={navClass}>Appeals Queue</NavLink>
                  <NavLink to="/admin/policy" className={navClass}>Policy</NavLink>
                </>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <span>
              {user?.email}
              {isAdmin && <span className="ml-1 rounded bg-slate-900 px-1.5 py-0.5 text-xs text-white">admin</span>}
            </span>
            <Button variant="ghost" onClick={logout}>Log out</Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
