import { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { ROUTES } from '../../router/routeConstants';
import { useAuth } from '../../hooks/useAuth';
import {
  HomeIcon,
  UserGroupIcon,
  ClipboardDocumentListIcon,
  AcademicCapIcon,
  BanknotesIcon,
  ChatBubbleLeftRightIcon,
  ChartBarIcon,
  Bars3Icon,
  ChevronDoubleLeftIcon,
  ArrowRightOnRectangleIcon,
  BellIcon,
  MagnifyingGlassIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  BuildingLibraryIcon,
  ReceiptRefundIcon,
  CurrencyDollarIcon,
  UsersIcon,
  CalendarDaysIcon,
  ExclamationTriangleIcon,
  TrophyIcon,
  DocumentChartBarIcon,
  ClipboardIcon,
  CreditCardIcon,
} from '@heroicons/react/24/outline';

// ── Nav types ─────────────────────────────────────────────────────────────────
type NavChild = { label: string; path: string; icon?: React.ComponentType<{ className?: string }> };
type NavItem  = {
  label:    string;
  path:     string | null;
  icon:     React.ComponentType<{ className?: string }>;
  roles:    readonly string[];
  children?: NavChild[];
};

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',     path: ROUTES.DASHBOARD,         icon: HomeIcon,                  roles: ['Admin','Teacher','Student','Parent'] },
  { label: 'Admission',     path: ROUTES.ADMISSION,         icon: ClipboardDocumentListIcon, roles: ['Admin'] },
  { label: 'Students',      path: ROUTES.STUDENTS,          icon: UserGroupIcon,             roles: ['Admin','Teacher'] },
  { label: 'Attendance',    path: ROUTES.ATTENDANCE_MARK,   icon: ClipboardDocumentListIcon, roles: ['Admin','Teacher'] },
  { label: 'Examination',   path: ROUTES.EXAMINATIONS,      icon: AcademicCapIcon,           roles: ['Admin','Teacher'] },
  {
    label: 'Fees',
    path:  null,
    icon:  BanknotesIcon,
    roles: ['Admin'],
    children: [
      { label: 'Fee Structures',     path: ROUTES.FEE_STRUCTURES, icon: BuildingLibraryIcon },
      { label: 'Fee Invoices',       path: ROUTES.FEE_INVOICES,   icon: ReceiptRefundIcon },
      { label: 'Financial Overview', path: ROUTES.FEE_PAYMENTS,   icon: CurrencyDollarIcon },
    ],
  },
  { label: 'Communication', path: ROUTES.ANNOUNCEMENTS,     icon: ChatBubbleLeftRightIcon,   roles: ['Admin','Teacher','Student','Parent'] },
  {
    label: 'Reports',
    path:  null,
    icon:  ChartBarIcon,
    roles: ['Admin','Teacher'],
    children: [
      { label: 'Enrollment Summary',  path: ROUTES.REPORT_STUDENTS_ENROLLMENT, icon: UsersIcon },
      { label: 'Student Directory',   path: ROUTES.REPORT_STUDENTS_DIRECTORY,  icon: UserGroupIcon },
      { label: 'Class Attendance',    path: ROUTES.REPORT_ATTENDANCE,          icon: CalendarDaysIcon },
      { label: 'Student Attendance',  path: ROUTES.REPORT_ATTENDANCE_STUDENT,  icon: ClipboardIcon },
      { label: 'Low Attendance Alert',path: ROUTES.REPORT_LOW_ATTENDANCE,      icon: ExclamationTriangleIcon },
      { label: 'Class Results',       path: ROUTES.REPORT_ACADEMIC,            icon: TrophyIcon },
      { label: 'Report Cards',        path: ROUTES.REPORT_ACADEMIC_REPORTCARD, icon: DocumentChartBarIcon },
      { label: 'Subject Performance', path: ROUTES.REPORT_ACADEMIC_SUBJECTS,   icon: ChartBarIcon },
      { label: 'Fee Summary',         path: ROUTES.REPORT_FEES,                icon: BanknotesIcon },
      { label: 'Payment History',     path: ROUTES.REPORT_FEES_PAYMENTS,       icon: CreditCardIcon },
      { label: 'Admissions Report',   path: ROUTES.REPORT_ADMISSION,           icon: ClipboardDocumentListIcon },
    ],
  },
];

