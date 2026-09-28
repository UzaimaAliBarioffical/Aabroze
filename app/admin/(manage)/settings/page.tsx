import { requireAdmin } from '@/lib/admin-auth'
import { updateSiteSetting } from '@/actions/admin/settings'
import type { SiteSetting, NewsletterSubscriber } from '@/types'

const SETTING_LABELS: Record<string, string> = {
  store_name: 'Store Name',
  contact_email: 'Contact Email',
  whatsapp_number: 'WhatsApp Number',
  announcement_banner: 'Announcement Banner Text',
  instagram_url: 'Instagram URL',
  facebook_url: 'Facebook URL',
}

export default async function AdminSettingsPage() {
  const supabase = await requireAdmin()

  const [settingsRes, subscribersRes] = await Promise.all([
    supabase.from('site_settings').select('*').order('key'),
    supabase.from('newsletter_subscribers').select('*').order('created_at', { ascending: false }).limit(50),
  ])

  const settings: SiteSetting[] = settingsRes.data ?? []
  const subscribers: NewsletterSubscriber[] = subscribersRes.data ?? []

  const getValue = (key: string) => settings.find((s) => s.key === key)?.value ?? ''

  return (
    <div className="space-y-8">
      <h1 className="section-heading">Settings</h1>

      {/* Site Settings */}
      <section className="bg-white border border-beige-200 rounded p-6 space-y-6">
        <h2 className="font-serif text-xl text-charcoal-300">Site Settings</h2>
        {settingsRes.error ? (
          <p role="alert" className="text-sm text-red-600">
            Unable to load settings. Make sure the site_settings table exists in Supabase.
          </p>
        ) : (
          <div className="space-y-4">
            {Object.entries(SETTING_LABELS).map(([key, label]) => (
              <form key={key} action={updateSiteSetting} className="flex flex-wrap gap-2 items-end">
                <input type="hidden" name="key" value={key} />
                <label className="text-xs font-sans w-full sm:w-auto sm:flex-1">
                  {label}
                  <input
                    name="value"
                    defaultValue={getValue(key)}
                    className="form-input mt-2 w-full"
                    placeholder={`Enter ${label.toLowerCase()}`}
                  />
                </label>
                <button className="btn-secondary text-xs" type="submit">Save</button>
              </form>
            ))}
          </div>
        )}
      </section>

      {/* Newsletter Subscribers */}
      <section className="bg-white border border-beige-200 rounded p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl text-charcoal-300">Newsletter Subscribers</h2>
          <span className="text-xs font-sans text-taupe-200">
            {subscribers.filter((s) => s.is_active).length} active
          </span>
        </div>
        {subscribersRes.error ? (
          <p className="text-sm text-charcoal-100">Unable to load subscribers.</p>
        ) : subscribers.length === 0 ? (
          <p className="text-sm text-charcoal-100">No subscribers yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans border-collapse">
              <thead>
                <tr className="bg-beige-100/60 border-b border-beige-200 text-charcoal-200 uppercase tracking-wider">
                  <th className="p-3">Email</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-beige-100">
                {subscribers.map((s) => (
                  <tr key={s.id} className="hover:bg-cream/50">
                    <td className="p-3 text-charcoal-300">{s.email}</td>
                    <td className="p-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium uppercase ${s.is_active ? 'bg-green-50 text-green-700' : 'bg-beige-100 text-charcoal-200'}`}>
                        {s.is_active ? 'Active' : 'Unsubscribed'}
                      </span>
                    </td>
                    <td className="p-3 text-charcoal-200">
                      {new Date(s.created_at).toLocaleDateString('en-PK')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}