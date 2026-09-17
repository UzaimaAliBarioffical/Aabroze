/**
 * Cloudinary upload helper
 * ⚠️  Server-side only. API secret never leaves the server.
 */
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
})

export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/avif',
]
export const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime']
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10 MB
export const MAX_VIDEO_SIZE = 100 * 1024 * 1024 // 100 MB

export interface CloudinaryUploadResult {
  public_id: string
  secure_url: string
  resource_type: 'image' | 'video' | 'raw'
  width?: number
  height?: number
  format: string
  bytes: number
}

/**
 * Upload an image to Cloudinary under the aabroze/products folder.
 * Returns public_id and secure_url.
 */
export async function uploadProductImage(
  fileBuffer: Buffer,
  filename: string,
  productSlug: string
): Promise<CloudinaryUploadResult> {
  const result = await cloudinary.uploader.upload(
    `data:image/jpeg;base64,${fileBuffer.toString('base64')}`,
    {
      folder: `aabroze/products/${productSlug}`,
      public_id: filename,
      overwrite: false,
      transformation: [
        { quality: 'auto:good' },
        { fetch_format: 'auto' },
      ],
      resource_type: 'image',
    }
  )

  return {
    public_id: result.public_id,
    secure_url: result.secure_url,
    resource_type: 'image',
    width: result.width,
    height: result.height,
    format: result.format,
    bytes: result.bytes,
  }
}

/**
 * Upload a product video to Cloudinary.
 */
export async function uploadProductVideo(
  fileBuffer: Buffer,
  filename: string,
  productSlug: string
): Promise<CloudinaryUploadResult> {
  const result = await cloudinary.uploader.upload(
    `data:video/mp4;base64,${fileBuffer.toString('base64')}`,
    {
      folder: `aabroze/products/${productSlug}`,
      public_id: filename,
      overwrite: false,
      resource_type: 'video',
      transformation: [
        { quality: 'auto:good' },
        { fetch_format: 'auto' },
      ],
    }
  )

  return {
    public_id: result.public_id,
    secure_url: result.secure_url,
    resource_type: 'video',
    format: result.format,
    bytes: result.bytes,
  }
}

/**
 * Delete a Cloudinary asset by public_id.
 */
export async function deleteCloudinaryAsset(
  publicId: string,
  resourceType: 'image' | 'video' = 'image'
): Promise<void> {
  await cloudinary.uploader.destroy(publicId, { resource_type: resourceType })
}

/**
 * Generate a Cloudinary URL with transformations.
 */
export function getCloudinaryUrl(
  publicId: string,
  options: {
    width?: number
    height?: number
    quality?: string
    format?: string
    crop?: string
  } = {}
): string {
  const transforms: string[] = []

  if (options.width) transforms.push(`w_${options.width}`)
  if (options.height) transforms.push(`h_${options.height}`)
  if (options.crop) transforms.push(`c_${options.crop}`)
  if (options.quality) transforms.push(`q_${options.quality}`)
  if (options.format) transforms.push(`f_${options.format}`)

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME
  const transformString = transforms.length > 0 ? transforms.join(',') + '/' : ''
  return `https://res.cloudinary.com/${cloudName}/image/upload/${transformString}${publicId}`
}

/**
 * Validate file type and size before upload.
 */
export function validateFileUpload(
  mimeType: string,
  fileSize: number,
  isVideo = false
): { valid: boolean; error?: string } {
  const allowedTypes = isVideo ? ALLOWED_VIDEO_TYPES : ALLOWED_IMAGE_TYPES
  const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE

  if (!allowedTypes.includes(mimeType)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed: ${allowedTypes.join(', ')}`,
    }
  }

  if (fileSize > maxSize) {
    return {
      valid: false,
      error: `File too large. Maximum size: ${Math.round(maxSize / 1024 / 1024)}MB`,
    }
  }

  return { valid: true }
}
