import { createSupabaseServerClient } from '@/lib/supabase/server'

export default async function AnnouncementBar() {
  let text = 'Free delivery on orders above Rs. 3,000 | Cash on Delivery Available'
  let active = true

  try {
    const supabase = await createSupabaseServerClient()
    const { data } = await supabase
      .from('site_settings')
      .select('key, value')
      .in('key', ['announcement_bar_text', 'announcement_bar_active'])

    if (data) {
      const settings = Object.fromEntries(data.map((s) => [s.key, s.value]))
      text = settings['announcement_bar_text'] ?? text
      active = settings['announcement_bar_active'] !== 'false'
    }
  } catch {
    // Use defaults
  }

  if (!active) return null

  return (
    <div className="bg-charcoal-300 text-cream-100 py-2 px-4 text-center">
      <p className="text-xs font-sans tracking-widest uppercase">{text}</p>
    </div>
  )
}
