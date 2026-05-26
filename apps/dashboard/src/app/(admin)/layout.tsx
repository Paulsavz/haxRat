import AdminSidebar from '@/components/layout/AdminSidebar'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-content-bg">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto scrollbar-content">
        {children}
      </main>
    </div>
  )
}
