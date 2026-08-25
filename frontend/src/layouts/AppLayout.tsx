import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, ScrollText, CalendarDays, FolderOpen, Settings, Menu, X, Shield } from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Overview' },
  { to: '/obligations', icon: ScrollText, label: 'Obligations' },
  { to: '/calendar', icon: CalendarDays, label: 'Calendar' },
  { to: '/documents', icon: FolderOpen, label: 'Documents' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function AppLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen bg-surface-50">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-60 flex-col border-r border-surface-200 bg-white">
        <div className="flex h-14 items-center gap-2.5 px-5 border-b border-surface-100">
          <Shield size={22} className="text-primary-600" />
          <span className="text-base font-bold text-surface-900 tracking-tight">LifeAdmin</span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13.5px] font-medium transition-colors
                ${isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-surface-600 hover:bg-surface-50 hover:text-surface-900'
                }`
              }
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-surface-100">
          <div className="rounded-lg bg-surface-50 p-3">
            <p className="text-xs text-surface-500">Prototype 1</p>
            <p className="text-xs text-surface-400 mt-0.5">Warranty & Renewal Tracker</p>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setMobileMenuOpen(false)}>
          <div className="absolute inset-0 bg-surface-900/40 backdrop-blur-sm" />
          <aside className="relative w-64 h-full bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex h-14 items-center justify-between px-5 border-b border-surface-100">
              <div className="flex items-center gap-2.5">
                <Shield size={22} className="text-primary-600" />
                <span className="text-base font-bold text-surface-900 tracking-tight">LifeAdmin</span>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="text-surface-400 hover:text-surface-600">
                <X size={20} />
              </button>
            </div>
            <nav className="px-3 py-4 space-y-0.5">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13.5px] font-medium transition-colors
                    ${isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-surface-600 hover:bg-surface-50 hover:text-surface-900'
                    }`
                  }
                >
                  <item.icon size={18} />
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top bar */}
        <header className="flex h-14 items-center justify-between border-b border-surface-200 bg-white px-4 sm:px-6 shrink-0">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden flex h-9 w-9 items-center justify-center rounded-lg text-surface-500 hover:bg-surface-100"
          >
            <Menu size={20} />
          </button>
          <div className="lg:hidden flex items-center gap-2">
            <Shield size={20} className="text-primary-600" />
            <span className="font-bold text-surface-900 text-sm">LifeAdmin</span>
          </div>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
              <span className="text-xs font-semibold text-primary-700">U</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
