import type { Product } from '@/types'

export interface CollectionImage {
  slug: string
  name: string
  color: string
  src: string
  alt: string
}

export const collectionImages: CollectionImage[] = [
  {
    slug: 'lime-lilac-set',
    name: 'Lime & Lilac Set',
    color: 'Lime / Lilac',
    src: '/products/lime-lilac-set.png',
    alt: 'Lime kurta with lilac trousers and dupatta',
  },
  {
    slug: 'teal-embroidered-kurta',
    name: 'Teal Embroidered Kurta',
    color: 'Teal / Ivory',
    src: '/products/teal-embroidered-kurta.png',
    alt: 'Teal kurta with white embroidery and ivory trousers',
  },
  {
    slug: 'ochre-embroidered-kurta',
    name: 'Ochre Embroidered Kurta',
    color: 'Ochre / Ivory',
    src: '/products/ochre-embroidered-kurta.png',
    alt: 'Ochre kurta with floral embroidery and ivory trousers',
  },
  {
    slug: 'crimson-kurta-set',
    name: 'Crimson Kurta Set',
    color: 'Crimson / Ivory',
    src: '/products/crimson-kurta-set.png',
    alt: 'Crimson kurta with scalloped trim and printed ivory trousers',
  },
  {
    slug: 'mustard-paisley-set',
    name: 'Mustard Paisley Set',
    color: 'Mustard',
    src: '/products/mustard-paisley-set.png',
    alt: 'Mustard paisley print kurta with matching trousers',
  },
  {
    slug: 'ivory-polka-dot-set',
    name: 'Ivory Polka Dot Set',
    color: 'Ivory / Orange',
    src: '/products/ivory-polka-dot-set.png',
    alt: 'Ivory polka dot kurta and trousers with orange border detailing',
  },
]

export function getCollectionImage(slug: string) {
  return collectionImages.find((image) => image.slug === slug) ?? collectionImages[0]
}

export function getProductImage(product: Pick<Product, 'slug' | 'images'>) {
  return product.images?.[0]?.url || getCollectionImage(product.slug).src
}