export default function PrivateLayout() {
  const { user, signOut } = useAuth();
  const navigate          = useNavigate();
  const location          = useLocation();
  const [open, setOpen]   = useState(true);

  // Auto-expand groups whose child is currently active
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    for (const item of NAV_ITEMS) {
      if (item.children?.some(c => location.pathname.startsWith(c.path))) {
        initial.add(item.label);
      }
    }
    return initial;
  });

  const toggleGroup = (label: string) => {
    setOpenGroups(prev => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label); else next.add(label);
      return next;
    });
  };

  const handleLogout = async () => {
    await signOut();
    navigate(ROUTES.LOGIN, { replace: true });
  };

  const visibleNav = NAV_ITEMS.filter(
    (item) => !user?.role || (item.roles as readonly string[]).includes(user.role)
  );

  const roleColor: Record<string, string> = {
    Admin: 'bg-violet-100 text-violet-700',
    Teacher: 'bg-blue-100 text-blue-700',
    Student: 'bg-emerald-100 text-emerald-700',
    Parent: 'bg-amber-100 text-amber-700',
  };

  return (
    <div className="flex h-screen w-screen bg-gray-50 overflow-hidden">
      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside
        className={`${
          open ? 'w-64' : 'w-[72px]'
        } flex-shrink-0 bg-gradient-to-b from-slate-900 to-slate-800 text-white flex flex-col transition-all duration-300 ease-in-out shadow-2xl z-20`}
      >
        {/* Logo / toggle */}
        <div className={`flex items-center ${open ? 'justify-between px-5' : 'justify-center px-3'} h-16 border-b border-white/10`}>
          {open && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center font-bold text-sm">E</div>
              <span className="font-bold text-lg tracking-wide bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                EduERP
              </span>
            </div>
          )}
          <button
            onClick={() => setOpen((v) => !v)}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Toggle sidebar"
          >
            {open
              ? <ChevronDoubleLeftIcon className="w-5 h-5 text-slate-400" />
              : <Bars3Icon className="w-5 h-5 text-slate-400" />
            }
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 space-y-0.5 px-3">
          {visibleNav.map((item) => {
            const Icon = item.icon;

            // ── Expandable group (e.g. Fees) ──────────────────────────────
            if (item.children) {
              const isGroupActive = item.children.some(c => location.pathname.startsWith(c.path));
              const isExpanded    = openGroups.has(item.label);
              return (
                <div key={item.label}>
                  <button
                    onClick={() => {
                      if (!open) { navigate(item.children![0].path); return; }
                      toggleGroup(item.label);
                    }}
                    title={!open ? item.label : undefined}
                    className={`w-full group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                      isGroupActive
                        ? 'bg-blue-600/25 text-white'
                        : 'text-slate-400 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Icon className={`w-5 h-5 flex-shrink-0 ${
                      isGroupActive ? 'text-blue-300' : 'text-slate-400 group-hover:text-white'
                    }`} />
                    {open && (
                      <>
                        <span className="flex-1 text-left">{item.label}</span>
                        <ChevronDownIcon className={`w-3.5 h-3.5 transition-transform duration-200 ${
                          isExpanded ? 'rotate-180' : ''
                        }`} />
                      </>
                    )}
                  </button>

                  {/* Sub-items (only when sidebar is open) */}
                  {open && isExpanded && (
                    <div className="mt-0.5 ml-3 pl-3 border-l border-white/10 space-y-0.5">
                      {item.children.map(child => {
                        const ChildIcon = child.icon;
                        return (
                          <NavLink
                            key={child.path}
                            to={child.path}
                            className={({ isActive }) =>
                              `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-150 ${
                                isActive
                                  ? 'bg-blue-600 text-white shadow-sm'
                                  : 'text-slate-400 hover:bg-white/10 hover:text-white'
                              }`
                            }
                          >
                            {ChildIcon && <ChildIcon className="w-4 h-4 flex-shrink-0" />}
                            <span>{child.label}</span>
                          </NavLink>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            // ── Regular nav item ─────────────────────────────────────────
            return (
              <NavLink
                key={item.path!}
                to={item.path!}
                title={!open ? item.label : undefined}
                className={({ isActive }) =>
                  `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40'
                      : 'text-slate-400 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                    {open && (
                      <>
                        <span className="flex-1">{item.label}</span>
                        {isActive && <ChevronRightIcon className="w-3.5 h-3.5 opacity-70" />}
                      </>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* User profile + logout */}
        <div className={`border-t border-white/10 p-3 ${open ? '' : 'flex justify-center'}`}>
          {open ? (
            <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/5 transition-colors">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center text-sm font-bold flex-shrink-0">
                {user?.fullName?.[0] ?? 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user?.fullName}</p>
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${roleColor[user?.role ?? ''] ?? 'bg-slate-700 text-slate-300'}`}>
                  {user?.role}
                </span>
              </div>
              <button onClick={handleLogout} title="Sign out" className="p-1 hover:text-red-400 text-slate-500 transition-colors">
                <ArrowRightOnRectangleIcon className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <button onClick={handleLogout} title="Sign out" className="p-2 hover:text-red-400 text-slate-500 transition-colors rounded-lg hover:bg-white/10">
              <ArrowRightOnRectangleIcon className="w-5 h-5" />
            </button>
          )}
        </div>
      </aside>

      {/* ── Main content area ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-6 gap-4 flex-shrink-0 shadow-sm">
          <div className="flex-1 max-w-md relative">
            <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search…"
              className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
            />
          </div>

          <div className="ml-auto flex items-center gap-3">
            <button className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors">
              <BellIcon className="w-5 h-5 text-gray-500" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <div className="flex items-center gap-2 pl-3 border-l border-gray-200">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center text-sm font-bold text-white">
                {user?.fullName?.[0] ?? 'U'}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-gray-800 leading-none">{user?.fullName}</p>
                <p className="text-xs text-gray-400 mt-0.5">{user?.email}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="p-6 h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

