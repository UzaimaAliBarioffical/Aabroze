'use client'

import Image, { type ImageProps } from 'next/image'
import { useState, type ReactNode } from 'react'

type SafeImageProps = Omit<ImageProps, 'onError'> & {
  fallbackSrc?: ImageProps['src']
  fallback?: ReactNode
}

export default function SafeImage(props: SafeImageProps) {
  // A new source gets a fresh attempt, including after a previous failure.
  return <ImageWithFallback key={JSON.stringify([props.src, props.fallbackSrc])} {...props} />
}

function ImageWithFallback({ src, alt, fallbackSrc, fallback = null, ...props }: SafeImageProps) {
  const [status, setStatus] = useState<'primary' | 'fallback' | 'failed'>('primary')
  const imageSrc = status === 'primary' ? src : fallbackSrc

  if (status === 'failed' || !imageSrc) return <>{fallback}</>

  return (
    <Image
      {...props}
      src={imageSrc}
      alt={alt}
      onError={() => {
        // Try the fallback once, then stop rendering the failed image.
        setStatus(status === 'primary' && fallbackSrc && fallbackSrc !== src ? 'fallback' : 'failed')
      }}
    />
  )
}
