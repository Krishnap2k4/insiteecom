'use client'
import ButtonLoading from '@/components/Application/ButtonLoading'
import MediaModal from '@/components/Application/Admin/MediaModal'
import Select from '@/components/Application/Select'
import { Checkbox } from '@/components/ui/checkbox'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import axios from '@/lib/apiClient'
import { zodResolver } from '@hookform/resolvers/zod'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import slugify from 'slugify'
import { z } from 'zod'

const formSchema = z.object({
    name: z.string().min(2, 'Name is required.'),
    slug: z.string().min(2).regex(/^[a-z0-9-]+$/, 'Use lowercase letters, numbers and hyphens only.'),
    parent: z.string().nullable().optional(),
    description: z.string().max(2000).optional().default(''),
    sortOrder: z.coerce.number().int().optional().default(0),
    isActive: z.boolean().default(true),
    seo: z.object({
        title: z.string().optional(),
        description: z.string().optional(),
    }).optional(),
})

/**
 * Shared form for adding and editing a Category.
 *
 * Parent picker is populated from /api/category/tree and rendered as
 * a flat list with indent markers so admins can see the hierarchy
 * without a full tree control. The current category (when editing) is
 * excluded from the options so it can't be set as its own ancestor.
 */
const CategoryForm = ({ initialValues, onSubmit, loading, submitLabel = 'Save category', excludeId }) => {
    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            slug: '',
            parent: null,
            description: '',
            sortOrder: 0,
            isActive: true,
            seo: { title: '', description: '' },
            ...initialValues,
        },
    })

    const [parentOptions, setParentOptions] = useState([])
    const [mediaOpen, setMediaOpen] = useState(false)
    const [selectedImage, setSelectedImage] = useState(() => {
        if (initialValues?.image?.secure_url) {
            return [{ _id: initialValues.image._id, url: initialValues.image.secure_url }]
        }
        return []
    })

    // Load category tree → flatten with indentation. Exclude the
    // current category and all its descendants so an admin can't move
    // a node beneath itself.
    useEffect(() => {
        const load = async () => {
            try {
                const { data: res } = await axios.get('/api/category/tree')
                if (!res?.success) return

                const blocked = new Set()
                if (excludeId) {
                    blocked.add(String(excludeId))
                    const walk = (nodes) => {
                        for (const n of nodes) {
                            if (blocked.has(String(n.parent))) blocked.add(String(n._id))
                            if (n.children) walk(n.children)
                        }
                    }
                    walk(res.data)
                }

                const out = [{ value: '', label: '— None (top-level) —' }]
                const flatten = (nodes, depth = 0) => {
                    for (const node of nodes) {
                        if (!blocked.has(String(node._id))) {
                            out.push({
                                value: String(node._id),
                                label: `${'  '.repeat(depth)}${depth > 0 ? '↳ ' : ''}${node.name}`,
                            })
                        }
                        if (node.children) flatten(node.children, depth + 1)
                    }
                }
                flatten(res.data)
                setParentOptions(out)
            } catch {
                // ignore — picker stays empty
            }
        }
        load()
    }, [excludeId])

    useEffect(() => {
        if (initialValues) {
            form.reset({
                name: '', slug: '', parent: null, description: '',
                sortOrder: 0, isActive: true, seo: { title: '', description: '' },
                ...initialValues,
                parent: initialValues.parent ? String(initialValues.parent) : null,
            })
            if (initialValues.image?.secure_url) {
                setSelectedImage([{ _id: initialValues.image._id, url: initialValues.image.secure_url }])
            }
        }
    }, [initialValues])

    const nameValue = form.watch('name')
    useEffect(() => {
        if (!nameValue) return
        const derived = slugify(nameValue, { lower: true, strict: true })
        if (!initialValues) {
            form.setValue('slug', derived)
        }
    }, [nameValue])

    const handleSubmit = (values) => {
        onSubmit({
            ...values,
            parent: values.parent || null,
            image: selectedImage[0]?._id || null,
        })
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className='grid md:grid-cols-2 gap-5'>
                <FormField control={form.control} name="parent" render={({ field }) => (
                    <FormItem className='md:col-span-2'>
                        <FormLabel>Parent category</FormLabel>
                        <FormControl>
                            <Select
                                options={parentOptions}
                                selected={field.value || ''}
                                setSelected={(v) => field.onChange(v || null)}
                                isMulti={false}
                            />
                        </FormControl>
                        <p className='text-xs text-gray-500'>Leave as top-level to make this a root category.</p>
                        <FormMessage />
                    </FormItem>
                )} />

                <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Name <span className='text-red-500'>*</span></FormLabel>
                        <FormControl><Input placeholder="Category name" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="slug" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Slug <span className='text-red-500'>*</span></FormLabel>
                        <FormControl><Input placeholder="category-slug" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />

                <div className='md:col-span-2'>
                    <FormField control={form.control} name="description" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl><Textarea rows={3} placeholder="Optional category description" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>

                <FormField control={form.control} name="sortOrder" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Sort order</FormLabel>
                        <FormControl><Input type='number' {...field} /></FormControl>
                        <p className='text-xs text-gray-500'>Lower values appear first in storefront lists.</p>
                        <FormMessage />
                    </FormItem>
                )} />

                <FormField control={form.control} name="isActive" render={({ field }) => (
                    <FormItem className='flex flex-row items-start gap-3 space-y-0 pt-8'>
                        <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <div>
                            <FormLabel className='cursor-pointer'>Active</FormLabel>
                            <p className='text-xs text-gray-500'>Inactive categories are hidden from storefront.</p>
                        </div>
                    </FormItem>
                )} />

                <div className='md:col-span-2'>
                    <FormLabel>Image</FormLabel>
                    <div className='border border-dashed rounded p-5 text-center mt-2'>
                        <MediaModal
                            open={mediaOpen}
                            setOpen={setMediaOpen}
                            selectedMedia={selectedImage}
                            setSelectedMedia={setSelectedImage}
                            isMultiple={false}
                        />
                        {selectedImage.length > 0 ? (
                            <div className='flex flex-col items-center gap-3'>
                                <div className='w-32 h-32 border rounded overflow-hidden'>
                                    <Image src={selectedImage[0].url} width={128} height={128} alt='category' className='w-full h-full object-cover' />
                                </div>
                                <button type='button' onClick={() => setMediaOpen(true)} className='text-sm text-primary hover:underline cursor-pointer'>
                                    Change image
                                </button>
                            </div>
                        ) : (
                            <div onClick={() => setMediaOpen(true)} className='bg-gray-50 dark:bg-card border w-[200px] mx-auto p-5 cursor-pointer'>
                                <span className='font-semibold'>Select Image</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className='md:col-span-2 mt-2 pt-4 border-t'>
                    <h4 className='font-semibold mb-3 text-sm uppercase text-gray-500'>SEO (optional)</h4>
                    <div className='grid md:grid-cols-2 gap-4'>
                        <FormField control={form.control} name="seo.title" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Meta title</FormLabel>
                                <FormControl><Input placeholder="Defaults to category name" {...field} /></FormControl>
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

export default CategoryForm
