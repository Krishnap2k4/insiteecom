'use client'
import ButtonLoading from '@/components/Application/ButtonLoading'
import MediaModal from '@/components/Application/Admin/MediaModal'
import { Checkbox } from '@/components/ui/checkbox'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { zodResolver } from '@hookform/resolvers/zod'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import slugify from 'slugify'
import { z } from 'zod'

const formSchema = z.object({
    name: z.string().min(2, 'Name is required.'),
    slug: z.string().min(2).regex(/^[a-z0-9-]+$/, 'Use lowercase letters, numbers and hyphens only.'),
    description: z.string().max(2000).optional().default(''),
    isActive: z.boolean().default(true),
    seo: z.object({
        title: z.string().optional(),
        description: z.string().optional(),
    }).optional(),
})

/**
 * Shared form for adding and editing a Brand.
 *
 * Logo selection uses the existing MediaModal — keeps brand asset
 * management consistent with how products pick images. Slug auto-fills
 * from the name on first edit; admin can override.
 */
const BrandForm = ({ initialValues, onSubmit, loading, submitLabel = 'Save brand' }) => {
    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            slug: '',
            description: '',
            isActive: true,
            seo: { title: '', description: '' },
            ...initialValues,
        },
    })

    const [mediaOpen, setMediaOpen] = useState(false)
    const [selectedLogo, setSelectedLogo] = useState(() => {
        if (initialValues?.logo?.secure_url) {
            return [{ _id: initialValues.logo._id, url: initialValues.logo.secure_url }]
        }
        return []
    })

    useEffect(() => {
        if (initialValues) {
            form.reset({
                name: '', slug: '', description: '', isActive: true,
                seo: { title: '', description: '' },
                ...initialValues,
            })
            if (initialValues.logo?.secure_url) {
                setSelectedLogo([{ _id: initialValues.logo._id, url: initialValues.logo.secure_url }])
            }
        }
    }, [initialValues])

    // Auto-derive slug from name (only when slug is still empty/untouched).
    const nameValue = form.watch('name')
    const slugValue = form.watch('slug')
    useEffect(() => {
        if (!nameValue) return
        if (!slugValue || initialValues?.name === nameValue) return
        // If slug field has never been hand-edited, auto-sync.
        const derived = slugify(nameValue, { lower: true, strict: true })
        if (slugValue === slugify(initialValues?.name || '', { lower: true, strict: true })) {
            form.setValue('slug', derived)
        } else if (!initialValues) {
            form.setValue('slug', derived)
        }
    }, [nameValue])

    const handleSubmit = (values) => {
        onSubmit({
            ...values,
            logo: selectedLogo[0]?._id || null,
        })
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className='grid md:grid-cols-2 gap-5'>
                <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Name <span className='text-red-500'>*</span></FormLabel>
                        <FormControl><Input placeholder="e.g. Nike" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="slug" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Slug <span className='text-red-500'>*</span></FormLabel>
                        <FormControl><Input placeholder="nike" {...field} /></FormControl>
                        <p className='text-xs text-gray-500'>Storefront URL: /b/{field.value || 'your-slug'}</p>
                        <FormMessage />
                    </FormItem>
                )} />
                <div className='md:col-span-2'>
                    <FormField control={form.control} name="description" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl><Textarea rows={3} placeholder="What does this brand stand for?" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>

                <div className='md:col-span-2'>
                    <FormLabel>Logo</FormLabel>
                    <div className='border border-dashed rounded p-5 text-center mt-2'>
                        <MediaModal
                            open={mediaOpen}
                            setOpen={setMediaOpen}
                            selectedMedia={selectedLogo}
                            setSelectedMedia={setSelectedLogo}
                            isMultiple={false}
                        />
                        {selectedLogo.length > 0 ? (
                            <div className='flex flex-col items-center gap-3'>
                                <div className='w-32 h-32 border rounded p-2 bg-white'>
                                    <Image src={selectedLogo[0].url} width={128} height={128} alt='logo' className='w-full h-full object-contain' />
                                </div>
                                <button type='button' onClick={() => setMediaOpen(true)} className='text-sm text-primary hover:underline cursor-pointer'>
                                    Change logo
                                </button>
                            </div>
                        ) : (
                            <div onClick={() => setMediaOpen(true)} className='bg-gray-50 dark:bg-card border w-[200px] mx-auto p-5 cursor-pointer'>
                                <span className='font-semibold'>Select Logo</span>
                            </div>
                        )}
                    </div>
                </div>

                <FormField control={form.control} name="isActive" render={({ field }) => (
                    <FormItem className='flex flex-row items-start gap-3 space-y-0'>
                        <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <div>
                            <FormLabel className='cursor-pointer'>Active</FormLabel>
                            <p className='text-xs text-gray-500'>Inactive brands are hidden from the storefront.</p>
                        </div>
                    </FormItem>
                )} />

                <div className='md:col-span-2 mt-2 pt-4 border-t'>
                    <h4 className='font-semibold mb-3 text-sm uppercase text-gray-500'>SEO (optional)</h4>
                    <div className='grid md:grid-cols-2 gap-4'>
                        <FormField control={form.control} name="seo.title" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Meta title</FormLabel>
                                <FormControl><Input placeholder="Defaults to brand name" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="seo.description" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Meta description</FormLabel>
                                <FormControl><Input placeholder="Short blurb for search engines" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </div>
                </div>

                <div className='md:col-span-2 mt-2'>
                    <ButtonLoading loading={loading} type='submit' text={submitLabel} className='cursor-pointer' />
                </div>
            </form>
        </Form>
    )
}

export default BrandForm
