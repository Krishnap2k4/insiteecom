'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import BreadCrumb from '@/components/Application/Admin/BreadCrumb'
import MediaUrlPicker from '@/components/Application/Admin/MediaUrlPicker'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import Select from '@/components/Application/Select'
import useFetch from '@/hooks/useFetch'
import axios from '@/lib/apiClient'
import { showToast } from '@/lib/showToast'
import { SITE_SETTINGS_DEFAULTS } from '@/lib/siteSettingsDefaults'
import { refreshSiteSettings } from '@/hooks/useSiteSettings'
import { ADMIN_CMS, ADMIN_DASHBOARD } from '@/routes/AdminPanelRoute'
import MediaModal from '@/components/Application/Admin/MediaModal'
import {
    Palette, Megaphone, Image as ImageIcon, LayoutGrid,
    Share2, Loader2, Plus, Trash2, Star, ImagePlus, Quote,
    ChevronDown, ChevronRight, ArrowUp, ArrowDown, X, Pencil,
} from 'lucide-react'

const breadcrumbData = [
    { href: ADMIN_DASHBOARD, label: 'Home' },
    { href: ADMIN_CMS,       label: 'Site Content' },
]

const TABS = [
    { key: 'branding', label: 'Branding', icon: Palette    },
    { key: 'marquee',  label: 'Marquee',  icon: Megaphone  },
    { key: 'hero',     label: 'Hero',     icon: ImageIcon  },
    { key: 'sections', label: 'Sections', icon: LayoutGrid },
    { key: 'social',   label: 'Social',   icon: Share2     },
]

