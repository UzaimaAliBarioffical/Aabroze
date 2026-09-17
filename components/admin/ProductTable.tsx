import Link from 'next/link'
import Image from 'next/image'
import { formatPKR } from '@/lib/utils'
import type { Product } from '@/types'

interface ProductTableProps {
  products: Product[]
}

export default function ProductTable({ products }: ProductTableProps) {
  return (
    <div className="bg-white rounded border border-beige-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-sans border-collapse">
          <thead>
            <tr className="bg-beige-100/60 border-b border-beige-200 text-charcoal-200 uppercase tracking-wider">
              <th className="p-3.5">Product</th>
              <th className="p-3.5">Category</th>
              <th className="p-3.5">Price</th>
              <th className="p-3.5">Status</th>
              <th className="p-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-beige-100">
            {products.map((p) => {
              const inStock = p.variants?.some((v) => v.stock > 0) ?? false
              return (
                <tr key={p.id} className="hover:bg-cream/50 transition-colors">
                  <td className="p-3.5 flex items-center gap-3">
                    <div className="relative w-10 h-12 bg-beige-100 flex-shrink-0">
                      <Image
                        src={p.images?.[0]?.url || '/brand/placeholder.png'}
                        alt={p.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <p className="font-medium text-charcoal-300 line-clamp-1">{p.name}</p>
                      <p className="text-[10px] text-taupe-200">{p.sku || 'No SKU'}</p>
                    </div>
                  </td>
                  <td className="p-3.5 text-charcoal-200">{p.category_id || 'General'}</td>
                  <td className="p-3.5 font-medium text-charcoal-300">
                    {formatPKR(p.sale_price ?? p.price)}
                  </td>
                  <td className="p-3.5">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider ${
                        inStock ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                      }`}
                    >
                      {inStock ? 'In Stock' : 'Out of Stock'}
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    <Link
                      href={`/admin/products/${p.id}/edit`}
                      className="text-taupe-300 hover:text-charcoal-300 font-medium"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
