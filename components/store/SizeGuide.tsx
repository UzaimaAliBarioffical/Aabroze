'use client'

import Modal from '@/components/ui/Modal'

interface SizeGuideProps {
  isOpen: boolean
  onClose: () => void
}

export default function SizeGuide({ isOpen, onClose }: SizeGuideProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Size Guide (Inches)" size="lg">
      <div className="space-y-4">
        <p className="text-xs text-charcoal-200 font-sans leading-relaxed">
          Standard measurements for ready-to-wear eastern attire. Custom alterations may be requested via WhatsApp support.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-xs font-sans text-left border-collapse">
            <thead>
              <tr className="border-b border-beige-200 bg-beige-100/50">
                <th className="p-2.5 font-medium text-charcoal-300">Size</th>
                <th className="p-2.5 font-medium text-charcoal-300">Chest</th>
                <th className="p-2.5 font-medium text-charcoal-300">Waist</th>
                <th className="p-2.5 font-medium text-charcoal-300">Hips</th>
                <th className="p-2.5 font-medium text-charcoal-300">Shirt Length</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-beige-100">
              <tr>
                <td className="p-2.5 font-medium text-charcoal-300">XS</td>
                <td className="p-2.5 text-charcoal-200">36"</td>
                <td className="p-2.5 text-charcoal-200">32"</td>
                <td className="p-2.5 text-charcoal-200">38"</td>
                <td className="p-2.5 text-charcoal-200">39"</td>
              </tr>
              <tr>
                <td className="p-2.5 font-medium text-charcoal-300">S</td>
                <td className="p-2.5 text-charcoal-200">38"</td>
                <td className="p-2.5 text-charcoal-200">34"</td>
                <td className="p-2.5 text-charcoal-200">40"</td>
                <td className="p-2.5 text-charcoal-200">40"</td>
              </tr>
              <tr>
                <td className="p-2.5 font-medium text-charcoal-300">M</td>
                <td className="p-2.5 text-charcoal-200">41"</td>
                <td className="p-2.5 text-charcoal-200">37"</td>
                <td className="p-2.5 text-charcoal-200">43"</td>
                <td className="p-2.5 text-charcoal-200">41"</td>
              </tr>
              <tr>
                <td className="p-2.5 font-medium text-charcoal-300">L</td>
                <td className="p-2.5 text-charcoal-200">44"</td>
                <td className="p-2.5 text-charcoal-200">40"</td>
                <td className="p-2.5 text-charcoal-200">46"</td>
                <td className="p-2.5 text-charcoal-200">42"</td>
              </tr>
              <tr>
                <td className="p-2.5 font-medium text-charcoal-300">XL</td>
                <td className="p-2.5 text-charcoal-200">47"</td>
                <td className="p-2.5 text-charcoal-200">43"</td>
                <td className="p-2.5 text-charcoal-200">49"</td>
                <td className="p-2.5 text-charcoal-200">42"</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="bg-cream p-3 rounded text-[11px] text-taupe-300 space-y-1">
          <p>• All measurements are approximate and may vary by +/- 0.5 inches.</p>
          <p>• For custom stitching queries, please reach out to us directly.</p>
        </div>
      </div>
    </Modal>
  )
}