const SiteContentPage = () => {
    const [loading,   setLoading]   = useState(true)
    const [savingKey, setSavingKey] = useState(null)
    const [tab,  setTab]  = useState('branding')
    const [data, setData] = useState(SITE_SETTINGS_DEFAULTS)

    useEffect(() => {
        (async () => {
            try {
                const { data: res } = await axios.get('/api/admin/settings')
                if (res?.success) setData((d) => ({ ...d, ...res.data }))
            } catch {
                showToast('error', 'Could not load site content.')
            } finally {
                setLoading(false)
            }
        })()
    }, [])

    const updateSection = (key, patch) =>
        setData((d) => ({ ...d, [key]: { ...d[key], ...patch } }))

    const updateSubSection = (parent, child, patch) =>
        setData((d) => ({
            ...d,
            [parent]: { ...d[parent], [child]: { ...d[parent][child], ...patch } },
        }))

    const save = async (sectionKey) => {
        // Per-section payload normalisation mirrors the server preprocessing
        // so what the admin sees is what gets persisted.
        let payload = { [sectionKey]: data[sectionKey] }

        if (sectionKey === 'marquee') {
            payload = {
                marquee: {
                    enabled: !!data.marquee.enabled,
                    items: (data.marquee.items || []).map((s) => (s || '').trim()).filter(Boolean),
                },
            }
        } else if (sectionKey === 'sections') {
            payload = {
                sections: {
                    testimonials: {
                        ...data.sections.testimonials,
                        items: (data.sections.testimonials.items || [])
                            .filter((it) => it?.name?.trim() && it?.review?.trim())
                            .map((it) => ({
                                name:     (it.name || '').trim(),
                                location: (it.location || '').trim(),
                                review:   (it.review || '').trim(),
                                rating:   Number(it.rating) || 5,
                            })),
                    },
                    followUs: {
                        ...data.sections.followUs,
                        images: (data.sections.followUs.images || []).filter((it) => it?.url?.trim()),
                    },
                },
            }
        } else if (sectionKey === 'hero') {
            payload = {
                hero: {
                    autoplayMs: Number(data.hero.autoplayMs) || 0,
                    slides: (data.hero.slides || [])
                        .filter((s) => s && ((s.imageUrl || '').trim() || (s.heading || '').trim()))
                        .map((s) => ({
                            imageUrl:       (s.imageUrl       || '').trim(),
                            mobileImageUrl: (s.mobileImageUrl || '').trim(),
                            eyebrow:        (s.eyebrow        || '').trim(),
                            heading:        (s.heading        || '').trim(),
                            subline:        (s.subline        || '').trim(),
                            ctaLabel:       (s.ctaLabel       || '').trim(),  // empty stays empty → no button
                            ctaHref:        (s.ctaHref        || '').trim() || '/shop',
                            productId:      (s.productId      || '').trim(),
                        })),
                },
            }
        }

        setSavingKey(sectionKey)
        try {
            const { data: res } = await axios.put('/api/admin/settings', payload)
            if (!res?.success) throw new Error(res?.message || 'Save failed.')
            showToast('success', res.message)
            refreshSiteSettings()
        } catch (err) {
            showToast('error', err.message)
        } finally {
            setSavingKey(null)
        }
    }

    if (loading) {
        return (
            <div>
                <BreadCrumb breadcrumbData={breadcrumbData} />
                <div className='flex items-center gap-2 text-muted-foreground py-10'>
                    <Loader2 size={18} className='animate-spin' /> Loading site content…
                </div>
            </div>
        )
    }

    return (
        <div>
            <BreadCrumb breadcrumbData={breadcrumbData} />

            <div className='mb-4'>
                <h1 className='text-xl font-semibold'>Site Content</h1>
                <p className='text-sm text-muted-foreground mt-1'>
                    Edit what customers see on the storefront — logo, marquee, hero, section toggles and social links.
                </p>
            </div>

            {/* Tab nav */}
            <div className='flex flex-wrap gap-1 mb-6 border-b'>
                {TABS.map(({ key, label, icon: Icon }) => (
                    <button
                        key={key}
                        type='button'
                        onClick={() => setTab(key)}
                        className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition cursor-pointer -mb-px ${
                            tab === key
                                ? 'border-primary text-primary'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <Icon size={15} /> {label}
                    </button>
                ))}
            </div>

            <div className='max-w-3xl'>
                {tab === 'branding' && (
                    <BrandingTab
                        value={data.branding}
                        onChange={(p) => updateSection('branding', p)}
                        saving={savingKey === 'branding'}
                        onSave={() => save('branding')}
                    />
                )}
                {tab === 'marquee' && (
                    <MarqueeTab
                        value={data.marquee}
                        onChange={(p) => updateSection('marquee', p)}
                        saving={savingKey === 'marquee'}
                        onSave={() => save('marquee')}
                    />
                )}
                {tab === 'hero' && (
                    <HeroTab
                        value={data.hero}
                        onChange={(p) => updateSection('hero', p)}
                        saving={savingKey === 'hero'}
                        onSave={() => save('hero')}
                    />
                )}
                {tab === 'sections' && (
                    <SectionsTab
                        value={data.sections}
                        onChange={(child, patch) => updateSubSection('sections', child, patch)}
                        onArrayChange={(child, key, arr) => updateSubSection('sections', child, { [key]: arr })}
                        saving={savingKey === 'sections'}
                        onSave={() => save('sections')}
                    />
                )}
                {tab === 'social' && (
                    <SocialTab
                        value={data.social}
                        onChange={(p) => updateSection('social', p)}
                        saving={savingKey === 'social'}
                        onSave={() => save('social')}
                    />
                )}
            </div>
        </div>
    )
}

/* ───────────────────────────── Tabs ───────────────────────────── */

const SaveButton = ({ saving, onClick }) => (
    <Button onClick={onClick} disabled={saving} className='cursor-pointer'>
        {saving && <Loader2 size={14} className='animate-spin mr-2' />}
        {saving ? 'Saving…' : 'Save changes'}
    </Button>
)

const BrandingTab = ({ value, onChange, saving, onSave }) => (
    <Card>
        <CardHeader>
            <CardTitle className='flex items-center gap-2 text-base'><Palette size={18} /> Logo & Branding</CardTitle>
            <CardDescription>Site name, logos and favicon. Logos are shared between the storefront and the admin panel.</CardDescription>
        </CardHeader>
        <CardContent className='space-y-6'>
            <Field label='Site name' hint='Used in page titles (e.g. “Admin – {site name}”) and the admin footer.'>
                <Input value={value.siteName} onChange={(e) => onChange({ siteName: e.target.value })} placeholder='My Store' />
            </Field>
            <Field label='Navbar logo' hint='Shown in the storefront navbar and the admin sidebar. Recommended: transparent PNG, ~200×60px.'>
                <MediaUrlPicker value={value.logoUrl} onChange={(url) => onChange({ logoUrl: url })} previewClass='w-40 h-14' />
            </Field>
            <Field label='Footer logo' hint='Optional — falls back to the navbar logo if empty.'>
                <MediaUrlPicker value={value.logoFooterUrl} onChange={(url) => onChange({ logoFooterUrl: url })} previewClass='w-40 h-14' />
            </Field>
            <Field label='Favicon' hint='Square image shown in the browser tab. Recommended: 512×512 PNG or .ico. Falls back to the built-in favicon if empty.'>
                <MediaUrlPicker value={value.faviconUrl} onChange={(url) => onChange({ faviconUrl: url })} previewClass='w-14 h-14' />
            </Field>
            <Field label='Tagline' hint='Shown under the wordmark and in the page-title fallback.'>
                <Input value={value.tagline} onChange={(e) => onChange({ tagline: e.target.value })} placeholder='Your tagline' />
            </Field>
            <Field label='About text (footer)' hint='Short paragraph describing the brand. Shown in the footer next to the logo.'>
                <Textarea rows={3} value={value.description} onChange={(e) => onChange({ description: e.target.value })} placeholder='Premium products crafted with care…' />
            </Field>
            <SaveButton saving={saving} onClick={onSave} />
        </CardContent>
    </Card>
)

const MarqueeTab = ({ value, onChange, saving, onSave }) => {
    const setItem    = (i, val) => onChange({ items: value.items.map((it, idx) => idx === i ? val : it) })
    const addItem    = () => onChange({ items: [...value.items, ''] })
    const removeItem = (i) => onChange({ items: value.items.filter((_, idx) => idx !== i) })

    return (
        <Card>
            <CardHeader>
                <CardTitle className='flex items-center gap-2 text-base'><Megaphone size={18} /> Top Marquee</CardTitle>
                <CardDescription>The scrolling announcement bar above the navbar. Add one phrase per row (max 20).</CardDescription>
            </CardHeader>
            <CardContent className='space-y-5'>
                <div className='flex items-center gap-3'>
                    <Switch checked={value.enabled} onCheckedChange={(v) => onChange({ enabled: v })} />
                    <Label className='cursor-pointer' onClick={() => onChange({ enabled: !value.enabled })}>
                        Show marquee on the storefront
                    </Label>
                </div>

                <div className='space-y-2'>
                    <Label>Items</Label>
                    {value.items.length === 0 && (
                        <p className='text-xs text-muted-foreground italic'>No items yet. Add at least one to show the marquee.</p>
                    )}
                    {value.items.map((it, i) => (
                        <div key={i} className='flex gap-2'>
                            <Input value={it} onChange={(e) => setItem(i, e.target.value)} placeholder='✦ Free Shipping on Orders Above ₹999' />
                            <Button type='button' variant='ghost' size='icon' onClick={() => removeItem(i)} className='shrink-0 cursor-pointer text-red-500 hover:text-red-600'>
                                <Trash2 size={14} />
                            </Button>
                        </div>
                    ))}
                    {value.items.length < 20 && (
                        <Button type='button' variant='outline' size='sm' onClick={addItem} className='cursor-pointer'>
                            <Plus size={14} className='mr-1' /> Add item
                        </Button>
                    )}
                </div>

                <SaveButton saving={saving} onClick={onSave} />
            </CardContent>
        </Card>
    )
}

const HeroTab = ({ value, onChange, saving, onSave }) => {
    const slides = value.slides || []
    const [openSlide, setOpenSlide] = useState(slides.length === 0 ? null : 0)

    // Lightweight product list for the slide product picker.
    // Reuses the existing admin product API (same as Shop the Look form).
    const { data: productsData } = useFetch('/api/product?deleteType=SD&size=10000')
    const productOptions = useMemo(() => {
        const opts = productsData?.success
            ? productsData.data.map((p) => ({ label: p.name, value: p._id }))
            : []
        return [{ label: '— No product (use CTA link below) —', value: '' }, ...opts]
    }, [productsData])

    const setSlide = (i, patch) =>
        onChange({ slides: slides.map((s, idx) => idx === i ? { ...s, ...patch } : s) })

    const addSlide = () => {
        onChange({ slides: [...slides, {
            imageUrl: '', mobileImageUrl: '', eyebrow: '', heading: '', subline: '',
            ctaLabel: '', ctaHref: '/shop', productId: '',
        }] })
        setOpenSlide(slides.length)
    }

    const removeSlide = (i) => {
        onChange({ slides: slides.filter((_, idx) => idx !== i) })
        setOpenSlide((cur) => cur === i ? null : (cur != null && cur > i ? cur - 1 : cur))
    }

    const moveSlide = (i, dir) => {
        const next = [...slides]
        const j = i + dir
        if (j < 0 || j >= next.length) return
        ;[next[i], next[j]] = [next[j], next[i]]
        onChange({ slides: next })
        setOpenSlide((cur) => cur === i ? j : (cur === j ? i : cur))
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className='flex items-center gap-2 text-base'><ImageIcon size={18} /> Hero Section</CardTitle>
                <CardDescription>Carousel of slides shown at the top of the home page. Each slide pairs a background image with its own copy and an optional featured product. Empty list hides the hero entirely.</CardDescription>
            </CardHeader>
            <CardContent className='space-y-5'>
                <div className='grid sm:grid-cols-[200px_1fr] gap-5 items-start'>
                    <Field label='Autoplay interval (ms)' hint='Set to 0 to disable autoplay.'>
                        <Input
                            type='number'
                            min={0}
                            max={60000}
                            step={500}
                            value={value.autoplayMs}
                            onChange={(e) => onChange({ autoplayMs: e.target.value })}
                        />
                    </Field>
                </div>

                <div className='space-y-2'>
                    <div className='flex items-center justify-between'>
                        <Label>Slides <span className='text-xs text-muted-foreground'>({slides.length}/12)</span></Label>
                        {slides.length < 12 && (
                            <Button type='button' variant='outline' size='sm' onClick={addSlide} className='cursor-pointer'>
                                <Plus size={14} className='mr-1' /> Add slide
                            </Button>
                        )}
                    </div>
                    {slides.length === 0 && (
                        <p className='text-xs text-muted-foreground italic py-3'>No slides yet — the hero won't render on the home page.</p>
                    )}

                    <div className='border rounded divide-y'>
                        {slides.map((s, i) => {
                            const isOpen = openSlide === i
                            const incomplete = !s.imageUrl?.trim() && !s.heading?.trim()
                            const linkedProduct = productOptions.find((o) => o.value === s.productId)
                            return (
                                <div key={i} className={isOpen ? 'bg-muted/30' : ''}>
                                    {/* Collapsed row */}
                                    <div className='flex items-center gap-2 px-3 py-2'>
                                        <button
                                            type='button'
                                            onClick={() => setOpenSlide(isOpen ? null : i)}
                                            className='flex-1 flex items-center gap-3 text-left cursor-pointer'
                                        >
                                            {isOpen
                                                ? <ChevronDown  size={14} className='shrink-0 text-muted-foreground' />
                                                : <ChevronRight size={14} className='shrink-0 text-muted-foreground' />}
                                            <span className='text-xs text-muted-foreground shrink-0 w-6'>#{i + 1}</span>
                                            {s.imageUrl ? (
                                                <img src={s.imageUrl} alt='' className='w-14 h-9 object-cover border rounded shrink-0' />
                                            ) : (
                                                <div className='w-14 h-9 border rounded shrink-0 flex items-center justify-center text-[10px] text-muted-foreground'>No img</div>
                                            )}
                                            <span className='font-medium text-sm truncate'>
                                                {s.heading?.trim() || <span className='text-muted-foreground italic'>Untitled slide</span>}
                                            </span>
                                            {linkedProduct?.value && (
                                                <span className='hidden md:inline text-[10px] text-muted-foreground truncate'>· {linkedProduct.label}</span>
                                            )}
                                            {incomplete && (
                                                <span className='shrink-0 text-[10px] text-amber-600 font-medium uppercase tracking-wide'>Incomplete</span>
                                            )}
                                        </button>
                                        <div className='flex items-center gap-0.5 shrink-0'>
                                            <Button type='button' variant='ghost' size='icon' disabled={i === 0}              onClick={() => moveSlide(i, -1)} className='h-7 w-7 cursor-pointer'><ArrowUp   size={13} /></Button>
                                            <Button type='button' variant='ghost' size='icon' disabled={i === slides.length-1} onClick={() => moveSlide(i,  1)} className='h-7 w-7 cursor-pointer'><ArrowDown size={13} /></Button>
                                            <Button type='button' variant='ghost' size='icon' onClick={() => removeSlide(i)} className='h-7 w-7 cursor-pointer text-red-500 hover:text-red-600'><Trash2 size={13} /></Button>
                                        </div>
                                    </div>

                                    {/* Expanded editor */}
                                    {isOpen && (
                                        <div className='px-4 pb-4 space-y-4'>
                                            <div className='grid md:grid-cols-2 gap-5'>
                                                <Field label='Background image (desktop)' hint='Wide / landscape image — recommended 2200×900px.'>
                                                    <MediaUrlPicker
                                                        value={s.imageUrl}
                                                        onChange={(url) => setSlide(i, { imageUrl: url })}
                                                        previewClass='w-full h-32'
                                                    />
                                                </Field>
                                                <Field label='Background image (mobile)' hint='Optional taller / portrait crop for phones (< 768px). Falls back to the desktop image if empty.'>
                                                    <MediaUrlPicker
                                                        value={s.mobileImageUrl}
                                                        onChange={(url) => setSlide(i, { mobileImageUrl: url })}
                                                        previewClass='w-full h-32'
                                                    />
                                                </Field>
                                            </div>
                                            <div className='grid sm:grid-cols-2 gap-3'>
                                                <Field label='Eyebrow'>
                                                    <Input value={s.eyebrow} onChange={(e) => setSlide(i, { eyebrow: e.target.value })} placeholder='Small text above the heading' />
                                                </Field>
                                                <Field label='CTA label' hint='Leave empty to hide the button.'>
                                                    <Input value={s.ctaLabel} onChange={(e) => setSlide(i, { ctaLabel: e.target.value })} placeholder='Shop Now (leave empty to hide)' />
                                                </Field>
                                            </div>
                                            <Field label='Heading'>
                                                <Input value={s.heading} onChange={(e) => setSlide(i, { heading: e.target.value })} placeholder='Big headline' />
                                            </Field>
                                            <Field label='Subline'>
                                                <Textarea rows={2} value={s.subline} onChange={(e) => setSlide(i, { subline: e.target.value })} placeholder='One-line descriptor' />
                                            </Field>
                                            <Field label='Featured product' hint='Pick a product to attach to this slide. When set, the slide shows a product card and the CTA links to the product page.'>
                                                <Select
                                                    options={productOptions}
                                                    selected={s.productId || ''}
                                                    setSelected={(value) => setSlide(i, { productId: value })}
                                                    isMulti={false}
                                                    placeholder='Search or select a product'
                                                />
                                            </Field>
                                            <Field label='CTA link (fallback)' hint='Where the CTA button leads if no product is attached. Use a path like /shop.'>
                                                <Input value={s.ctaHref} onChange={(e) => setSlide(i, { ctaHref: e.target.value })} placeholder='/shop' />
                                            </Field>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>

                <SaveButton saving={saving} onClick={onSave} />
            </CardContent>
        </Card>
    )
}

const SectionsTab = ({ value, onChange, onArrayChange, saving, onSave }) => {
    const t = value.testimonials
    const f = value.followUs

    /* ── Testimonial helpers + accordion state ── */
    const items = t.items || []
    const [openTestimonial, setOpenTestimonial] = useState(items.length === 0 ? null : 0)

    const setItem    = (i, patch) => onArrayChange('testimonials', 'items', items.map((it, idx) => idx === i ? { ...it, ...patch } : it))
    const addItem    = () => {
        onArrayChange('testimonials', 'items', [...items, { name: '', location: '', review: '', rating: 5 }])
        setOpenTestimonial(items.length) // open the new row
    }
    const removeItem = (i) => {
        onArrayChange('testimonials', 'items', items.filter((_, idx) => idx !== i))
        setOpenTestimonial((cur) => cur === i ? null : (cur != null && cur > i ? cur - 1 : cur))
    }
    const moveItem = (i, dir) => {
        const next = [...items]
        const j = i + dir
        if (j < 0 || j >= next.length) return
        ;[next[i], next[j]] = [next[j], next[i]]
        onArrayChange('testimonials', 'items', next)
        setOpenTestimonial((cur) => cur === i ? j : (cur === j ? i : cur))
    }

    /* ── Follow Us / image helpers + selected-thumb state ── */
    const [editingImage, setEditingImage] = useState(null)

    const setImage    = (i, patch) => onArrayChange('followUs', 'images', f.images.map((it, idx) => idx === i ? { ...it, ...patch } : it))
    const removeImage = (i) => {
        onArrayChange('followUs', 'images', f.images.filter((_, idx) => idx !== i))
        setEditingImage((cur) => cur === i ? null : (cur != null && cur > i ? cur - 1 : cur))
    }
    const appendImages = (urls) => {
        const remaining = Math.max(0, 24 - f.images.length)
        const toAdd = urls.slice(0, remaining).map((url) => ({ url, alt: '', href: '' }))
        if (toAdd.length === 0) return
        onArrayChange('followUs', 'images', [...f.images, ...toAdd])
    }

    const editing = editingImage != null ? f.images[editingImage] : null

    return (
        <div className='space-y-6'>

            {/* ───────────────── Loved By Many ───────────────── */}
            <Card>
                <CardHeader>
                    <CardTitle className='text-base flex items-center gap-2'><Quote size={16} /> Loved By Many — Testimonials</CardTitle>
                    <CardDescription>Toggle visibility, customise the heading, and curate the testimonial cards shown on the home page.</CardDescription>
                </CardHeader>
                <CardContent className='space-y-5'>
                    <div className='flex items-center gap-3'>
                        <Switch checked={t.enabled} onCheckedChange={(v) => onChange('testimonials', { enabled: v })} />
                        <Label className='cursor-pointer' onClick={() => onChange('testimonials', { enabled: !t.enabled })}>
                            Show on home page
                        </Label>
                    </div>
                    <div className='grid sm:grid-cols-2 gap-5'>
                        <Field label='Eyebrow'><Input value={t.eyebrow} onChange={(e) => onChange('testimonials', { eyebrow: e.target.value })} /></Field>
                        <Field label='Heading'><Input value={t.heading} onChange={(e) => onChange('testimonials', { heading: e.target.value })} /></Field>
                    </div>

                    {/* Items — accordion. One row expanded at a time. */}
                    <div className='space-y-2 pt-2'>
                        <div className='flex items-center justify-between'>
                            <Label>Testimonials <span className='text-xs text-muted-foreground'>({items.length}/50)</span></Label>
                            {items.length < 50 && (
                                <Button type='button' variant='outline' size='sm' onClick={addItem} className='cursor-pointer'>
                                    <Plus size={14} className='mr-1' /> Add testimonial
                                </Button>
                            )}
                        </div>
                        {items.length === 0 && (
                            <p className='text-xs text-muted-foreground italic py-3'>No testimonials set — the storefront will fall back to its built-in seed list.</p>
                        )}
                        <div className='border rounded divide-y'>
                            {items.map((it, i) => {
                                const isOpen = openTestimonial === i
                                const incomplete = !it.name?.trim() || !it.review?.trim()
                                return (
                                    <div key={i} className={isOpen ? 'bg-muted/30' : ''}>
                                        {/* Row header — clickable to toggle */}
                                        <div className='flex items-center gap-2 px-3 py-2'>
                                            <button
                                                type='button'
                                                onClick={() => setOpenTestimonial(isOpen ? null : i)}
                                                className='flex-1 flex items-center gap-3 text-left cursor-pointer'
                                            >
                                                {isOpen ? <ChevronDown size={14} className='shrink-0 text-muted-foreground' /> : <ChevronRight size={14} className='shrink-0 text-muted-foreground' />}
                                                <span className='text-xs text-muted-foreground shrink-0 w-6'>#{i + 1}</span>
                                                <span className='font-medium text-sm truncate'>
                                                    {it.name?.trim() || <span className='text-muted-foreground italic'>Untitled</span>}
                                                </span>
                                                <span className='hidden sm:flex items-center gap-0.5 shrink-0'>
                                                    {[1,2,3,4,5].map((n) => (
                                                        <Star key={n} size={11} className={n <= (Number(it.rating) || 5) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'} />
                                                    ))}
                                                </span>
                                                <span className='text-xs text-muted-foreground truncate hidden md:inline'>
                                                    {it.review?.trim() ? `“${it.review.trim()}”` : ''}
                                                </span>
                                                {incomplete && (
                                                    <span className='shrink-0 text-[10px] text-amber-600 font-medium uppercase tracking-wide'>Incomplete</span>
                                                )}
                                            </button>
                                            {/* Inline action buttons — don't toggle accordion */}
                                            <div className='flex items-center gap-0.5 shrink-0'>
                                                <Button type='button' variant='ghost' size='icon' disabled={i === 0}             onClick={() => moveItem(i, -1)} className='h-7 w-7 cursor-pointer'><ArrowUp   size={13} /></Button>
                                                <Button type='button' variant='ghost' size='icon' disabled={i === items.length-1} onClick={() => moveItem(i,  1)} className='h-7 w-7 cursor-pointer'><ArrowDown size={13} /></Button>
                                                <Button type='button' variant='ghost' size='icon' onClick={() => removeItem(i)} className='h-7 w-7 cursor-pointer text-red-500 hover:text-red-600'><Trash2 size={13} /></Button>
                                            </div>
                                        </div>

                                        {/* Expanded edit form */}
                                        {isOpen && (
                                            <div className='px-4 pb-4 space-y-3'>
                                                <div className='grid sm:grid-cols-2 gap-3'>
                                                    <Input value={it.name}     onChange={(e) => setItem(i, { name: e.target.value })}     placeholder='Customer name *' />
                                                    <Input value={it.location} onChange={(e) => setItem(i, { location: e.target.value })} placeholder='Location (e.g. Mumbai)' />
                                                </div>
                                                <Textarea
                                                    rows={3}
                                                    value={it.review}
                                                    onChange={(e) => setItem(i, { review: e.target.value })}
                                                    placeholder='Review text *'
                                                />
                                                <div className='flex items-center gap-3'>
                                                    <Label className='text-xs text-muted-foreground'>Rating:</Label>
                                                    <StarPicker value={Number(it.rating) || 5} onChange={(v) => setItem(i, { rating: v })} />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* ───────────────── Follow Our World ───────────────── */}
            <Card>
                <CardHeader>
                    <CardTitle className='text-base flex items-center gap-2'><ImageIcon size={16} /> Follow Our World — Instagram gallery</CardTitle>
                    <CardDescription>Toggle visibility, customise text, hashtag overlay, and curate the image grid.</CardDescription>
                </CardHeader>
                <CardContent className='space-y-5'>
                    <div className='flex items-center gap-3'>
                        <Switch checked={f.enabled} onCheckedChange={(v) => onChange('followUs', { enabled: v })} />
                        <Label className='cursor-pointer' onClick={() => onChange('followUs', { enabled: !f.enabled })}>
                            Show on home page
                        </Label>
                    </div>
                    <div className='grid sm:grid-cols-2 gap-5'>
                        <Field label='Eyebrow'><Input value={f.eyebrow} onChange={(e) => onChange('followUs', { eyebrow: e.target.value })} /></Field>
                        <Field label='Heading'><Input value={f.heading} onChange={(e) => onChange('followUs', { heading: e.target.value })} /></Field>
                    </div>
                    <div className='grid sm:grid-cols-2 gap-5'>
                        <Field label='Instagram handle' hint='Shown in plain text under the heading.'>
                            <Input value={f.instagramHandle} onChange={(e) => onChange('followUs', { instagramHandle: e.target.value })} placeholder='@yourbrand' />
                        </Field>
                        <Field label='Hashtag overlay' hint='Shown on image hover. Use a short tag like #yourbrand.'>
                            <Input value={f.hashtag} onChange={(e) => onChange('followUs', { hashtag: e.target.value })} placeholder='#yourbrand' />
                        </Field>
                    </div>

                    {/* Gallery — thumbnail grid with inline edit panel */}
                    <div className='space-y-3 pt-2'>
                        <div className='flex items-center justify-between'>
                            <Label>Gallery images <span className='text-xs text-muted-foreground'>({f.images.length}/24)</span></Label>
                            {f.images.length < 24 && (
                                <MultiImagePicker max={24 - f.images.length} onAdd={appendImages} />
                            )}
                        </div>

                        {f.images.length === 0 && (
                            <p className='text-xs text-muted-foreground italic py-3'>No images set — the storefront will fall back to its built-in placeholder grid.</p>
                        )}

                        {f.images.length > 0 && (
                            <div className='grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2'>
                                {f.images.map((img, i) => {
                                    const isSelected = editingImage === i
                                    return (
                                        <div key={i} className='relative group'>
                                            <button
                                                type='button'
                                                onClick={() => setEditingImage(isSelected ? null : i)}
                                                className={`block w-full aspect-square border-2 rounded overflow-hidden cursor-pointer transition ${isSelected ? 'border-primary ring-2 ring-primary/30' : 'border-transparent hover:border-muted-foreground/40'}`}
                                                title={img.alt || img.url}
                                            >
                                                <img src={img.url} alt='' className='w-full h-full object-cover bg-muted' />
                                            </button>
                                            <button
                                                type='button'
                                                onClick={(e) => { e.stopPropagation(); removeImage(i) }}
                                                className='absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer hover:bg-red-600'
                                                aria-label='Remove'
                                            >
                                                <X size={11} />
                                            </button>
                                        </div>
                                    )
                                })}
                            </div>
                        )}

                        {/* Inline edit panel */}
                        {editing && (
                            <div className='border rounded p-4 bg-muted/30 space-y-3'>
                                <div className='flex items-start gap-4'>
                                    <img src={editing.url} alt='' className='w-24 h-24 object-cover border rounded shrink-0 bg-muted' />
                                    <div className='flex-1 space-y-2'>
                                        <div className='flex items-center justify-between'>
                                            <Label className='text-xs flex items-center gap-1.5'>
                                                <Pencil size={12} /> Editing image #{editingImage + 1}
                                            </Label>
                                            <Button type='button' variant='ghost' size='sm' onClick={() => setEditingImage(null)} className='h-7 cursor-pointer'>
                                                <X size={13} className='mr-1' /> Done
                                            </Button>
                                        </div>
                                        <Input value={editing.url}  onChange={(e) => setImage(editingImage, { url: e.target.value })}  placeholder='Image URL' />
                                        <Input value={editing.alt}  onChange={(e) => setImage(editingImage, { alt: e.target.value })}  placeholder='Alt text (for accessibility)' />
                                        <Input value={editing.href} onChange={(e) => setImage(editingImage, { href: e.target.value })} placeholder='Optional click-through link' />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <SaveButton saving={saving} onClick={onSave} />
        </div>
    )
}

/** Clickable 1-5 star rating. */
const StarPicker = ({ value, onChange }) => (
    <div className='flex items-center gap-0.5'>
        {[1, 2, 3, 4, 5].map((n) => (
            <button
                key={n}
                type='button'
                onClick={() => onChange(n)}
                className='cursor-pointer hover:scale-110 transition'
                aria-label={`Set rating to ${n}`}
            >
                <Star
                    size={18}
                    className={n <= value ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/40'}
                />
            </button>
        ))}
    </div>
)

/**
 * "Add from library" button — opens MediaModal in multi-select mode,
 * and when it closes with selections, pushes their URLs into the parent
 * array via `onAdd`. Used by the Follow Us gallery.
 */
const MultiImagePicker = ({ onAdd, max }) => {
    const [open, setOpen] = useState(false)
    const [selected, setSelected] = useState([])
    const wasOpen = useRef(false)

    useEffect(() => {
        if (wasOpen.current && !open && selected.length > 0) {
            onAdd(selected.map((m) => m.url).filter(Boolean))
            setSelected([])
        }
        wasOpen.current = open
    }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <>
            <Button type='button' variant='outline' size='sm' onClick={() => { setSelected([]); setOpen(true) }} className='cursor-pointer'>
                <ImagePlus size={14} className='mr-1' /> Add from library
                {max < 24 && <span className='ml-2 text-[10px] text-muted-foreground'>(up to {max})</span>}
            </Button>
            <MediaModal
                open={open}
                setOpen={setOpen}
                selectedMedia={selected}
                setSelectedMedia={setSelected}
                isMultiple={true}
            />
        </>
    )
}

const SocialTab = ({ value, onChange, saving, onSave }) => (
    <Card>
        <CardHeader>
            <CardTitle className='flex items-center gap-2 text-base'><Share2 size={18} /> Social & Contact</CardTitle>
            <CardDescription>Used in the footer, Follow Us section, and the contact page. Empty fields are simply hidden.</CardDescription>
        </CardHeader>
        <CardContent className='space-y-5'>
            <div className='grid sm:grid-cols-2 gap-5'>
                <Field label='Instagram URL'><Input value={value.instagram} onChange={(e) => onChange({ instagram: e.target.value })} placeholder='https://instagram.com/…' /></Field>
                <Field label='Facebook URL'><Input value={value.facebook}  onChange={(e) => onChange({ facebook:  e.target.value })} placeholder='https://facebook.com/…' /></Field>
                <Field label='Twitter / X URL'><Input value={value.twitter} onChange={(e) => onChange({ twitter:   e.target.value })} placeholder='https://x.com/…' /></Field>
                <Field label='WhatsApp number (digits only)' hint='Include country code without “+”, e.g. 918007900071'>
                    <Input value={value.whatsapp} onChange={(e) => onChange({ whatsapp: e.target.value })} placeholder='918007900071' />
                </Field>
                <Field label='Contact email'><Input type='email' value={value.email} onChange={(e) => onChange({ email: e.target.value })} placeholder='hello@brand.com' /></Field>
                <Field label='Display phone'><Input value={value.phone} onChange={(e) => onChange({ phone: e.target.value })} placeholder='+91 80079 00071' /></Field>
            </div>
            <SaveButton saving={saving} onClick={onSave} />
        </CardContent>
    </Card>
)

/* ───────────────────────────── Bits ───────────────────────────── */

const Field = ({ label, hint, children }) => (
    <div className='space-y-1.5'>
        <Label>{label}</Label>
        {children}
        {hint && <p className='text-xs text-muted-foreground'>{hint}</p>}
    </div>
)

export default SiteContentPage
