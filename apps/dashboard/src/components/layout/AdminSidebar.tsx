'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
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
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAdminStore } from '@/store/adminStore'
import Avatar from '@/components/ui/Avatar'
import { CountBadge } from '@/components/ui/Badge'
import { getSupabaseClient } from '@/lib/supabase'

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
  badgeKey?: 'unreadChatCount' | 'pendingOrdersCount'
}

const navItems: NavItem[] = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/orders', label: 'Orders', icon: ShoppingCart, badgeKey: 'pendingOrdersCount' },
  { href: '/products', label: 'Products', icon: Package },
  { href: '/categories', label: 'Categories', icon: Tag },
  { href: '/customers', label: 'Customers', icon: Users },
  { href: '/chat', label: 'Chat Inbox', icon: MessageSquare, badgeKey: 'unreadChatCount' },
  { href: '/calls', label: 'Call Center', icon: Phone },
  { href: '/promotions', label: 'Promotions', icon: Percent },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { admin, unreadChatCount, pendingOrdersCount, sidebarCollapsed, setSidebarCollapsed } =
    useAdminStore()

  const badgeValues = {
    unreadChatCount,
    pendingOrdersCount,
  }

  const handleLogout = async () => {
    const supabase = getSupabaseClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <aside
      className={cn(
        'relative h-screen flex flex-col bg-sidebar-bg border-r border-sidebar-border',
        'transition-all duration-300 shadow-sidebar shrink-0',
        sidebarCollapsed ? 'w-[68px]' : 'w-64'
      )}
    >
      {/* Toggle button */}
      <button
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        className="absolute -right-3 top-6 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-white border border-gray-200 shadow-sm text-gray-500 hover:text-gray-700 hover:shadow-md transition-all"
      >
        {sidebarCollapsed ? (
          <ChevronRight className="w-3.5 h-3.5" />
        ) : (
          <ChevronLeft className="w-3.5 h-3.5" />
        )}
      </button>

      {/* Logo */}
      <div
        className={cn(
          'flex items-center gap-3 px-4 py-5 border-b border-sidebar-border',
          sidebarCollapsed && 'justify-center px-2'
        )}
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-600">
          <Package className="h-4 w-4 text-white" />
        </div>
        {!sidebarCollapsed && (
          <div>
            <p className="text-sm font-bold text-white leading-none">RetailHub</p>
            <p className="text-[10px] text-sidebar-text-muted mt-0.5">Admin Console</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)
          const badgeCount = item.badgeKey ? badgeValues[item.badgeKey] : 0

          return (
            <Link
              key={item.href}
              href={item.href}
              title={sidebarCollapsed ? item.label : undefined}
              className={cn(
                'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium',
                'transition-all duration-150 relative',
                sidebarCollapsed && 'justify-center px-2',
                active
                  ? 'bg-sidebar-active text-sidebar-text-active'
                  : 'text-sidebar-text hover:bg-sidebar-hover hover:text-sidebar-text-active'
              )}
            >
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-brand-400 rounded-r-full" />
              )}
              <Icon
                className={cn(
                  'h-[18px] w-[18px] shrink-0 transition-colors',
                  active ? 'text-brand-400' : 'text-sidebar-text group-hover:text-sidebar-text-active'
                )}
              />
              {!sidebarCollapsed && (
                <>
                  <span className="flex-1">{item.label}</span>
                  {badgeCount > 0 && (
                    <CountBadge count={badgeCount} />
                  )}
                </>
              )}
              {sidebarCollapsed && badgeCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                  {badgeCount > 99 ? '99+' : badgeCount}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Admin profile */}
      <div className="border-t border-sidebar-border p-3">
        <div
          className={cn(
            'flex items-center gap-3 rounded-lg px-2 py-2',
            sidebarCollapsed && 'justify-center flex-col gap-2'
          )}
        >
          <Avatar
            name={admin?.name || 'Admin'}
            src={admin?.avatar_url}
            size="sm"
            online={true}
          />
          {!sidebarCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">
                {admin?.name || 'Administrator'}
              </p>
              <p className="text-[10px] text-sidebar-text-muted truncate">{admin?.email}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            title="Logout"
            className="p-1.5 rounded-md text-sidebar-text hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
