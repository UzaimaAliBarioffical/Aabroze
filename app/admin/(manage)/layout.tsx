import AdminSidebar from '@/components/admin/AdminSidebar'
import { requireAdmin } from '@/lib/admin-auth'
import { signOutAdmin } from '@/actions/admin-auth'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin()
  return <div className="min-h-screen bg-cream md:flex">
    <AdminSidebar />
    <div className="flex-1 min-w-0 p-4 md:p-8">
      <form action={signOutAdmin} className="text-right mb-6">
        <button className="text-xs font-sans underline" type="submit">Sign out</button>
      </form>
      <main>{children}</main>
    </div>
  </div>
}
