'use server'

import { revalidatePath } from 'next/cache'
import { unstable_rethrow } from 'next/navigation'
import { requireAdmin } from '@/lib/admin-auth'
import { siteSettingSchema } from '@/lib/zod-schemas'

export async function updateSiteSetting(formData: FormData) {
  'use server'
  try {
    const supabase = await requireAdmin()
    const key = formData.get('key')
    const value = formData.get('value')
    const parsed = siteSettingSchema.safeParse({ key, value })
    if (!parsed.success) return { error: 'Invalid setting value.' }

    const { error } = await supabase
      .from('site_settings')
      .upsert({ key: parsed.data.key, value: parsed.data.value, updated_at: new Date().toISOString() })

    if (error) return { error: 'Failed to save setting.' }
    revalidatePath('/admin/settings')
    revalidatePath('/', 'layout')
    return { success: true }
  } catch (err) {
    unstable_rethrow(err)
    return { error: 'Unexpected error. Please try again.' }
  }
}
