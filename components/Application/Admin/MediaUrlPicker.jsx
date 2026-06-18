'use client'
import { useState } from 'react'
import Image from 'next/image'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import MediaModal from '@/components/Application/Admin/MediaModal'
import { ImagePlus, X } from 'lucide-react'

/**
 * Single-image picker — paste a URL directly, or browse the Media library.
 * Emits the chosen URL via `onChange`. Used across the Settings page so all
 * image fields share one consistent UX (logo, hero background, etc.).
 */
const MediaUrlPicker = ({ value, onChange, placeholder = 'Paste image URL or browse library', previewClass = 'w-32 h-20' }) => {
    const [open, setOpen] = useState(false)
    const [selected, setSelected] = useState([])

    const handleSelected = (mediaArr) => {
        setSelected(mediaArr)
        const url = mediaArr?.[0]?.url
        if (url) onChange(url)
    }

    return (
        <div className='space-y-2'>
            <div className='flex gap-2'>
                <Input value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
                <Button type='button' variant='outline' size='sm' onClick={() => setOpen(true)} className='shrink-0 cursor-pointer'>
                    <ImagePlus size={14} className='mr-1' /> Browse
                </Button>
                {value && (
                    <Button type='button' variant='ghost' size='icon' onClick={() => onChange('')} className='shrink-0 cursor-pointer' title='Clear'>
                        <X size={14} />
                    </Button>
                )}
            </div>
            {value && (
                <div className={`relative border rounded overflow-hidden ${previewClass}`}>
                    <Image src={value} fill alt='preview' className='object-cover' unoptimized />
                </div>
            )}
            <MediaModal
                open={open}
                setOpen={setOpen}
                selectedMedia={selected}
                setSelectedMedia={handleSelected}
                isMultiple={false}
            />
        </div>
    )
}

export default MediaUrlPicker
