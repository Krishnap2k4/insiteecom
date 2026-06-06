import React from 'react'
import { Quote, Star } from 'lucide-react'

const testimonials = [
    {
        name: "Aanya Sharma",
        location: "Mumbai",
        review: "Wearing Velvet Bloom feels like wrapping myself in silk. Compliments wherever I go.",
        rating: 5
    },
    {
        name: "Rohan Mehta",
        location: "Bengaluru",
        review: "Hawaaz is unreal — it lasts the entire day and the projection is luxury-tier.",
        rating: 5
    },
    {
        name: "Ishita Kapoor",
        location: "Delhi",
        review: "Finally an Indian brand that competes with French maisons. ELOIR is special.",
        rating: 5
    },
]

const Testimonial = () => {
    return (
        <section className='relative bg-wine py-20 md:py-28 overflow-hidden'>
            {/* Decorative elements */}
            <div className='absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#C9A24B] to-transparent'></div>
            <div className='absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#C9A24B]/15 rounded-full blur-3xl'></div>
            <span className='absolute pointer-events-none animate-sparkle text-[#F0D77C] top-1/4 left-[8%] text-2xl' style={{ animationDelay: '0.5s' }}>✦</span>
            <span className='absolute pointer-events-none animate-sparkle text-[#F0D77C] top-1/3 right-[10%] text-xl' style={{ animationDelay: '2.5s' }}>✦</span>

            <div className='relative max-w-6xl mx-auto px-6'>
                {/* Section Header */}
                <div className='text-center mb-14'>
                    <div className='flex items-center justify-center gap-3 text-[#C9A24B]'>
                        <span className='h-px w-16 bg-[#C9A24B]/50'></span>
                        <span className='text-xs'>❖</span>
                        <span className='h-px w-16 bg-[#C9A24B]/50'></span>
                    </div>
                    <div className='text-[#F0D77C] text-[11px] tracking-[0.5em] uppercase mt-4'>Voices of Eloir</div>
                    <h2 className='font-serif-display gold-shine text-5xl md:text-6xl mt-3'>Loved By Many</h2>
                </div>

                {/* Testimonial Grid */}
                <div className='grid md:grid-cols-3 gap-6 md:gap-8'>
                    {testimonials.map((item, index) => (
                        <div key={index} className='relative bg-gradient-to-br from-[#1a0a0d] to-[#2a1208] border border-[#C9A24B]/30 p-8 hover:border-[#F0D77C] transition card-glow'>
                            <Quote size={32} className='text-[#C9A24B]/60 absolute top-5 right-5' />

                            {/* Stars */}
                            <div className='flex gap-1 mb-4'>
                                {Array.from({ length: item.rating }).map((_, i) => (
                                    <Star key={`star${i}`} size={14} className='fill-[#F0D77C] text-[#F0D77C]' />
                                ))}
                            </div>

                            <p className='font-serif-display italic text-white/85 text-lg leading-relaxed'>
                                &ldquo;{item.review}&rdquo;
                            </p>

                            <div className='mt-6 pt-5 border-t border-[#C9A24B]/20'>
                                <div className='text-[#F0D77C] font-semibold tracking-wider'>{item.name}</div>
                                <div className='text-white/50 text-xs uppercase tracking-[0.25em] mt-1'>{item.location}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className='absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#C9A24B] to-transparent'></div>
        </section>
    )
}

export default Testimonial