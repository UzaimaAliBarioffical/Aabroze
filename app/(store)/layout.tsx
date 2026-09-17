import AnnouncementBar from '@/components/store/AnnouncementBar'
import Header from '@/components/store/Header'
import Footer from '@/components/store/Footer'

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <AnnouncementBar />
      <Header />
      <main className="flex-grow">{children}</main>
      <Footer />
    </div>
  )
}
