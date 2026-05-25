import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Tag,
  Users,
  MessageSquare,
  Phone,
  Percent,
  Truck,
  UserCog,
  Settings,
  Bell,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react';
import { useAdminStore } from '@/store/adminStore';
import Avatar from '../ui/Avatar';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/orders', icon: ShoppingCart, label: 'Orders', badge: 'orders' },
  { to: '/products', icon: Package, label: 'Products' },
  { to: '/categories', icon: Tag, label: 'Categories' },
  { to: '/customers', icon: Users, label: 'Customers' },
  { to: '/chat', icon: MessageSquare, label: 'Chat', badge: 'chat' },
  { to: '/calls', icon: Phone, label: 'Call Center' },
  { to: '/promotions', icon: Percent, label: 'Promotions' },
  { to: '/delivery', icon: Truck, label: 'Delivery' },
  { to: '/staff', icon: UserCog, label: 'Staff' },
  { to: '/settings', icon: Settings, label: 'Settings' },
] as const;

export default function AdminLayout() {
  const { admin, logout, unreadChatCount, pendingOrdersCount } = useAdminStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getBadge = (badge?: string) => {
    if (badge === 'chat' && unreadChatCount > 0) return unreadChatCount;
    if (badge === 'orders' && pendingOrdersCount > 0) return pendingOrdersCount;
    return null;
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-brand-500 flex items-center justify-center">
            <span className="text-white font-bold text-sm">R</span>
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-none">RetailHub</p>
            <p className="text-sidebar-foreground text-xs mt-0.5">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        {navItems.map(({ to, icon: Icon, label, badge, end }) => {
          const badgeCount = getBadge(badge as string | undefined);
          return (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group',
                  isActive
                    ? 'bg-sidebar-primary text-white'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                )
              }
            >
              <Icon size={18} className="shrink-0" />
              <span className="flex-1">{label}</span>
              {badgeCount !== null && (
                <span className="inline-flex items-center justify-center h-5 min-w-5 px-1 rounded-full bg-red-500 text-white text-xs font-bold">
                  {badgeCount > 99 ? '99+' : badgeCount}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Admin profile at bottom */}
      {admin && (
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3">
            <Avatar name={admin.name} src={admin.avatar} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{admin.name}</p>
              <p className="text-sidebar-foreground text-xs truncate">{admin.role}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground hover:text-red-400 transition-colors"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-60 bg-sidebar shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-sidebar flex flex-col z-50 animate-slide-in-right">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-14 bg-white border-b border-slate-200 flex items-center gap-4 px-4 lg:px-6 shrink-0">
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-500"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* Breadcrumb-style current page */}
          <div className="flex items-center gap-1 text-sm text-slate-500 hidden sm:flex">
            <span>RetailHub</span>
            <ChevronRight size={14} />
            <span className="text-slate-900 font-medium">Dashboard</span>
          </div>

          <div className="flex-1" />

          {/* Notifications */}
          <button className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
            <Bell size={20} />
            {(unreadChatCount > 0 || pendingOrdersCount > 0) && (
              <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full" />
            )}
          </button>

          {/* Admin info */}
          {admin && (
            <div className="flex items-center gap-2">
              <Avatar name={admin.name} src={admin.avatar} size="sm" />
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-slate-900 leading-none">{admin.name}</p>
                <p className="text-xs text-slate-500 mt-0.5 capitalize">{admin.role}</p>
              </div>
            </div>
          )}
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
