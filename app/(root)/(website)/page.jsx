import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import FeaturedProduct from '@/components/Application/Website/FeaturedProduct'
import Testimonial from '@/components/Application/Website/Testimonial'
import NewsletterSubscribe from '@/components/Application/Website/NewsletterSubscribe'
import { WEBSITE_SHOP } from '@/routes/WebsiteRoute'
import { ChevronRight, ShieldCheck, Heart, Leaf, Sparkles, Award, Star, Crown, Droplets, Flame, Gem } from 'lucide-react'

export const metadata = {
    title: "ELOIR — The Signature of Presence",
    description: "Discover fine fragrances crafted for the modern connoisseur. ELOIR offers luxury extrait de parfum with long-lasting scent and premium quality.",
}

const Home = () => {
    return (
        <>
            {/* ===== HERO SECTION ===== */}
            <section id="top" className='relative min-h-[100vh] flex items-center justify-center overflow-hidden pt-[110px]'>
                <div className='absolute inset-0'>
                    <img
                        src="https://images.unsplash.com/photo-1544006593-1a0b9255782d?crop=entropy&cs=srgb&fm=jpg&q=85&w=2200"
                        alt=""
                        className='w-full h-full object-cover opacity-50'
                    />
                    <div className='absolute inset-0 bg-gradient-to-b from-black/70 via-[#1a1208]/40 to-[#070707]'></div>
                    <div className='absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(240,215,124,0.18),transparent_70%)]'></div>
                    <div className='absolute top-1/4 -left-20 w-80 h-80 bg-[#C9A24B]/25 rounded-full blur-3xl animate-glow'></div>
                    <div className='absolute bottom-1/4 -right-20 w-96 h-96 bg-[#F0D77C]/15 rounded-full blur-3xl animate-glow' style={{ animationDelay: '2s' }}></div>
                </div>

                {/* Sparkles */}
                <span className='absolute pointer-events-none animate-sparkle text-[#F0D77C] top-[25%] left-[10%] text-2xl' style={{ animationDelay: '0s' }}>✦</span>
                <span className='absolute pointer-events-none animate-sparkle text-[#F0D77C] top-[35%] right-[15%] text-xl' style={{ animationDelay: '1.5s' }}>✦</span>
                <span className='absolute pointer-events-none animate-sparkle text-[#F0D77C] bottom-[30%] left-[18%] text-lg' style={{ animationDelay: '3s' }}>✦</span>
                <span className='absolute pointer-events-none animate-sparkle text-[#F0D77C] bottom-[20%] right-[20%] text-2xl' style={{ animationDelay: '0.7s' }}>✦</span>
                <span className='absolute pointer-events-none animate-sparkle text-[#F0D77C] top-[20%] right-[35%] text-base' style={{ animationDelay: '2.2s' }}>✦</span>

                <div className='relative z-10 text-center px-6 max-w-5xl mt-20'>
                    <div className='flex items-center justify-center gap-3 mb-6'>
                        <span className='h-px w-12 bg-gradient-to-r from-transparent to-[#C9A24B]'></span>
                        <span className='text-[#E5C76B] tracking-[0.5em] text-[11px] uppercase'>Eloir Maison</span>
                        <span className='h-px w-12 bg-gradient-to-l from-transparent to-[#C9A24B]'></span>
                    </div>
                    <h1 className='font-serif-display gold-shine font-medium text-[14vw] md:text-[8.5vw] leading-[0.95] tracking-tight drop-shadow-[0_4px_30px_rgba(240,215,124,0.3)]'>
                        Unveil Your Aura
                    </h1>
                    <p className='font-serif-display italic text-white/85 text-lg md:text-2xl mt-7 max-w-2xl mx-auto'>
                        Discover fine fragrances crafted for the modern connoisseur.
                    </p>
                    <div className='mt-10 flex flex-col sm:flex-row items-center justify-center gap-4'>
                        <Link href={WEBSITE_SHOP} className='btn-gold uppercase text-[12px] tracking-[0.3em] font-semibold px-10 py-4 rounded-sm'>
                            Shop the Collection
                        </Link>
                        <Link href="/about-us" className='border border-[#C9A24B]/60 text-[#E5C76B] hover:bg-[#C9A24B]/15 uppercase text-[12px] tracking-[0.3em] font-semibold px-10 py-4 rounded-sm transition backdrop-blur-sm'>
                            Our Story
                        </Link>
                    </div>
                    <div className='mt-16 flex items-center justify-center gap-2 text-[#E5C76B]/70'>
                        <span className='h-px w-6 bg-[#C9A24B]/50'></span>
                        <span className='text-[10px] tracking-[0.4em] uppercase'>Scroll</span>
                        <span className='h-px w-6 bg-[#C9A24B]/50'></span>
                    </div>
                </div>
            </section>

            {/* ===== MARKETPLACE BAR ===== */}
            <section className='relative bg-gradient-to-r from-[#0a0805] via-[#1a1208] to-[#0a0805] border-y border-[#C9A24B]/30 py-14 overflow-hidden'>
                <div className='absolute inset-0 diamond-pattern opacity-30'></div>
                <div className='relative max-w-6xl mx-auto px-6'>
                    <div className='text-center mb-8'>
                        <div className='flex items-center justify-center gap-3 text-[#C9A24B]'>
                            <span className='h-px w-16 bg-[#C9A24B]/50'></span>
                            <span className='text-xs'>❖</span>
                            <span className='h-px w-16 bg-[#C9A24B]/50'></span>
                        </div>
                        <span className='block mt-4 text-[#F0D77C] text-[11px] tracking-[0.5em] uppercase'>Also Available On</span>
                    </div>
                    <div className='flex flex-wrap items-center justify-center gap-x-10 md:gap-x-14 gap-y-6'>
                        {['Amazon', 'Nykaa', 'Myntra', 'Flipkart'].map((name, i) => (
                            <div key={name} className='flex items-center gap-10 md:gap-14'>
                                <Link href="#" className='font-serif-display text-2xl md:text-3xl text-white/70 hover:text-[#F0D77C] transition-colors italic'>
                                    {name}
                                </Link>
                                {i < 3 && <span className='text-[#C9A24B]/60 text-sm hidden md:inline'>❖</span>}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== FEATURED PRODUCTS ===== */}
            <FeaturedProduct />

            {/* ===== HER SCENT STORY (SPOTLIGHT) ===== */}
            <section className='relative bg-ivory text-[#1a1208] py-24 md:py-32 overflow-hidden'>
                <div className='absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#C9A24B] via-[#F0D77C] to-[#C9A24B]'></div>
                <div className='absolute top-0 right-0 w-96 h-96 bg-[#C9A24B]/20 rounded-full blur-3xl'></div>
                <div className='absolute bottom-0 left-0 w-96 h-96 bg-[#F0D77C]/20 rounded-full blur-3xl'></div>

                <div className='relative max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-14 items-center'>
                    <div>
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
                    </div>
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
                </div>
                <div className='absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-[#C9A24B] via-[#F0D77C] to-[#C9A24B]'></div>
            </section>

            {/* ===== SHOP THE LOOK ===== */}
            <section className='relative bg-dark-gold py-20 md:py-28 overflow-hidden'>
                <span className='absolute pointer-events-none animate-sparkle text-[#F0D77C] top-16 left-1/3 text-lg' style={{ animationDelay: '0.5s' }}>✦</span>
                <span className='absolute pointer-events-none animate-sparkle text-[#F0D77C] bottom-20 right-1/4 text-xl' style={{ animationDelay: '2s' }}>✦</span>

                <div className='relative max-w-7xl mx-auto px-6'>
                    <div className='text-center mb-10'>
                        <div className='flex items-center justify-center gap-3 text-[#C9A24B]'>
                            <span className='h-px w-16 bg-[#C9A24B]/50'></span>
                            <span className='text-xs'>❖</span>
                            <span className='h-px w-16 bg-[#C9A24B]/50'></span>
                        </div>
                        <div className='text-[#F0D77C] text-[11px] tracking-[0.5em] uppercase mt-4'>Discover the Range</div>
                        <h2 className='font-serif-display gold-shine text-4xl md:text-5xl mt-3'>Shop the Look</h2>
                    </div>

                    <div className='grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6'>
                        {[
                            { name: 'Hawaaz', img: 'https://images.unsplash.com/photo-1583442801251-5ce051ed7cb3?crop=entropy&cs=srgb&fm=jpg&q=85&w=900' },
                            { name: 'Woody Oud', img: 'https://images.unsplash.com/photo-1533603208986-24fd819e718a?crop=entropy&cs=srgb&fm=jpg&q=85&w=900' },
                            { name: 'Khamra Royal', img: 'https://images.pexels.com/photos/32817141/pexels-photo-32817141.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=900&w=900' },
                            { name: 'Blue Intense', img: 'https://images.unsplash.com/photo-1611146264101-358a3b387eee?crop=entropy&cs=srgb&fm=jpg&q=85&w=900' },
                        ].map((item) => (
                            <Link key={item.name} href={WEBSITE_SHOP}
                                  className='group relative aspect-square overflow-hidden border border-[#C9A24B]/30 hover:border-[#F0D77C] transition card-glow'>
                                {/* Hover corner ornaments */}
                                <span className='absolute top-2 left-2 w-4 h-4 border-l-2 border-t-2 border-[#F0D77C] z-10 opacity-0 group-hover:opacity-100 transition'></span>
                                <span className='absolute top-2 right-2 w-4 h-4 border-r-2 border-t-2 border-[#F0D77C] z-10 opacity-0 group-hover:opacity-100 transition'></span>
                                <span className='absolute bottom-2 left-2 w-4 h-4 border-l-2 border-b-2 border-[#F0D77C] z-10 opacity-0 group-hover:opacity-100 transition'></span>
                                <span className='absolute bottom-2 right-2 w-4 h-4 border-r-2 border-b-2 border-[#F0D77C] z-10 opacity-0 group-hover:opacity-100 transition'></span>

                                <img src={item.img} alt={item.name} className='w-full h-full object-cover transition-transform duration-700 group-hover:scale-110' />
                                <div className='absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent'></div>
                                <div className='absolute inset-x-0 bottom-0 p-4 text-center'>
                                    <div className='font-serif-display italic text-[#F0D77C] text-xl md:text-2xl'>{item.name}</div>
                                    <div className='mt-2 inline-block bg-gradient-to-r from-[#C9A24B] to-[#F0D77C] text-black text-[10px] tracking-[0.3em] uppercase px-4 py-1.5 font-bold transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all'>
                                        Shop Look
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== TESTIMONIALS ===== */}
            <Testimonial />

            {/* ===== FOUR PILLARS ===== */}
            <section className='relative bg-charcoal-gold py-20 md:py-24 overflow-hidden'>
                <div className='absolute inset-0 dot-pattern opacity-50'></div>
                <div className='relative max-w-7xl mx-auto px-6'>
                    <div className='text-center mb-12'>
                        <div className='flex items-center justify-center gap-3 text-[#C9A24B]'>
                            <span className='h-px w-16 bg-[#C9A24B]/50'></span>
                            <span className='text-xs'>❖</span>
                            <span className='h-px w-16 bg-[#C9A24B]/50'></span>
                        </div>
                        <div className='text-[#F0D77C] text-[11px] tracking-[0.5em] uppercase mt-4'>The House Promise</div>
                        <h2 className='font-serif-display gold-shine text-4xl md:text-5xl mt-3'>Four Pillars of ELOIR</h2>
                    </div>

                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
                        {[
                            { icon: Crown, title: 'Royal Heritage', desc: 'Inspired by the timeless courts of perfumery, our scents carry the legacy of fine art.', num: '1' },
                            { icon: Droplets, title: 'Pure Extraction', desc: 'Cold-press distillation preserves the integrity of every botanical essence.', num: '2' },
                            { icon: Flame, title: 'Slow Aging', desc: 'Each blend matures for months, deepening character before it ever meets glass.', num: '3' },
                            { icon: Gem, title: 'Hand Bottled', desc: 'Final touches done by hand — because true luxury is never automated.', num: '4' },
                        ].map((item) => (
                            <div key={item.title} className='relative group bg-gradient-to-br from-black/60 to-[#1a1208]/60 backdrop-blur-sm border border-[#C9A24B]/25 p-8 hover:border-[#F0D77C]/70 transition card-glow'>
                                <div className='w-16 h-16 rounded-full bg-gradient-to-br from-[#C9A24B] to-[#F0D77C] flex items-center justify-center mb-5 shadow-lg shadow-[#C9A24B]/30 group-hover:scale-110 transition'>
                                    <item.icon size={28} className='text-[#1a1208]' />
                                </div>
                                <h3 className='font-serif-display text-2xl text-white'>{item.title}</h3>
                                <p className='text-white/65 text-sm leading-relaxed mt-3'>{item.desc}</p>
                                <span className='absolute top-4 right-5 font-serif-display text-6xl text-[#C9A24B]/15 leading-none'>{item.num}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== OUR STORY ===== */}
            <section id="story" className='relative bg-dark-gold py-20 md:py-28 overflow-hidden'>
                <div className='absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#C9A24B] to-transparent'></div>
                <div className='relative max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-10 items-center'>
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
                </div>
            </section>

            {/* ===== WHY CHOOSE ELOIR ===== */}
            <section className='relative py-20 md:py-24 bg-gradient-to-br from-[#E0BF55] via-[#F4DE85] to-[#C49A2C] text-black overflow-hidden'>
                <div className='absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.35),transparent_70%)]'></div>
                <div className='absolute inset-0 diamond-pattern opacity-20'></div>
                <div className='absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#1a1208] via-[#C9A24B] to-[#1a1208]'></div>
                <div className='absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#1a1208] via-[#C9A24B] to-[#1a1208]'></div>

                <div className='relative max-w-7xl mx-auto px-6'>
                    <div className='text-center mb-12'>
                        <div className='flex items-center justify-center gap-3 text-[#8a6d28]'>
                            <span className='h-px w-16 bg-[#8a6d28]/50'></span>
                            <span className='text-xs'>❖</span>
                            <span className='h-px w-16 bg-[#8a6d28]/50'></span>
                        </div>
                        <div className='text-[#1a1208]/80 text-[11px] tracking-[0.5em] uppercase font-semibold mt-4'>Pure. Safe. Lasting.</div>
                        <h2 className='font-serif-display text-5xl md:text-6xl mt-3 text-[#1a1208] font-semibold drop-shadow-sm'>Why Choose ELOIR</h2>
                    </div>

                    <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 md:gap-4'>
                        {[
                            { icon: ShieldCheck, title: 'IFRA Certified', sub: 'Premium Standards' },
                            { icon: Heart, title: 'Made in India', sub: 'Crafted with Pride' },
                            { icon: Leaf, title: 'Vegan Friendly', sub: 'Plant Based' },
                            { icon: Sparkles, title: 'Cruelty Free', sub: 'No Animal Testing' },
                            { icon: Award, title: 'Long Lasting', sub: '8H+ Projection' },
                            { icon: Star, title: 'Quality Promise', sub: 'Premium Always' },
                        ].map((item) => (
                            <div key={item.title} className='text-center group'>
                                <div className='w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-[#1a1208] to-[#3a2810] flex items-center justify-center shadow-xl shadow-[#1a1208]/30 group-hover:scale-110 transition-transform'>
                                    <item.icon size={28} className='text-[#F0D77C]' />
                                </div>
                                <div className='mt-4 font-serif-display text-lg font-semibold text-[#1a1208]'>{item.title}</div>
                                <div className='text-[11px] text-[#1a1208]/70 tracking-wide mt-1'>{item.sub}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== NEWSLETTER ===== */}
            <NewsletterSubscribe variant='eloir' source='home' />
        </>
    )
}

export default Home