'use client'
import BreadCrumb from '@/components/Application/Admin/BreadCrumb'
import Editor from '@/components/Application/Admin/Editor'
import MediaModal from '@/components/Application/Admin/MediaModal'
import OptionsEditor from '@/components/Application/Admin/OptionsEditor'
import SpecificationsEditor from '@/components/Application/Admin/SpecificationsEditor'
import TagsInput from '@/components/Application/Admin/TagsInput'
import VariantsManager from '@/components/Application/Admin/VariantsManager'
import ButtonLoading from '@/components/Application/ButtonLoading'
import Select from '@/components/Application/Select'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import useFetch from '@/hooks/useFetch'
import axios from '@/lib/apiClient'
import { showToast } from '@/lib/showToast'
import { zSchema } from '@/lib/zodSchema'
import { ADMIN_DASHBOARD, ADMIN_PRODUCT_SHOW } from '@/routes/AdminPanelRoute'
import { zodResolver } from '@hookform/resolvers/zod'
import { Chip } from '@mui/material'
import Image from 'next/image'
import { use, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { FiTag } from 'react-icons/fi'
import slugify from 'slugify'

const Section = ({ title, description, action, children }) => (
    <Card className='py-0 rounded shadow-sm'>
        <CardHeader className='pt-3 px-3 border-b [.border-b]:pb-2'>
            <div className='flex items-center justify-between gap-3 flex-wrap'>
                <div>
                    <h4 className='text-lg font-semibold'>{title}</h4>
                    {description && <p className='text-xs text-gray-500'>{description}</p>}
                </div>
                {action}
            </div>
        </CardHeader>
        <CardContent className='pb-5 pt-4'>{children}</CardContent>
    </Card>
)

const breadcrumbData = [
    { href: ADMIN_DASHBOARD, label: 'Home' },
    { href: ADMIN_PRODUCT_SHOW, label: 'Products' },
    { href: '', label: 'Edit Product' },
]

const STATUS_OPTIONS = [
    { label: 'Published — visible on storefront', value: 'published' },
    { label: 'Draft — hidden until ready', value: 'draft' },
    { label: 'Archived — hidden, kept for history', value: 'archived' },
]

const EditProductPage = ({ params }) => {
    const { id } = use(params)

    const [loading, setLoading] = useState(false)
    const [categoryOption, setCategoryOption] = useState([])
    const [brandOption, setBrandOption] = useState([{ label: '— No brand —', value: '' }])
    const { data: getCategory } = useFetch('/api/category?deleteType=SD&&size=10000')
    const { data: getBrands } = useFetch('/api/brand/get-brands')
    const { data: getProduct, loading: getProductLoading } = useFetch(`/api/product/get/${id}`)

    // Media
    const [mediaOpen, setMediaOpen] = useState(false)
    const [selectedMedia, setSelectedMedia] = useState([])

    // Module-2 fields
    const [brand, setBrand] = useState('')
    const [status, setStatus] = useState('published')
    const [shortDescription, setShortDescription] = useState('')
    const [tags, setTags] = useState([])
    const [options, setOptions] = useState([])
    const [specifications, setSpecifications] = useState([])

    // SEO
    const [seoTitle, setSeoTitle] = useState('')
    const [seoDescription, setSeoDescription] = useState('')
    const [seoCanonical, setSeoCanonical] = useState('')
    const [ogMediaOpen, setOgMediaOpen] = useState(false)
    const [seoOgImage, setSeoOgImage] = useState([])

    useEffect(() => {
        if (getCategory?.success) {
            setCategoryOption(getCategory.data.map((c) => ({ label: c.name, value: c._id })))
        }
    }, [getCategory])

    useEffect(() => {
        if (getBrands?.success) {
            setBrandOption([
                { label: '— No brand —', value: '' },
                ...getBrands.data.map((b) => ({ label: b.name, value: b._id })),
            ])
        }
    }, [getBrands])

    const formSchema = zSchema.pick({
        _id: true, name: true, slug: true, category: true,
        mrp: true, sellingPrice: true, discountPercentage: true, description: true,
    })

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            _id: id, name: '', slug: '', category: '',
            mrp: 0, sellingPrice: 0, discountPercentage: 0, description: '',
        },
    })

    useEffect(() => {
        if (getProduct?.success) {
            const product = getProduct.data
            form.reset({
                _id: product._id,
                name: product.name,
                slug: product.slug,
                category: product.category,
                mrp: product.mrp,
                sellingPrice: product.sellingPrice,
                discountPercentage: product.discountPercentage,
                description: product.description,
            })

            if (product.media) {
                setSelectedMedia(product.media.map((m) => ({ _id: m._id, url: m.secure_url })))
            }

            setBrand(product.brand ? String(product.brand) : '')
            setStatus(product.status || 'published')
            setShortDescription(product.shortDescription || '')
            setTags(Array.isArray(product.tags) ? product.tags : [])
            setOptions(Array.isArray(product.options) ? product.options : [])
            setSpecifications(Array.isArray(product.specifications) ? product.specifications : [])
            setSeoTitle(product.seo?.title || '')
            setSeoDescription(product.seo?.description || '')
            setSeoCanonical(product.seo?.canonical || '')
            if (product.seo?.ogImage?.secure_url) {
                setSeoOgImage([{ _id: product.seo.ogImage._id, url: product.seo.ogImage.secure_url }])
            }
        }
    }, [getProduct])

    useEffect(() => {
        const name = form.getValues('name')
        if (name) form.setValue('slug', slugify(name, { lower: true, strict: true }))
    }, [form.watch('name')])

    useEffect(() => {
        const mrp = Number(form.getValues('mrp')) || 0
        const sp = Number(form.getValues('sellingPrice')) || 0
        if (mrp > 0 && sp > 0) {
            form.setValue('discountPercentage', Math.max(0, Math.round(((mrp - sp) / mrp) * 100)))
        }
    }, [form.watch('mrp'), form.watch('sellingPrice')])

    const editor = (_event, editorInstance) => {
        form.setValue('description', editorInstance.getData())
    }

    const onSubmit = async (values) => {
        setLoading(true)
        try {
            if (selectedMedia.length <= 0) {
                showToast('error', 'Please select at least one image.')
                return
            }

            const payload = {
                ...values,
                media: selectedMedia.map((m) => m._id),
                brand: brand || null,
                status,
                shortDescription,
                tags,
                options: options.filter((o) => o.name && o.name.trim() !== ''),
                specifications: specifications.filter((s) => s.name && s.value),
                seo: {
                    title: seoTitle,
                    description: seoDescription,
                    canonical: seoCanonical,
                    ogImage: seoOgImage[0]?._id || null,
                },
            }

            const { data: response } = await axios.put('/api/product/update', payload)
            if (!response?.success) throw new Error(response?.message || 'Could not save product.')
            showToast('success', response.message)
        } catch (err) {
            showToast('error', err.message)
        } finally {
            setLoading(false)
        }
    }

    const product = getProduct?.data
    const publicId = product?.publicId

    return (
        <div>
            <BreadCrumb breadcrumbData={breadcrumbData} />

            {publicId && (
                <div className='mb-4 flex items-center gap-2 flex-wrap'>
                    <Chip size='small' label={`publicId: ${publicId}`} variant='outlined' />
                    <Chip size='small' label={status} color={status === 'published' ? 'success' : status === 'draft' ? 'default' : 'warning'} variant='outlined' />
                </div>
            )}

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-5'>

                    <Section title='Basic information'>
                        <div className='grid md:grid-cols-2 gap-5'>
                            <FormField control={form.control} name='name' render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name <span className='text-red-500'>*</span></FormLabel>
                                    <FormControl><Input placeholder='Product name' {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name='slug' render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Slug <span className='text-red-500'>*</span></FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                    <p className='text-xs text-gray-500'>Storefront URL: /product/{field.value}-{publicId || 'XXXXXXXX'}</p>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name='category' render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Category <span className='text-red-500'>*</span></FormLabel>
                                    <FormControl>
                                        <Select options={categoryOption} selected={field.value} setSelected={field.onChange} isMulti={false} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <div>
                                <Label className='mb-2 block'>Brand</Label>
                                <Select options={brandOption} selected={brand} setSelected={setBrand} isMulti={false} />
                            </div>
                            <div className='md:col-span-2'>
                                <Label className='mb-2 block'>Status</Label>
                                <Select options={STATUS_OPTIONS} selected={status} setSelected={setStatus} isMulti={false} />
                            </div>
                        </div>
                    </Section>

                    <Section title='Pricing' description='Base price for the product. Variants override these per-variant.'>
                        <div className='grid md:grid-cols-3 gap-5'>
                            <FormField control={form.control} name='mrp' render={({ field }) => (
                                <FormItem>
                                    <FormLabel>MRP <span className='text-red-500'>*</span></FormLabel>
                                    <FormControl><Input type='number' {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name='sellingPrice' render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Selling price <span className='text-red-500'>*</span></FormLabel>
                                    <FormControl><Input type='number' {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name='discountPercentage' render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Discount %</FormLabel>
                                    <FormControl><Input type='number' readOnly {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>
                    </Section>

                    <Section title='Media'>
                        <div className='border border-dashed rounded p-5 text-center'>
                            <MediaModal
                                open={mediaOpen}
                                setOpen={setMediaOpen}
                                selectedMedia={selectedMedia}
                                setSelectedMedia={setSelectedMedia}
                                isMultiple={true}
                            />
                            {selectedMedia.length > 0 && (
                                <div className='flex justify-center items-center flex-wrap mb-3 gap-2'>
                                    {selectedMedia.map((m) => (
                                        <div key={m._id} className='h-24 w-24 border rounded overflow-hidden'>
                                            <Image src={m.url} height={96} width={96} alt='' className='size-full object-cover' />
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div onClick={() => setMediaOpen(true)} className='bg-gray-50 dark:bg-card border w-[200px] mx-auto p-5 cursor-pointer'>
                                <span className='font-semibold'>{selectedMedia.length > 0 ? 'Change images' : 'Select images'}</span>
                            </div>
                        </div>
                    </Section>

                    <Section title='Description'>
                        <div className='space-y-5'>
                            <div>
                                <Label className='mb-2 block'>Short description</Label>
                                <Textarea
                                    rows={2}
                                    value={shortDescription}
                                    onChange={(e) => setShortDescription(e.target.value)}
                                    maxLength={500}
                                />
                                <p className='text-xs text-gray-500 mt-1'>{shortDescription.length}/500</p>
                            </div>
                            <div>
                                <Label className='mb-2 block'>Full description <span className='text-red-500'>*</span></Label>
                                {!getProductLoading && (
                                    <Editor onChange={editor} initialData={form.getValues('description')} />
                                )}
                                <FormMessage />
                            </div>
                        </div>
                    </Section>

                    <Section title='Options' description='Variants this product comes in — e.g. Color (Red, Blue) and Size (S, M, L). Leave empty for single-SKU products.'>
                        <OptionsEditor value={options} onChange={setOptions} />
                    </Section>

                    <Section title='Specifications' description='Static product info — Material, Country of origin, Care instructions, etc. Shown as a table on the product page.'>
                        <SpecificationsEditor value={specifications} onChange={setSpecifications} />
                    </Section>

                    <Section title='Tags & SEO'>
                        <div className='space-y-5'>
                            <div>
                                <Label className='mb-2 block flex items-center gap-2'><FiTag size={14} /> Tags</Label>
                                <TagsInput value={tags} onChange={setTags} />
                            </div>
                            <div className='grid md:grid-cols-2 gap-5'>
                                <div>
                                    <Label className='mb-2 block'>Meta title</Label>
                                    <Input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} placeholder='Defaults to product name' />
                                </div>
                                <div>
                                    <Label className='mb-2 block'>Canonical URL</Label>
                                    <Input value={seoCanonical} onChange={(e) => setSeoCanonical(e.target.value)} placeholder='Optional canonical URL' />
                                </div>
                                <div className='md:col-span-2'>
                                    <Label className='mb-2 block'>Meta description</Label>
                                    <Textarea rows={2} value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} placeholder='Short blurb for search engines' />
                                </div>
                                <div className='md:col-span-2'>
                                    <Label className='mb-2 block'>Open Graph image</Label>
                                    <div className='border border-dashed rounded p-4 text-center'>
                                        <MediaModal
                                            open={ogMediaOpen}
                                            setOpen={setOgMediaOpen}
                                            selectedMedia={seoOgImage}
                                            setSelectedMedia={setSeoOgImage}
                                            isMultiple={false}
                                        />
                                        {seoOgImage.length > 0 ? (
                                            <div className='flex flex-col items-center gap-2'>
                                                <div className='w-32 h-32 border rounded overflow-hidden'>
                                                    <Image src={seoOgImage[0].url} width={128} height={128} alt='og' className='w-full h-full object-cover' />
                                                </div>
                                                <button type='button' onClick={() => setOgMediaOpen(true)} className='text-sm text-primary hover:underline cursor-pointer'>Change image</button>
                                            </div>
                                        ) : (
                                            <div onClick={() => setOgMediaOpen(true)} className='bg-gray-50 dark:bg-card border w-[200px] mx-auto p-4 cursor-pointer'>
                                                <span className='font-semibold text-sm'>Select OG image</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Section>

                    <div className='flex justify-end'>
                        <ButtonLoading loading={loading} type='submit' text='Save changes' className='cursor-pointer' />
                    </div>
                </form>
            </Form>

            {/* Variants section — sits OUTSIDE the product form because
                add/remove variant happens against its own endpoints. */}
            <div className='mt-5'>
                <Section title='Variants' description='Sellable combinations of this product. Disabled until you define options above.'>
                    {product ? (
                        <VariantsManager
                            productId={product._id}
                            productSlug={product.slug}
                            productName={product.name}
                            productOptions={options}
                        />
                    ) : (
                        <div className='py-6 text-center text-gray-400'>Loading variants…</div>
                    )}
                </Section>
            </div>
        </div>
    )
}

export default EditProductPage
