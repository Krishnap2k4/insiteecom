import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import ProductSection from '@/components/Application/Website/ProductSection'
import FollowUs from '@/components/Application/Website/FollowUs'
import Testimonial from '@/components/Application/Website/Testimonial'
import NewsletterSubscribe from '@/components/Application/Website/NewsletterSubscribe'
import ShopTheLook from '@/components/Application/Website/ShopTheLook'
import AnimateIn from '@/components/Application/Website/AnimateIn'
import HeroCarousel from '@/components/Application/Website/HeroCarousel'
import { WEBSITE_SHOP } from '@/routes/WebsiteRoute'
import { getSiteSettings } from '@/lib/settings'
import { connectDB } from '@/lib/databaseConnection'
import ProductModel from '@/models/Product.model'
import { ChevronRight, Heart, Leaf, Sparkles, Award, Star, Crown, Droplets, Flame, Gem } from 'lucide-react'

/**
 * Fetch the products referenced by hero slides in a single batch query
 * and merge them onto each slide as `slide.product`. Server-side so the
 * carousel renders with real product info on first paint — no client
 * round-trip, no flash of the bare image.
 */
const enrichHeroSlides = async (slides) => {
    if (!Array.isArray(slides) || slides.length === 0) return []

    const ids = [...new Set(
        slides.map((s) => s?.productId).filter((id) => id && typeof id === 'string')
    )]
    if (ids.length === 0) return slides.map((s) => ({ ...s, product: null }))
    // (mobileImageUrl is already on each slide — it just flows through)

    try {
        await connectDB()
        const products = await ProductModel
            .find({ _id: { $in: ids }, deletedAt: null, status: { $in: ['published', null, undefined] } })
            .populate('media', 'secure_url alt')
            .select('name slug publicId media sellingPrice mrp discountPercentage card')
            .lean()

        // Build a fully-serialised plain-object map. Mongoose's .lean() only
        // strips the *top-level* doc decorators — populated subdocs still
        // carry ObjectId-typed `_id`s, which React refuses to ship from a
        // Server Component to a Client Component ("Only plain objects can
        // be passed…"). So we explicitly project each field to a primitive.
        const byId = Object.fromEntries(
            products.map((p) => [String(p._id), {
                _id:                String(p._id),
                name:               String(p.name || ''),
                slug:               String(p.slug || ''),
                publicId:           p.publicId ? String(p.publicId) : '',
                media:              (p.media || []).map((m) => ({
                    secure_url: m?.secure_url ? String(m.secure_url) : '',
                    alt:        m?.alt        ? String(m.alt)        : '',
                })),
                sellingPrice:       Number(p.sellingPrice) || 0,
                mrp:                Number(p.mrp) || 0,
                discountPercentage: Number(p.discountPercentage) || 0,
                card: {
                    badge:         p.card?.badge         || '',
                    subtitle:      p.card?.subtitle      || '',
                    audienceLabel: p.card?.audienceLabel || '',
                    sizeLabel:     p.card?.sizeLabel     || '',
                    highlights:    Array.isArray(p.card?.highlights) ? p.card.highlights.map(String) : [],
                    bundleOffer:   p.card?.bundleOffer   || '',
                },
            }])
        )
        return slides.map((s) => ({ ...s, product: s?.productId ? (byId[s.productId] || null) : null }))
    } catch {
        // Defensive — never let a failed product lookup take down the home page.
        return slides.map((s) => ({ ...s, product: null }))
    }
}

// Home page intentionally has no `title` — it inherits the root layout's
// dynamic "{siteName} — {tagline}" default so the brand always matches settings.
export const metadata = {
    description: 'Discover fine fragrances crafted for the modern connoisseur — luxury extrait de parfum with long-lasting scent and premium quality.',
}

// Revalidation cadence is inherited from the storefront layout (60s ISR
// + on-demand revalidatePath on admin save). No page-level override.

