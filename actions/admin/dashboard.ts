'use server'

import { requireAdmin } from '@/lib/admin-auth'

export interface DashboardData {
  totalOrders: number
  totalRevenue: number
  pendingOrders: number
  lowStockCount: number
  recentOrders: {
    id: string
    order_number: string
    customer_name: string
    total: number
    status: string
    payment_method: string
    created_at: string
  }[]
}

export async function fetchDashboardData(): Promise<DashboardData> {
  const supabase = await requireAdmin()

  const [ordersRes, pendingRes, recentRes, variantsRes] = await Promise.all([
    supabase.from('orders').select('total', { count: 'exact' }),
    supabase.from('orders').select('id', { count: 'exact' }).eq('status', 'pending'),
    supabase.from('orders')
      .select('id, order_number, customer_name, total, status, payment_method, created_at')
      .order('created_at', { ascending: false })
      .limit(6),
    supabase.from('product_variants').select('id', { count: 'exact' }).gt('stock', 0).lte('stock', 3),
  ])

  const totalRevenue = (ordersRes.data ?? []).reduce((sum: number, o: { total?: number }) => sum + (o.total ?? 0), 0)

  return {
    totalOrders: ordersRes.count ?? 0,
    totalRevenue,
    pendingOrders: pendingRes.count ?? 0,
    lowStockCount: variantsRes.count ?? 0,
    recentOrders: (recentRes.data ?? []) as DashboardData['recentOrders'],
  }
}
