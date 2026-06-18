import React from 'react'
import Link from 'next/link'
import { WEBSITE_SHOP } from '@/routes/WebsiteRoute'
import { ChevronRight, Crown, Droplets, Flame, Gem, Heart, ShieldCheck, Award } from 'lucide-react'
import NewsletterSubscribe from '@/components/Application/Website/NewsletterSubscribe'

export const metadata = {
    title: 'Our Story',
    description: 'We believe that fragrance is more than a scent — it\'s a statement of identity, confidence, and presence. Discover our story.',
}

const AboutUs = () => {
    return (
        <>
            {/* ===== HERO BANNER ===== */}
            <section className='relative min-h-[50vh] flex items-center justify-center overflow-hidden pt-[110px]'>
                <div className='absolute inset-0' style={{ backgroundImage: "url('https://images.unsplash.com/photo-1615634260167-c8cdede054de?crop=entropy&cs=srgb&fm=jpg&q=85&w=2200')", backgroundSize: 'cover', backgroundPosition: 'center' }}>
                    <div className='absolute inset-0 bg-black/65'></div>
                    <div className='absolute inset-0 bg-gradient-to-b from-black/30 via-[#1a1208]/40 to-[#070707]'></div>
                    <div className='absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(240,215,124,0.12),transparent_70%)]'></div>
                </div>

                <span className='absolute pointer-events-none animate-sparkle text-[#F0D77C] top-[30%] left-[15%] text-xl' style={{ animationDelay: '0s' }}>✦</span>
                <span className='absolute pointer-events-none animate-sparkle text-[#F0D77C] bottom-[25%] right-[20%] text-lg' style={{ animationDelay: '2s' }}>✦</span>

                <div className='absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#C9A24B] to-transparent pointer-events-none'></div>
                <div className='relative z-10 text-center px-6 max-w-4xl'>
                    <div className='flex items-center justify-center gap-3 mb-5'>
                        <span className='h-px w-12 bg-gradient-to-r from-transparent to-[#C9A24B]'></span>
                        <span className='text-[#E5C76B] tracking-[0.5em] text-[11px] uppercase'>The House of Eloir</span>
                        <span className='h-px w-12 bg-gradient-to-l from-transparent to-[#C9A24B]'></span>
                    </div>
                    <h1 className='font-serif-display gold-shine text-6xl md:text-8xl leading-[0.95] tracking-tight pb-4'>
                        Our Story
                    </h1>
                    <p className='font-serif-display italic text-white/80 text-lg md:text-xl mt-6 max-w-2xl mx-auto'>
                        Fragrance is more than a scent — it&apos;s a statement of identity, confidence, and presence.
                    </p>
                </div>
            </section>

            {/* ===== THE ORIGIN ===== */}
            <section className='relative bg-dark-gold py-20 md:py-28 overflow-hidden'>
                <div className='absolute top-10 right-10 w-64 h-64 bg-[#C9A24B]/10 rounded-full blur-3xl'></div>

                <div className='relative max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center'>
                    <div>
                        <div className='flex items-center gap-3 text-[#C9A24B] mb-4'>
                            <span className='h-px w-16 bg-[#C9A24B]/50'></span>
                            <span className='text-xs'>❖</span>
                            <span className='h-px w-16 bg-[#C9A24B]/50'></span>
                        </div>
                        <div className='text-[#F0D77C] text-[11px] tracking-[0.5em] uppercase font-semibold'>The Beginning</div>
                        <h2 className='font-serif-display gold-shine text-4xl md:text-5xl mt-3'>Born from Passion</h2>
                        <p className='text-white/70 leading-relaxed mt-6'>
                            At ELOIR, we believe that fragrance is more than a scent—it&apos;s a statement of identity, confidence, and presence.
                        </p>
                        <p className='text-white/70 leading-relaxed mt-4'>
                            Founded with a passion for fine perfumery, ELOIR creates premium fragrances inspired by some of the world&apos;s most iconic scents. Our goal is simple: to make luxury fragrance accessible without compromising on quality, performance, or sophistication.
                        </p>
                    </div>
                    <div className='relative'>
                        <div className='aspect-[4/5] overflow-hidden border-2 border-[#C9A24B]/40 shadow-2xl shadow-[#C9A24B]/10'>
                            <img
                                src='https://images.unsplash.com/photo-1541643600914-78b084683601?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200'
                                alt='ELOIR craftsmanship'
                                className='w-full h-full object-cover'
                            />
                        </div>
                        <span className='absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-[#F0D77C]'></span>
                        <span className='absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-[#F0D77C]'></span>
                        <span className='absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-[#F0D77C]'></span>
                        <span className='absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-[#F0D77C]'></span>
                    </div>
                </div>
            </section>

            {/* ===== OUR PHILOSOPHY ===== */}
            <section className='relative bg-ivory text-[#1a1208] py-20 md:py-28 overflow-hidden'>
                <div className='absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#C9A24B] via-[#F0D77C] to-[#C9A24B]'></div>
                <div className='absolute top-0 right-0 w-96 h-96 bg-[#C9A24B]/15 rounded-full blur-3xl'></div>
                <div className='absolute bottom-0 left-0 w-96 h-96 bg-[#F0D77C]/15 rounded-full blur-3xl'></div>

                <div className='relative max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center'>
                    <div className='relative order-2 md:order-1'>
                        <div className='aspect-[4/5] overflow-hidden shadow-2xl shadow-[#1a1208]/20 border-4 border-white'>
                            <img
                                src='https://images.unsplash.com/photo-1594035910387-fbd1a485b12e?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200'
                                alt='ELOIR philosophy'
                                className='w-full h-full object-cover'
                            />
                        </div>
                        <div className='absolute -bottom-5 -right-5 hidden md:flex w-24 h-24 bg-gradient-to-br from-[#C9A24B] to-[#F0D77C] rotate-12 shadow-xl items-center justify-center'>
                            <span className='font-serif-display text-3xl text-[#1a1208] -rotate-12'>❖</span>
                        </div>
                    </div>

                    <div className='order-1 md:order-2'>
                        <div className='flex items-center gap-3 text-[#8a6d28] mb-4'>
                            <span className='h-px w-16 bg-[#8a6d28]/50'></span>
                            <span className='text-xs'>❖</span>
                            <span className='h-px w-16 bg-[#8a6d28]/50'></span>
                        </div>
                        <div className='text-[#8a6d28] text-[11px] tracking-[0.5em] uppercase font-semibold'>Our Philosophy</div>
                        <h2 className='font-serif-display text-4xl md:text-5xl mt-3 gold-dark-text font-semibold'>The Art of Scent</h2>
                        <p className='text-[#3a2a0a]/80 leading-relaxed mt-6'>
                            Every bottle is carefully crafted to deliver a memorable experience, combining elegance, lasting performance, and exceptional value.
                        </p>
                        <p className='text-[#3a2a0a]/80 leading-relaxed mt-4'>
                            Whether you&apos;re looking for a signature scent, a special occasion fragrance, or the perfect gift, ELOIR offers a collection designed to leave a lasting impression.
                        </p>
                    </div>
                </div>
                <div className='absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-[#C9A24B] via-[#F0D77C] to-[#C9A24B]'></div>
            </section>

            {/* ===== FOUR PILLARS ===== */}
            <section className='relative bg-charcoal-gold py-20 md:py-24 overflow-hidden'>
                <div className='absolute inset-0 dot-pattern opacity-50'></div>
                <span className='absolute pointer-events-none animate-sparkle text-[#F0D77C] top-16 left-1/4 text-xl' style={{ animationDelay: '0.5s' }}>✦</span>
                <span className='absolute pointer-events-none animate-sparkle text-[#F0D77C] bottom-20 right-1/3 text-lg' style={{ animationDelay: '2.5s' }}>✦</span>

                <div className='relative max-w-7xl mx-auto px-6'>
                    <div className='text-center mb-12'>
                        <div className='flex items-center justify-center gap-3 text-[#C9A24B]'>
                            <span className='h-px w-16 bg-[#C9A24B]/50'></span>
                            <span className='text-xs'>❖</span>
                            <span className='h-px w-16 bg-[#C9A24B]/50'></span>
                        </div>
                        <div className='text-[#F0D77C] text-[11px] tracking-[0.5em] uppercase mt-4'>The House Promise</div>
                        <h2 className='font-serif-display gold-shine text-4xl md:text-5xl mt-3'>What We Stand For</h2>
                    </div>

                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
                        {[
                            { icon: Crown, title: 'Royal Heritage', desc: 'Inspired by timeless traditions of perfumery, our scents carry the legacy of centuries of fine art.' },
                            { icon: Droplets, title: 'Pure Extraction', desc: 'Cold-press distillation preserves the integrity of every botanical essence we work with.' },
                            { icon: Flame, title: 'Slow Aging', desc: 'Each blend matures for months, deepening its character before it ever meets glass.' },
                            { icon: Gem, title: 'Hand Bottled', desc: 'Final touches are done by hand — because true luxury is never automated.' },
                        ].map((item) => (
                            <div key={item.title} className='relative group bg-gradient-to-br from-black/60 to-[#1a1208]/60 backdrop-blur-sm border border-[#C9A24B]/25 p-8 hover:border-[#F0D77C]/70 transition card-glow text-center'>
                                <div className='w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-[#C9A24B] to-[#F0D77C] flex items-center justify-center mb-5 shadow-lg shadow-[#C9A24B]/30 group-hover:scale-110 transition'>
                                    <item.icon size={28} className='text-[#1a1208]' />
                                </div>
                                <h3 className='font-serif-display text-2xl text-white'>{item.title}</h3>
                                <p className='text-white/60 text-sm leading-relaxed mt-3'>{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== MEET THE VISION ===== */}
            <section className='relative bg-dark-gold py-20 md:py-28 overflow-hidden'>
                <div className='absolute bottom-10 left-10 w-60 h-60 bg-[#C9A24B]/10 rounded-full blur-3xl'></div>

                <div className='relative max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center'>
                    <div>
                        <div className='flex items-center gap-3 text-[#C9A24B] mb-4'>
                            <span className='h-px w-16 bg-[#C9A24B]/50'></span>
                            <span className='text-xs'>❖</span>
                            <span className='h-px w-16 bg-[#C9A24B]/50'></span>
                        </div>
                        <div className='text-[#F0D77C] text-[11px] tracking-[0.5em] uppercase font-semibold'>Our Commitment</div>
                        <h2 className='font-serif-display gold-shine text-4xl md:text-5xl mt-3'>The Signature<br />of Presence</h2>
                        <p className='text-white/70 leading-relaxed mt-6'>
                            We are committed to providing fragrances that inspire confidence and help you express your individuality through scent.
                        </p>
                        <p className='text-white/70 leading-relaxed mt-4 font-serif-display italic text-lg'>
                            Because true luxury isn&apos;t about being noticed — it&apos;s about being remembered.
                        </p>
                        <div className='grid grid-cols-3 gap-4 mt-8'>
                            {[
                                { icon: ShieldCheck, label: 'IFRA Certified' },
                                { icon: Heart, label: 'Cruelty Free' },
                                { icon: Award, label: 'Premium Quality' },
                            ].map((item) => (
                                <div key={item.label} className='text-center'>
                                    <div className='w-12 h-12 mx-auto rounded-full bg-gradient-to-br from-[#C9A24B] to-[#F0D77C] flex items-center justify-center shadow-lg shadow-[#C9A24B]/30'>
                                        <item.icon size={20} className='text-[#1a1208]' />
                                    </div>
                                    <div className='text-[10px] text-[#F0D77C]/80 uppercase tracking-wider mt-2'>{item.label}</div>
                                </div>
                            ))}
                        </div>
                        <Link href={WEBSITE_SHOP}
                              className='inline-flex items-center gap-3 mt-10 btn-gold uppercase text-[11px] tracking-[0.35em] font-semibold px-8 py-4'>
                            Explore Our Collection <ChevronRight size={14} />
                        </Link>
                    </div>
                    <div className='relative'>
                        <div className='aspect-square overflow-hidden border-2 border-[#C9A24B]/40 shadow-2xl shadow-[#C9A24B]/10'>
                            <img
                                src='https://images.unsplash.com/photo-1585386959984-a4155224a1ad?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200'
                                alt='ELOIR crafted in India'
                                className='w-full h-full object-cover'
                            />
                        </div>
                        <span className='absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-[#F0D77C]'></span>
                        <span className='absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-[#F0D77C]'></span>
                        <span className='absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-[#F0D77C]'></span>
                        <span className='absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-[#F0D77C]'></span>
                    </div>
                </div>
            </section>

            {/* ===== STATS BAR ===== */}
            <section className='relative py-16 bg-gradient-to-r from-[#0a0805] via-[#1a1208] to-[#0a0805] border-y border-[#C9A24B]/30 overflow-hidden'>
                <div className='absolute inset-0 diamond-pattern opacity-30'></div>
                <div className='relative max-w-5xl mx-auto px-6'>
                    <div className='grid grid-cols-2 md:grid-cols-4 gap-8 text-center'>
                        {[
                            { num: '50+', label: 'Unique Fragrances' },
                            { num: '10K+', label: 'Happy Customers' },
                            { num: '100%', label: 'Vegan & Cruelty-Free' },
                            { num: '8H+', label: 'Avg. Projection' },
                        ].map((stat) => (
                            <div key={stat.label}>
                                <div className='font-serif-display text-4xl md:text-5xl gold-shine'>{stat.num}</div>
                                <div className='text-white/60 text-[11px] tracking-[0.3em] uppercase mt-2'>{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== NEWSLETTER ===== */}
            <NewsletterSubscribe variant='premium' source='about-us' />
        </>
    )
}

export default AboutUs