const Home = async () => {
    // Defensive: if settings fetch fails (transient DB issue), fall back to
    // an empty hero rather than crashing the whole page. The rest of the
    // home page (sections, footer, etc.) keeps rendering normally.
    let hero = null
    let slides = []
    try {
        const settings = await getSiteSettings()
        hero = settings?.hero || null
        slides = await enrichHeroSlides(hero?.slides || [])
    } catch {
        // swallow — empty hero already assigned
    }
    return (
        <>
            {/* ===== HERO SECTION — admin-configured carousel ===== */}
            <HeroCarousel slides={slides} autoplayMs={hero?.autoplayMs ?? 5000} />

            {/* ===== MARKETPLACE BAR ===== */}
            {/* <section className='relative bg-gradient-to-r from-[#0a0805] via-[#1a1208] to-[#0a0805] border-y border-[#C9A24B]/30 py-14 overflow-hidden'>
                <div className='absolute inset-0 diamond-pattern opacity-30'></div>
                <div className='relative max-w-6xl mx-auto px-6'>
                    <AnimateIn direction="fade" className="text-center mb-8">
                        <div className='flex items-center justify-center gap-3 text-[#C9A24B]'>
                            <span className='h-px w-16 bg-[#C9A24B]/50'></span>
                            <span className='text-xs'>❖</span>
                            <span className='h-px w-16 bg-[#C9A24B]/50'></span>
                        </div>
                        <span className='block mt-4 text-[#F0D77C] text-[11px] tracking-[0.5em] uppercase'>Also Available On</span>
                    </AnimateIn>
                    <div className='flex flex-wrap items-center justify-center gap-x-10 md:gap-x-14 gap-y-6'>
                        {['Amazon', 'Nykaa', 'Myntra', 'Flipkart'].map((name, i) => (
                            <AnimateIn key={name} direction="up" delay={i * 110}>
                                <div className='flex items-center gap-10 md:gap-14'>
                                    <Link href="#" className='font-serif-display text-2xl md:text-3xl text-white/70 hover:text-[#F0D77C] transition-colors italic cursor-pointer'>
                                        {name}
                                    </Link>
                                    {i < 3 && <span className='text-[#C9A24B]/60 text-sm hidden md:inline'>❖</span>}
                                </div>
                            </AnimateIn>
                        ))}
                    </div>
                </div>
            </section> */}

            {/* ===== NEW ARRIVALS ===== */}
            <ProductSection
                id="new-arrivals"
                title="New Arrivals"
                eyebrow="Fresh From The Atelier"
                apiUrl="/api/shop?limit=6&sort=default_sorting"
                viewAllHref={`${WEBSITE_SHOP}?sort=default_sorting`}
                viewAllLabel="View All New Arrivals"
                theme="dark"
                showCategoryTabs
            />

            {/* ===== HER SCENT STORY (SPOTLIGHT) ===== */}
            <section className='relative bg-ivory text-[#1a1208] py-24 md:py-32 overflow-hidden'>
                <div className='absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#C9A24B] via-[#F0D77C] to-[#C9A24B]'></div>
                <div className='absolute top-0 right-0 w-96 h-96 bg-[#C9A24B]/20 rounded-full blur-3xl'></div>
                <div className='absolute bottom-0 left-0 w-96 h-96 bg-[#F0D77C]/20 rounded-full blur-3xl'></div>

                <div className='relative max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-14 items-center'>
                    <AnimateIn direction="left">
                        <div className='flex items-center justify-center md:justify-start gap-3 text-[#8a6d28]'>
                            <span className='h-px w-16 bg-[#8a6d28]/50'></span>
                            <span className='text-xs'>❖</span>
                            <span className='h-px w-16 bg-[#8a6d28]/50'></span>
                        </div>
                        <div className='text-[#8a6d28] text-[11px] tracking-[0.5em] uppercase mt-4 font-semibold'>Feminine Elegance</div>
                        <h2 className='font-serif-display text-5xl md:text-6xl mt-3 gold-dark-text font-semibold'>Her Scent Story</h2>
                        <p className='text-[#3a2a0a]/80 leading-relaxed mt-6 max-w-lg text-base md:text-lg'>
                            Explore our curated collection of women&apos;s fragrances, designed to capture the essence of grace and allure. Each scent tells a unique story, unfolding layer by layer.
                        </p>
                        <p className='text-[#3a2a0a]/80 leading-relaxed mt-4 max-w-lg'>
                            From vibrant florals to deep, sensual musks, find the signature scent that resonates with your spirit.
                        </p>
                        <Link href={`${WEBSITE_SHOP}?category=women`}
                              className='inline-flex items-center gap-3 mt-8 bg-[#1a1208] text-[#F0D77C] hover:bg-[#2a1d0a] uppercase text-[11px] tracking-[0.35em] font-semibold px-8 py-4 transition shadow-lg shadow-[#1a1208]/30'>
                            Explore Women&apos;s Collection <ChevronRight size={14} />
                        </Link>
                    </AnimateIn>
                    <AnimateIn direction="right">
                        <div className='relative'>
                            <div className='aspect-[5/4] overflow-hidden shadow-2xl shadow-[#1a1208]/30 border-4 border-white'>
                                <img
                                    src="https://images.unsplash.com/photo-1622618991746-fe6004db3a47?crop=entropy&cs=srgb&fm=jpg&q=85&w=1400"
                                    alt="Her Scent"
                                    className='w-full h-full object-cover'
                                />
                            </div>
                            <div className='absolute -bottom-6 -left-6 hidden md:block w-32 h-32 border-4 border-[#C9A24B] bg-[#F0D77C]/30 backdrop-blur-sm'></div>
                            <div className='absolute -top-6 -right-6 hidden md:flex w-24 h-24 bg-gradient-to-br from-[#C9A24B] to-[#F0D77C] rotate-12 shadow-xl items-center justify-center'>
                                <span className='font-serif-display text-3xl text-[#1a1208] -rotate-12'>❖</span>
                            </div>
                        </div>
                    </AnimateIn>
                </div>
                <div className='absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-[#C9A24B] via-[#F0D77C] to-[#C9A24B]'></div>
            </section>

            {/* ===== SHOP THE LOOK ===== */}
            <ShopTheLook />

            {/* ===== BESTSELLERS ===== */}
            <ProductSection
                id="bestsellers"
                title="Bestsellers"
                eyebrow="Most Loved"
                apiUrl="/api/shop?limit=6&sort=bestseller"
                viewAllHref={`${WEBSITE_SHOP}?sort=bestseller`}
                viewAllLabel="Shop Bestsellers"
                theme="light"
                showCategoryTabs
            />

            {/* ===== WHY CHOOSE ELOIR ===== */}
            <section className='relative py-20 md:py-24 bg-gradient-to-br from-[#E0BF55] via-[#F4DE85] to-[#C49A2C] text-black overflow-hidden'>
                <div className='absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.35),transparent_70%)]'></div>
                <div className='absolute inset-0 diamond-pattern opacity-20'></div>
                <div className='absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#1a1208] via-[#C9A24B] to-[#1a1208]'></div>
                <div className='absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#1a1208] via-[#C9A24B] to-[#1a1208]'></div>

                <div className='relative max-w-7xl mx-auto px-6'>
                    <AnimateIn direction="fade" className="text-center mb-12">
                        <div className='flex items-center justify-center gap-3 text-[#8a6d28]'>
                            <span className='h-px w-16 bg-[#8a6d28]/50'></span>
                            <span className='text-xs'>❖</span>
                            <span className='h-px w-16 bg-[#8a6d28]/50'></span>
                        </div>
                        <div className='text-[#1a1208]/80 text-[11px] tracking-[0.5em] uppercase font-semibold mt-4'>Pure. Safe. Lasting.</div>
                        <h2 className='font-serif-display text-5xl md:text-6xl mt-3 text-[#1a1208] font-semibold drop-shadow-sm'>Why Choose ELOIR</h2>
                    </AnimateIn>

                    <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 md:gap-4'>
                        {[
                            { icon: Heart,       title: 'Made in India',  sub: 'Crafted with Pride' },
                            { icon: Leaf,        title: 'Vegan Friendly', sub: 'Plant Based' },
                            { icon: Sparkles,    title: 'Cruelty Free',   sub: 'No Animal Testing' },
                            { icon: Award,       title: 'Long Lasting',   sub: '8H+ Projection' },
                            { icon: Star,        title: 'Quality Promise',sub: 'Premium Always' },
                        ].map((item, index) => (
                            <AnimateIn key={item.title} direction="up" delay={index * 90}>
                                <div className='text-center group'>
                                    <div className='w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-[#1a1208] to-[#3a2810] flex items-center justify-center shadow-xl shadow-[#1a1208]/30 group-hover:scale-110 transition-transform'>
                                        <item.icon size={28} className='text-[#F0D77C]' />
                                    </div>
                                    <div className='mt-4 font-serif-display text-lg font-semibold text-[#1a1208]'>{item.title}</div>
                                    <div className='text-[11px] text-[#1a1208]/70 tracking-wide mt-1'>{item.sub}</div>
                                </div>
                            </AnimateIn>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== FOUR PILLARS ===== */}
            <section className='relative bg-charcoal-gold py-20 md:py-24 overflow-hidden'>
                <div className='absolute inset-0 dot-pattern opacity-50'></div>
                <div className='relative max-w-7xl mx-auto px-6'>
                    <AnimateIn direction="fade" className="text-center mb-12">
                        <div className='flex items-center justify-center gap-3 text-[#C9A24B]'>
                            <span className='h-px w-16 bg-[#C9A24B]/50'></span>
                            <span className='text-xs'>❖</span>
                            <span className='h-px w-16 bg-[#C9A24B]/50'></span>
                        </div>
                        <div className='text-[#F0D77C] text-[11px] tracking-[0.5em] uppercase mt-4'>The House Promise</div>
                        <h2 className='font-serif-display gold-shine text-4xl md:text-5xl mt-3'>Four Pillars of ELOIR</h2>
                    </AnimateIn>

                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
                        {[
                            { icon: Crown,    title: 'Royal Heritage',  desc: 'Inspired by the timeless courts of perfumery, our scents carry the legacy of fine art.',  num: '1' },
                            { icon: Droplets, title: 'Pure Extraction', desc: 'Cold-press distillation preserves the integrity of every botanical essence.',              num: '2' },
                            { icon: Flame,    title: 'Slow Aging',      desc: 'Each blend matures for months, deepening character before it ever meets glass.',           num: '3' },
                            { icon: Gem,      title: 'Hand Bottled',    desc: 'Final touches done by hand — because true luxury is never automated.',                     num: '4' },
                        ].map((item, index) => (
                            <AnimateIn key={item.title} direction="up" delay={index * 130}>
                                <div className='relative group bg-gradient-to-br from-black/60 to-[#1a1208]/60 backdrop-blur-sm border border-[#C9A24B]/25 p-8 hover:border-[#F0D77C]/70 transition card-glow h-full'>
                                    <div className='w-16 h-16 rounded-full bg-gradient-to-br from-[#C9A24B] to-[#F0D77C] flex items-center justify-center mb-5 shadow-lg shadow-[#C9A24B]/30 group-hover:scale-110 transition'>
                                        <item.icon size={28} className='text-[#1a1208]' />
                                    </div>
                                    <h3 className='font-serif-display text-2xl text-white'>{item.title}</h3>
                                    <p className='text-white/65 text-sm leading-relaxed mt-3'>{item.desc}</p>
                                    <span className='absolute top-4 right-5 font-serif-display text-6xl text-[#C9A24B]/15 leading-none'>{item.num}</span>
                                </div>
                            </AnimateIn>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== OUR STORY ===== */}
            <section id="story" className='relative bg-dark-gold py-20 md:py-28 overflow-hidden'>
                <div className='absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#C9A24B] to-transparent'></div>
                <div className='relative max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-10 items-center'>
                    <AnimateIn direction="left">
                        <div className='relative aspect-[5/4] overflow-hidden border-2 border-[#C9A24B]/40 shadow-2xl shadow-[#C9A24B]/10'>
                            <img
                                src="https://images.pexels.com/photos/10924522/pexels-photo-10924522.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=900&w=1400"
                                alt="Craft"
                                className='w-full h-full object-cover'
                            />
                            <div className='absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent'></div>
                            <span className='absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-[#F0D77C]'></span>
                            <span className='absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-[#F0D77C]'></span>
                            <span className='absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-[#F0D77C]'></span>
                            <span className='absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-[#F0D77C]'></span>
                        </div>
                    </AnimateIn>
                    <AnimateIn direction="right" delay={100}>
                        <div>
                            <div className='flex items-center justify-center md:justify-start gap-3 text-[#C9A24B]'>
                                <span className='h-px w-16 bg-[#C9A24B]/50'></span>
                                <span className='text-xs'>❖</span>
                                <span className='h-px w-16 bg-[#C9A24B]/50'></span>
                            </div>
                            <div className='text-[#F0D77C] text-[11px] tracking-[0.5em] uppercase mt-4'>The Art of Creation</div>
                            <h2 className='font-serif-display gold-shine text-5xl md:text-6xl leading-[1.05] mt-3'>
                                Crafted With<br />Uncompromising<br />Care
                            </h2>
                            <p className='text-white/75 leading-relaxed mt-6'>
                                At ELOIR, we believe that a fragrance is more than a scent — it is the signature of your presence. Each formulation is meticulously crafted using the finest imported oils, blending traditional artisanal methods with modern sophistication.
                            </p>
                            <p className='text-white/75 leading-relaxed mt-4'>
                                Our commitment to excellence ensures that every drop is a testament to purity, longevity, and an unforgettable olfactory journey.
                            </p>
                            <Link href="/about-us"
                                  className='inline-flex items-center gap-3 mt-8 btn-dark-gold uppercase text-[11px] tracking-[0.35em] font-semibold px-8 py-4 transition'>
                                Discover Our Story <ChevronRight size={14} />
                            </Link>
                        </div>
                    </AnimateIn>
                </div>
            </section>

            {/* ===== TESTIMONIALS ===== */}
            <Testimonial />

            {/* ===== FOLLOW US ===== */}
            <FollowUs />

            {/* ===== NEWSLETTER ===== */}
            <AnimateIn direction="up" threshold={0.08}>
                <NewsletterSubscribe variant='premium' source='home' />
            </AnimateIn>
        </>
    )
}

export default Home
