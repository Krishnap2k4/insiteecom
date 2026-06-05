'use client'
import Image from 'next/image'
import { useRef, useState } from 'react'
import { FiImage, FiX } from 'react-icons/fi'
import { showToast } from '@/lib/showToast'
import axios from '@/lib/apiClient'

/**
 * Customer-facing image uploader. Uses Cloudinary's signed-upload
 * REST API directly so it works inside any container — including
 * Radix Dialogs, where the third-party `CldUploadWidget` portal
 * conflicts with the dialog's outside-click handling and leaves the
 * widget unclickable.
 *
 * Flow per file:
 *   1. POST a `{ paramsToSign: { timestamp, upload_preset, folder } }`
 *      to `/api/cloudinary-signature` → server signs with the secret.
 *   2. POST a multipart form to `https://api.cloudinary.com/v1_1/<cloud>/image/upload`.
 *   3. Pull `secure_url` off the response and append to the list.
 *
 * Props:
 *   value     — string[] currently-attached URLs
 *   onChange  — fn(string[]) new list after add/remove
 *   max       — max files (default 5)
 *   folder    — Cloudinary folder for these uploads
 *   helpText  — small text under the dropzone
 */
const ACCEPTED = ['image/png', 'image/jpeg', 'image/webp']
const MAX_BYTES = 8 * 1024 * 1024

const ImageUploader = ({
    value = [],
    onChange,
    max = 5,
    folder = '',
    label = 'Upload photos',
    helpText,
}) => {
    const fileRef = useRef(null)
    const [uploading, setUploading] = useState(false)
    const [progress, setProgress] = useState(0)

    const remaining = Math.max(0, max - (value?.length || 0))

    const uploadOne = async (file) => {
        if (!ACCEPTED.includes(file.type)) {
            throw new Error(`${file.name}: only PNG, JPG, or WebP are allowed.`)
        }
        if (file.size > MAX_BYTES) {
            throw new Error(`${file.name}: file is over 8 MB.`)
        }

        const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
        const apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY
        const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
        if (!cloudName || !apiKey || !uploadPreset) {
            throw new Error('Image upload is not configured. Please contact support.')
        }

        const timestamp = Math.round(Date.now() / 1000)
        // Folder is optional — if not provided, the preset's default
        // folder applies. Either way, every param we sign must also
        // be present in the upload form, otherwise Cloudinary rejects
        // the signature.
        const paramsToSign = { timestamp, upload_preset: uploadPreset }
        if (folder) paramsToSign.folder = folder

        const { data: sigRes } = await axios.post('/api/cloudinary-signature', { paramsToSign })
        if (!sigRes?.signature) throw new Error('Could not sign upload.')

        const form = new FormData()
        form.append('file', file)
        form.append('api_key', apiKey)
        form.append('timestamp', String(timestamp))
        form.append('upload_preset', uploadPreset)
        if (folder) form.append('folder', folder)
        form.append('signature', sigRes.signature)

        const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
            method: 'POST',
            body: form,
        })
        const json = await res.json()
        if (!res.ok || !json.secure_url) {
            throw new Error(json?.error?.message || 'Upload failed.')
        }
        return json.secure_url
    }

    const onPick = async (e) => {
        const files = Array.from(e.target?.files || [])
        // Reset the input so picking the same file again re-fires onChange.
        if (fileRef.current) fileRef.current.value = ''
        if (files.length === 0) return
        if (files.length > remaining) {
            showToast('error', `You can upload up to ${max} photos (${remaining} left).`)
            return
        }

        setUploading(true)
        setProgress(0)
        const next = [...(value || [])]
        let done = 0
        for (const file of files) {
            try {
                const url = await uploadOne(file)
                next.push(url)
                onChange([...next])
            } catch (err) {
                showToast('error', err.message)
            } finally {
                done += 1
                setProgress(Math.round((done / files.length) * 100))
            }
        }
        setUploading(false)
        setProgress(0)
    }

    const removeAt = (idx) => {
        const next = [...(value || [])]
        next.splice(idx, 1)
        onChange(next)
    }

    return (
        <div className='border border-dashed rounded p-3'>
            {value?.length > 0 && (
                <div className='flex flex-wrap gap-2 mb-3'>
                    {value.map((url, i) => (
                        <div key={url + i} className='relative w-16 h-16 border rounded overflow-hidden'>
                            <Image src={url} alt='' width={64} height={64} className='w-full h-full object-cover' />
                            <button
                                type='button'
                                onClick={() => removeAt(i)}
                                className='absolute -top-2 -right-2 bg-white rounded-full border shadow w-5 h-5 flex items-center justify-center text-red-500'
                                aria-label='Remove image'
                            >
                                <FiX size={10} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <input
                ref={fileRef}
                type='file'
                accept={ACCEPTED.join(',')}
                multiple={max > 1}
                className='hidden'
                onChange={onPick}
            />

            <button
                type='button'
                onClick={() => {
                    if (remaining <= 0) {
                        showToast('error', `You can upload up to ${max} photos.`)
                        return
                    }
                    fileRef.current?.click()
                }}
                disabled={uploading}
                className='text-xs inline-flex items-center gap-1 text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed'
            >
                <FiImage size={12} />
                {uploading
                    ? `Uploading… ${progress}%`
                    : value?.length > 0
                        ? `Add more (${remaining} left)`
                        : label}
            </button>

            {helpText && <p className='text-[11px] text-gray-400 mt-2'>{helpText}</p>}
        </div>
    )
}

export default ImageUploader
