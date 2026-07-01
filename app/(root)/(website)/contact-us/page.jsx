'use client'
import { useState } from 'react'
import axios from '@/lib/apiClient'
import { showToast } from '@/lib/showToast'
import { Send, Clock, MessageCircle } from 'lucide-react'
import NewsletterSubscribe from '@/components/Application/Website/NewsletterSubscribe'
import { useSiteSettings } from '@/hooks/useSiteSettings'
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion'
import img10 from '@/public/assets/images/10img.jpeg'
import img9 from '@/public/assets/images/9img.jpeg'


const ContactUs = () => {
    const { social, sections } = useSiteSettings()
    const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' })
    const [loading, setLoading] = useState(false)
    const [done, setDone] = useState(false)

    const onChange = (k) => (e) => setForm((s) => ({ ...s, [k]: e.target.value }))

    const submit = async (e) => {
        e?.preventDefault()
        if (!form.name || !form.email || !form.message) {
            return showToast('error', 'Name, email and message are required.')
        }
        setLoading(true)
        try {
            const { data: res } = await axios.post('/api/contact/submit', form)
            if (!res?.success) throw new Error(res?.message || 'Could not send.')
            setDone(true)
            showToast('success', res.message)
        } catch (err) {
            showToast('error', err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            {/* ===== HERO BANNER ===== */}
            <section className='relative min-h-[50vh] flex items-center justify-center overflow-hidden pt-[110px]'>
                <div className='absolute inset-0' style={{ backgroundImage: `url('${img9.src}')` , backgroundSize: 'cover', backgroundPosition: 'center' }}>
                    <div className='absolute inset-0 bg-black/65'></div>
                    <div className='absolute inset-0 bg-gradient-to-b from-black/30 via-[#1a1208]/40 to-[#070707]'></div>
                    <div className='absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(240,215,124,0.12),transparent_70%)]'></div>
                </div>

                <span className='absolute pointer-events-none animate-sparkle text-[#F0D77C] top-[25%] right-[15%] text-xl' style={{ animationDelay: '0.5s' }}>✦</span>
                <span className='absolute pointer-events-none animate-sparkle text-[#F0D77C] bottom-[30%] left-[20%] text-lg' style={{ animationDelay: '2s' }}>✦</span>

                <div className='absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#C9A24B] to-transparent pointer-events-none'></div>
                <div className='relative z-10 text-center px-6 max-w-4xl'>
                    <div className='flex items-center justify-center gap-3 mb-5'>
                        <span className='h-px w-12 bg-gradient-to-r from-transparent to-[#C9A24B]'></span>
                        <span className='text-[#E5C76B] tracking-[0.5em] text-[11px] uppercase'>Get in Touch</span>
                        <span className='h-px w-12 bg-gradient-to-l from-transparent to-[#C9A24B]'></span>
                    </div>
                    <h1 className='font-serif-display gold-shine text-6xl md:text-8xl leading-[0.95] tracking-tight pb-4'>
                        Contact Us
                    </h1>
                    <p className='font-serif-display italic text-white/80 text-lg md:text-xl mt-6 max-w-2xl mx-auto'>
                        We&apos;d love to hear from you. Our team is here to help.
                    </p>
                </div>
            </section>

            {/* ===== FORM SECTION ===== */}
            <section className='relative bg-dark-gold py-20 md:py-28 overflow-hidden'>
                <div className='absolute top-10 right-10 w-60 h-60 bg-[#C9A24B]/10 rounded-full blur-3xl'></div>
                <div className='absolute bottom-10 left-10 w-60 h-60 bg-[#F0D77C]/10 rounded-full blur-3xl'></div>

                <span className='absolute pointer-events-none animate-sparkle text-[#F0D77C] top-20 left-1/4 text-lg' style={{ animationDelay: '1s' }}>✦</span>
                <span className='absolute pointer-events-none animate-sparkle text-[#F0D77C] bottom-24 right-1/4 text-xl' style={{ animationDelay: '3s' }}>✦</span>

                <div className='relative max-w-6xl mx-auto px-6 grid lg:grid-cols-[1fr_1.5fr] gap-12 items-start'>
                    {/* Left Side — Info */}
                    <div>
                        <div className='flex items-center gap-3 text-[#C9A24B] mb-4'>
                            <span className='h-px w-16 bg-[#C9A24B]/50'></span>
                            <span className='text-xs'>❖</span>
                            <span className='h-px w-16 bg-[#C9A24B]/50'></span>
                        </div>
                        <div className='text-[#F0D77C] text-[11px] tracking-[0.5em] uppercase font-semibold'>Send a Message</div>
                        <h2 className='font-serif-display gold-shine text-4xl md:text-5xl mt-3'>Let&apos;s Talk</h2>
                        <p className='text-white/65 leading-relaxed mt-6'>
                            Whether you have a question about our fragrances, need help with an order, or want to explore a wholesale partnership — our team is ready to assist.
                        </p>

                        <div className='mt-10 space-y-5'>
                            <div className='flex items-start gap-4'>
                                <div className='w-10 h-10 shrink-0 rounded-full bg-[#C9A24B]/15 border border-[#C9A24B]/30 flex items-center justify-center'>
                                    <Clock size={16} className='text-[#F0D77C]' />
                                </div>
                                <div>
                                    <div className='text-white text-sm font-medium'>Quick Response</div>
                                    <div className='text-white/50 text-xs mt-0.5'>Our team replies within 24 hours</div>
                                </div>
                            </div>
                            <div className='flex items-start gap-4'>
                                <div className='w-10 h-10 shrink-0 rounded-full bg-[#C9A24B]/15 border border-[#C9A24B]/30 flex items-center justify-center'>
                                    <MessageCircle size={16} className='text-[#F0D77C]' />
                                </div>
                                <div>
                                    <div className='text-white text-sm font-medium'>Personalized Help</div>
                                    <div className='text-white/50 text-xs mt-0.5'>Scent recommendations, gifting advice & more</div>
                                </div>
                            </div>
                        </div>

                        {/* Decorative image */}
                        <div
                            className='mt-10 aspect-[3/2] overflow-hidden border border-[#C9A24B]/30'
                            style={{ backgroundImage: `url('${img10.src}')`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.7 }}
                        />
                    </div>

                    {/* Right Side — Form */}
                    <div className='bg-gradient-to-br from-[#0e0e0e] via-[#15110a] to-[#0e0e0e] border border-[#C9A24B]/25 p-8 md:p-10'>
                        <span className='absolute top-3 left-3 w-5 h-5 border-l-2 border-t-2 border-[#C9A24B]/50 pointer-events-none'></span>
                        <span className='absolute top-3 right-3 w-5 h-5 border-r-2 border-t-2 border-[#C9A24B]/50 pointer-events-none'></span>

                        {done ? (
                            <div className='text-center py-16'>
                                <div className='inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-[#C9A24B] to-[#F0D77C] shadow-xl shadow-[#C9A24B]/30 mb-4'>
                                    <Send size={26} className='text-[#1a1208]' />
                                </div>
                                <h3 className='font-serif-display text-3xl gold-shine mt-4'>Thank You</h3>
                                <p className='text-white/60 mt-3 max-w-sm mx-auto'>
                                    We&apos;ve received your message and will get back to <strong className='text-[#F0D77C]'>{form.email}</strong> shortly.
                                </p>
                            </div>
                        ) : (
                            <form onSubmit={submit} className='space-y-5'>
                                <div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
                                    <div>
                                        <label className='block text-[#F0D77C]/80 text-[10px] uppercase tracking-[0.3em] mb-2'>
                                            Name <span className='text-[#C9A24B]'>*</span>
                                        </label>
                                        <input
                                            type='text'
                                            value={form.name}
                                            onChange={onChange('name')}
                                            required
                                            className='w-full h-12 bg-black/40 border border-[#C9A24B]/40 text-white placeholder:text-white/30 focus:border-[#F0D77C] focus:outline-none px-4 text-sm transition-colors'
                                            placeholder='Your name'
                                        />
                                    </div>
                                    <div>
                                        <label className='block text-[#F0D77C]/80 text-[10px] uppercase tracking-[0.3em] mb-2'>
                                            Email <span className='text-[#C9A24B]'>*</span>
                                        </label>
                                        <input
                                            type='email'
                                            value={form.email}
                                            onChange={onChange('email')}
                                            required
                                            className='w-full h-12 bg-black/40 border border-[#C9A24B]/40 text-white placeholder:text-white/30 focus:border-[#F0D77C] focus:outline-none px-4 text-sm transition-colors'
                                            placeholder='your@email.com'
                                        />
                                    </div>
                                    <div>
                                        <label className='block text-[#F0D77C]/80 text-[10px] uppercase tracking-[0.3em] mb-2'>
                                            Phone
                                        </label>
                                        <input
                                            type='text'
                                            value={form.phone}
                                            onChange={onChange('phone')}
                                            className='w-full h-12 bg-black/40 border border-[#C9A24B]/40 text-white placeholder:text-white/30 focus:border-[#F0D77C] focus:outline-none px-4 text-sm transition-colors'
                                            placeholder='+91-XXX-XXX-XXXX'
                                        />
                                    </div>
                                    <div>
                                        <label className='block text-[#F0D77C]/80 text-[10px] uppercase tracking-[0.3em] mb-2'>
                                            Subject
                                        </label>
                                        <input
                                            type='text'
                                            value={form.subject}
                                            onChange={onChange('subject')}
                                            className='w-full h-12 bg-black/40 border border-[#C9A24B]/40 text-white placeholder:text-white/30 focus:border-[#F0D77C] focus:outline-none px-4 text-sm transition-colors'
                                            placeholder='General enquiry'
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className='block text-[#F0D77C]/80 text-[10px] uppercase tracking-[0.3em] mb-2'>
                                        Message <span className='text-[#C9A24B]'>*</span>
                                    </label>
                                    <textarea
                                        rows={6}
                                        value={form.message}
                                        onChange={onChange('message')}
                                        required
                                        className='w-full bg-black/40 border border-[#C9A24B]/40 text-white placeholder:text-white/30 focus:border-[#F0D77C] focus:outline-none px-4 py-3 text-sm transition-colors resize-none'
                                        placeholder='Tell us how we can help...'
                                    />
                                </div>
                                <button
                                    type='submit'
                                    disabled={loading}
                                    className='btn-gold uppercase text-[11px] tracking-[0.3em] font-bold px-10 py-4 w-full md:w-auto disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer'
                                >
                                    {loading ? (
                                        'Sending...'
                                    ) : (
                                        <>
                                            <Send size={14} /> Send Message
                                        </>
                                    )}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </section>

            {/* ===== FAQ SECTION ===== */}
            <section className='relative bg-charcoal-gold py-20 md:py-24 overflow-hidden'>
                <div className='absolute inset-0 dot-pattern opacity-40'></div>
                <div className='relative max-w-4xl mx-auto px-6'>
                    <div className='text-center mb-12'>
                        <div className='flex items-center justify-center gap-3 text-[#C9A24B]'>
                            <span className='h-px w-16 bg-[#C9A24B]/50'></span>
                            <span className='text-xs'>❖</span>
                            <span className='h-px w-16 bg-[#C9A24B]/50'></span>
                        </div>
                        <div className='text-[#F0D77C] text-[11px] tracking-[0.5em] uppercase mt-4'>Common Questions</div>
                        <h2 className='font-serif-display gold-shine text-4xl md:text-5xl mt-3'>Quick Answers</h2>
                    </div>

                    <Accordion type='single' collapsible className='space-y-3'>
                        {[
                            {
                                q: 'Are ELOIR fragrances original perfumes?',
                                a: 'ELOIR fragrances are inspired by some of the world\'s most loved scents. We create our own interpretations while offering a premium fragrance experience at an accessible price.',
                            },
                            {
                                q: 'How long do ELOIR perfumes last?',
                                a: 'Longevity may vary depending on skin type, weather, and usage. Most ELOIR fragrances are designed to provide long-lasting performance throughout the day.',
                            },
                            {
                                q: 'What sizes are available?',
                                a: null,
                                list: ['50ML Perfumes', '8ML Tester / Gift Cards'],
                            },
                            {
                                q: 'What is a Tester / Gift Card?',
                                a: 'Our 8ML Tester / Gift Card allows customers to explore fragrances before purchasing a full-size bottle. It is also a great gifting option.',
                            },
                            {
                                q: 'Do you ship across India?',
                                a: 'Yes, we offer Pan-India shipping.',
                            },
                            {
                                q: 'How long does delivery take?',
                                a: 'Most orders are delivered within 2–7 business days depending on the delivery location.',
                            },
                            {
                                q: 'How can I track my order?',
                                a: 'Once your order is shipped, tracking details will be shared via email, SMS, or WhatsApp.',
                            },
                            {
                                q: 'Can I cancel my order?',
                                a: 'Yes, orders can be cancelled before they are shipped. Once an order has been dispatched, cancellation requests cannot be accepted.',
                            },
                            {
                                q: 'Do you accept returns?',
                                a: 'Due to the nature of fragrance products, opened or used perfumes cannot be returned. Please refer to our Refund & Return Policy at /refund-policy for complete details.',
                            },
                            {
                                q: 'What if I receive a damaged or incorrect product?',
                                a: 'Please contact us within 48 hours of delivery with photos/videos of the package and product. We will review the issue and provide a suitable resolution.',
                            },
                            {
                                q: 'Are your perfumes suitable for daily wear?',
                                a: 'Yes. Our collection includes fragrances suitable for everyday use, office wear, special occasions, and evening outings.',
                            },
                            {
                                q: 'What payment methods do you accept?',
                                a: 'We accept secure online payments through UPI, debit cards, credit cards, net banking, and other payment methods available at checkout.',
                            },
                            {
                                q: 'Are ELOIR fragrances suitable for gifting?',
                                a: 'Absolutely. ELOIR fragrances and Tester / Gift Cards make excellent gifts for fragrance lovers.',
                            },
                            {
                                q: 'How can I contact ELOIR?',
                                a: null,
                                contacts: [
                                    social?.email && { label: 'Email',     value: social.email },
                                    sections?.followUs?.instagramHandle && { label: 'Instagram', value: sections.followUs.instagramHandle },
                                    social?.whatsapp && { label: 'WhatsApp', value: social.phone || `+${social.whatsapp}` },
                                ].filter(Boolean),
                            },
                            {
                                q: 'Why choose ELOIR?',
                                a: null,
                                bullets: ['✨ Premium quality fragrances', '✨ Inspired by iconic scents', '✨ Long-lasting performance', '✨ Affordable luxury', '✨ Pan-India delivery'],
                                tagline: 'ELOIR — The Signature of Presence.',
                            },
                        ].map((item, i) => (
                            <AccordionItem
                                key={i}
                                value={`faq-${i}`}
                                className='bg-gradient-to-br from-black/50 to-[#1a1208]/50 border border-[#C9A24B]/20 px-6 data-[state=open]:border-[#C9A24B]/60 transition-colors'
                            >
                                <AccordionTrigger className='font-serif-display text-base md:text-lg text-white hover:no-underline hover:text-[#F0D77C] data-[state=open]:text-[#F0D77C] py-5 text-left gap-4 [&>svg]:text-[#C9A24B] [&>svg]:shrink-0'>
                                    {item.q}
                                </AccordionTrigger>
                                <AccordionContent className='pb-5'>
                                    {item.a && (
                                        <p className='text-white/60 text-sm leading-relaxed'>{item.a}</p>
                                    )}
                                    {item.list && (
                                        <ul className='space-y-1.5'>
                                            {item.list.map((li) => (
                                                <li key={li} className='text-white/60 text-sm flex items-center gap-2'>
                                                    <span className='w-1.5 h-1.5 rounded-full bg-[#C9A24B] shrink-0'></span>
                                                    {li}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                    {item.contacts && (
                                        <ul className='space-y-2'>
                                            {item.contacts.map((c) => (
                                                <li key={c.label} className='text-white/60 text-sm flex items-start gap-2'>
                                                    <span className='text-[#C9A24B] font-medium shrink-0'>{c.label}:</span>
                                                    <span>{c.value}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                    {item.bullets && (
                                        <>
                                            <ul className='space-y-1'>
                                                {item.bullets.map((b) => (
                                                    <li key={b} className='text-white/60 text-sm'>{b}</li>
                                                ))}
                                            </ul>
                                            {item.tagline && (
                                                <p className='mt-3 text-[#F0D77C]/80 text-sm font-serif-display italic'>{item.tagline}</p>
                                            )}
                                        </>
                                    )}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </div>
            </section>

            {/* ===== NEWSLETTER ===== */}
            <NewsletterSubscribe variant='premium' source='contact-us' />
        </>
    )
}

export default ContactUs
