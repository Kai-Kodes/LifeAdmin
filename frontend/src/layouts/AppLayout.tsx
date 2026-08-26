import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  ScrollText,
  CalendarDays,
  FolderOpen,
  Receipt,
  Settings,
  Menu,
  X,
  Shield,
  Sun,
  Moon,
} from 'lucide-react';
import { useState } from 'react';
import { useTheme } from '../hooks/useTheme';

const mainNavItems = [
  { to: '/', icon: LayoutDashboard, label: 'Overview' },
  { to: '/obligations', icon: ScrollText, label: 'Obligations' },
  { to: '/bills', icon: Receipt, label: 'Bills' },
  { to: '/calendar', icon: CalendarDays, label: 'Calendar' },
  { to: '/documents', icon: FolderOpen, label: 'Documents' },
];

export default function AppLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <div className="flex h-screen bg-surface-50 dark:bg-surface-900 text-surface-900 dark:text-surface-100 transition-colors duration-200">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-60 flex-col border-r border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-950">
        <div className="flex h-14 items-center gap-2.5 px-5 border-b border-surface-100 dark:border-surface-800">
          <Shield size={22} className="text-primary-600 dark:text-primary-400" />
          <span className="text-base font-bold text-surface-900 dark:text-white tracking-tight">LifeAdmin</span>
        </div>

        {/* Main Nav items */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {mainNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium transition-colors
                ${isActive
                  ? 'bg-primary-600 text-white font-semibold shadow-xs'
                  : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800/80 hover:text-surface-900 dark:hover:text-white'
                }`
              }
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Bottom Left Settings Link */}
        <div className="p-3 border-t border-surface-100 dark:border-surface-800">
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium transition-colors
              ${isActive
                ? 'bg-primary-600 text-white font-semibold shadow-xs'
                : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800/80 hover:text-surface-900 dark:hover:text-white'
              }`
            }
          >
            <Settings size={18} />
            Settings
          </NavLink>
        </div>
      </aside>

      {/* Mobile overlay sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setMobileMenuOpen(false)}>
          <div className="absolute inset-0 bg-surface-900/50 backdrop-blur-xs" />
          <aside
            className="relative w-64 h-full bg-white dark:bg-surface-950 shadow-xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex h-14 items-center justify-between px-5 border-b border-surface-100 dark:border-surface-800">
              <div className="flex items-center gap-2.5">
                <Shield size={22} className="text-primary-600 dark:text-primary-400" />
                <span className="text-base font-bold text-surface-900 dark:text-white tracking-tight">LifeAdmin</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="text-surface-400 hover:text-surface-600 dark:hover:text-surface-200"
              >
                <X size={20} />
              </button>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-1">
              {mainNavItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium transition-colors
                    ${isActive
                      ? 'bg-primary-600 text-white font-semibold shadow-xs'
                      : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800/80 hover:text-surface-900 dark:hover:text-white'
                    }`
                  }
                >
                  <item.icon size={18} />
                  {item.label}
                </NavLink>
              ))}
            </nav>

            <div className="p-3 border-t border-surface-100 dark:border-surface-800">
              <NavLink
                to="/settings"
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium transition-colors
                  ${isActive
                    ? 'bg-primary-600 text-white font-semibold shadow-xs'
                    : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800/80 hover:text-surface-900 dark:hover:text-white'
                  }`
                }
              >
                <Settings size={18} />
                Settings
              </NavLink>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top Header */}
        <header className="flex h-14 items-center justify-between border-b border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-950 px-4 sm:px-6 shrink-0">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden flex h-9 w-9 items-center justify-center rounded-xl text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800"
          >
            <Menu size={20} />
          </button>
          <div className="lg:hidden flex items-center gap-2">
            <Shield size={20} className="text-primary-600 dark:text-primary-400" />
            <span className="font-bold text-surface-900 dark:text-white text-sm">LifeAdmin</span>
          </div>

          <div className="hidden lg:block" />

          {/* Right Header Actions: Persistent Theme Switcher */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
              aria-label="Toggle theme"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-surface-200 dark:border-surface-700 
                bg-surface-50 dark:bg-surface-900 text-surface-600 dark:text-surface-300 
                hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
            >
              {isDark ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-slate-600" />}
            </button>
          </div>
        </header>

        {/* Page Body */}
        <main className="flex-1 overflow-y-auto bg-surface-50 dark:bg-surface-900 text-surface-900 dark:text-surface-100">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
