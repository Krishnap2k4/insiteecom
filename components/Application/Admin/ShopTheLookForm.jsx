'use client'
import MediaModal from '@/components/Application/Admin/MediaModal'
import ButtonLoading from '@/components/Application/ButtonLoading'
import Select from '@/components/Application/Select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import useFetch from '@/hooks/useFetch'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import imgPlaceholder from '@/public/assets/images/img-placeholder.webp'

const ShopTheLookForm = ({ initial = {}, onSubmit, loading, submitLabel = 'Save' }) => {
    const [title, setTitle] = useState(initial.title || '')
    const [description, setDescription] = useState(initial.description || '')
    const [videoUrl, setVideoUrl] = useState(initial.videoUrl || '')
    const [thumbnail, setThumbnail] = useState(
        initial.thumbnail ? [{ _id: initial.thumbnail._id, url: initial.thumbnail.secure_url }] : []
    )
    const [product, setProduct] = useState(initial.product?._id || '')
    const [sortOrder, setSortOrder] = useState(initial.sortOrder ?? 0)
    const [isActive, setIsActive] = useState(initial.isActive !== false)
    const [mediaOpen, setMediaOpen] = useState(false)

    const { data: productsData } = useFetch('/api/product?deleteType=SD&size=10000')
    const productOptions = productsData?.success
        ? productsData.data.map((p) => ({ label: p.name, value: p._id }))
        : []

    useEffect(() => {
        setTitle(initial.title || '')
        setDescription(initial.description || '')
        setVideoUrl(initial.videoUrl || '')
        setThumbnail(initial.thumbnail ? [{ _id: initial.thumbnail._id, url: initial.thumbnail.secure_url }] : [])
        setProduct(initial.product?._id || '')
        setSortOrder(initial.sortOrder ?? 0)
        setIsActive(initial.isActive !== false)
    }, [initial._id])

    const handleSubmit = (e) => {
        e.preventDefault()
        onSubmit({
            title,
            description,
            videoUrl,
            thumbnail: thumbnail[0]?._id || null,
            product: product || null,
            sortOrder: Number(sortOrder) || 0,
            isActive,
        })
    }

    return (
        <form onSubmit={handleSubmit} className='space-y-5 max-w-2xl'>

            <div>
                <Label className='mb-2 block'>Title <span className='text-red-500'>*</span></Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder='e.g. Oud Noir Ritual' required />
            </div>

            <div>
                <Label className='mb-2 block'>Description</Label>
                <Textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder='Short description shown in the video popup'
                />
            </div>

            <div>
                <Label className='mb-2 block'>Video URL <span className='text-red-500'>*</span></Label>
                <Input
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder='Cloudinary URL, YouTube, or Vimeo link'
                    required
                />
                <p className='text-xs text-gray-500 mt-1'>Supports Cloudinary (.mp4), YouTube, and Vimeo URLs.</p>
            </div>

            <div>
                <Label className='mb-2 block'>Thumbnail Image</Label>
                <div className='border border-dashed rounded p-4 text-center'>
                    <MediaModal
                        open={mediaOpen}
                        setOpen={setMediaOpen}
                        selectedMedia={thumbnail}
                        setSelectedMedia={setThumbnail}
                        isMultiple={false}
                    />
                    {thumbnail.length > 0 ? (
                        <div className='flex flex-col items-center gap-3'>
                            <div className='w-40 h-24 border rounded overflow-hidden relative'>
                                <Image src={thumbnail[0].url} fill alt='thumbnail' className='object-cover' />
                            </div>
                            <button type='button' onClick={() => setMediaOpen(true)} className='text-sm text-primary hover:underline cursor-pointer'>
                                Change image
                            </button>
                        </div>
                    ) : (
                        <div onClick={() => setMediaOpen(true)} className='bg-gray-50 dark:bg-card border w-[200px] mx-auto p-4 cursor-pointer'>
                            <span className='text-sm font-semibold'>Select thumbnail</span>
                        </div>
                    )}
                </div>
                <p className='text-xs text-gray-500 mt-1'>Used as the card preview. If empty, the video&apos;s first frame is shown.</p>
            </div>

            <div>
                <Label className='mb-2 block'>Linked Product</Label>
                <Select
                    options={productOptions}
                    selected={product}
                    setSelected={setProduct}
                    isMulti={false}
                    placeholder='Select a product (optional)'
                />
                <p className='text-xs text-gray-500 mt-1'>Shown in the video popup alongside the description.</p>
            </div>

            <div className='grid grid-cols-2 gap-5'>
                <div>
                    <Label className='mb-2 block'>Sort Order</Label>
                    <Input type='number' value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} min={0} />
                    <p className='text-xs text-gray-500 mt-1'>Lower = appears first.</p>
                </div>
                <div className='flex flex-col justify-center gap-2'>
                    <Label>Active</Label>
                    <Switch checked={isActive} onCheckedChange={setIsActive} />
                    <p className='text-xs text-gray-500'>Inactive items are hidden on the storefront.</p>
                </div>
            </div>

            <ButtonLoading loading={loading} type='submit' text={submitLabel} className='cursor-pointer' />
        </form>
    )
}

export default ShopTheLookForm
