'use client'
import { useState } from 'react'
import axios from '@/lib/apiClient'
import { showToast } from '@/lib/showToast'
import { Mail, Phone, MapPin, Send, Clock, MessageCircle } from 'lucide-react'
import NewsletterSubscribe from '@/components/Application/Website/NewsletterSubscribe'

const ContactUs = () => {
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
                <div className='absolute inset-0' style={{ backgroundImage: "url('https://images.unsplash.com/photo-1583442801251-5ce051ed7cb3?crop=entropy&cs=srgb&fm=jpg&q=85&w=2200')", backgroundSize: 'cover', backgroundPosition: 'center' }}>
                    <div className='absolute inset-0 bg-black/65'></div>
                    <div className='absolute inset-0 bg-gradient-to-b from-black/30 via-[#1a1208]/40 to-[#070707]'></div>
                    <div className='absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(240,215,124,0.12),transparent_70%)]'></div>
                </div>

                <span className='absolute pointer-events-none animate-sparkle text-[#F0D77C] top-[25%] right-[15%] text-xl' style={{ animationDelay: '0.5s' }}>✦</span>
                <span className='absolute pointer-events-none animate-sparkle text-[#F0D77C] bottom-[30%] left-[20%] text-lg' style={{ animationDelay: '2s' }}>✦</span>

                <div className='relative z-10 text-center px-6 max-w-4xl'>
                    <div className='flex items-center justify-center gap-3 mb-5'>
                        <span className='h-px w-12 bg-gradient-to-r from-transparent to-[#C9A24B]'></span>
                        <span className='text-[#E5C76B] tracking-[0.5em] text-[11px] uppercase'>Get in Touch</span>
                        <span className='h-px w-12 bg-gradient-to-l from-transparent to-[#C9A24B]'></span>
                    </div>
                    <h1 className='font-serif-display gold-shine text-6xl md:text-8xl leading-[0.95] tracking-tight'>
                        Contact Us
                    </h1>
                    <p className='font-serif-display italic text-white/80 text-lg md:text-xl mt-6 max-w-2xl mx-auto'>
                        We&apos;d love to hear from you. Our team is here to help.
                    </p>
                </div>
            </section>

            {/* ===== CONTACT INFO CARDS ===== */}
            <section className='relative bg-gradient-to-r from-[#0a0805] via-[#1a1208] to-[#0a0805] border-y border-[#C9A24B]/30 py-16 overflow-hidden'>
                <div className='absolute inset-0 diamond-pattern opacity-30'></div>
                <div className='relative max-w-5xl mx-auto px-6'>
                    <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                        {[
                            {
                                icon: Mail,
                                title: 'Email Us',
                                primary: 'support@eloir.in',
                                secondary: 'Mon-Sat, 10AM-7PM IST',
                                href: 'mailto:support@eloir.in',
                            },
                            {
                                icon: Phone,
                                title: 'Call Us',
                                primary: '+91-856-987-4589',
                                secondary: 'Mon-Sat, 10AM-7PM IST',
                                href: 'tel:+91-8569874589',
                            },
                            {
                                icon: MapPin,
                                title: 'Visit Us',
                                primary: 'ELOIR Maison',
                                secondary: 'Lucknow, India 256320',
                                href: null,
                            },
                        ].map((item) => (
                            <div key={item.title} className='group relative bg-gradient-to-br from-black/60 to-[#1a1208]/60 backdrop-blur-sm border border-[#C9A24B]/25 p-7 hover:border-[#F0D77C]/70 transition card-glow text-center'>
                                <div className='w-14 h-14 mx-auto rounded-full bg-gradient-to-br from-[#C9A24B] to-[#F0D77C] flex items-center justify-center mb-4 shadow-lg shadow-[#C9A24B]/30 group-hover:scale-110 transition'>
                                    <item.icon size={24} className='text-[#1a1208]' />
                                </div>
                                <h3 className='font-serif-display text-xl text-white'>{item.title}</h3>
                                {item.href ? (
                                    <a href={item.href} className='block text-[#F0D77C] text-sm mt-2 hover:text-[#E5C76B] transition-colors'>
                                        {item.primary}
                                    </a>
                                ) : (
                                    <p className='text-[#F0D77C] text-sm mt-2'>{item.primary}</p>
                                )}
                                <p className='text-white/50 text-xs mt-1'>{item.secondary}</p>
                            </div>
                        ))}
                    </div>
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
                            className='hidden lg:block mt-10 aspect-[3/2] overflow-hidden border border-[#C9A24B]/30'
                            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1622618991746-fe6004db3a47?crop=entropy&cs=srgb&fm=jpg&q=85&w=900')", backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.7 }}
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

                    <div className='space-y-4'>
                        {[
                            {
                                q: 'How long does shipping take?',
                                a: 'We dispatch all orders within 24-48 hours. Standard delivery takes 3-7 business days across India. Express shipping is available at checkout.',
                            },
                            {
                                q: 'What is your return policy?',
                                a: 'We offer a 7-day hassle-free return policy for unused, sealed products. If you receive a damaged or incorrect item, we will replace it immediately.',
                            },
                            {
                                q: 'Are ELOIR fragrances safe for sensitive skin?',
                                a: 'All ELOIR fragrances are IFRA certified, dermatologically tested, vegan, and cruelty-free. We use premium-grade ingredients that are gentle on all skin types.',
                            },
                            {
                                q: 'Do you offer wholesale or bulk pricing?',
                                a: 'Yes! We work with retailers, gifting companies, and corporates. Please reach out via the form above or email us at support@eloir.in for wholesale inquiries.',
                            },
                        ].map((item, i) => (
                            <div key={i} className='bg-gradient-to-br from-black/50 to-[#1a1208]/50 border border-[#C9A24B]/20 p-6 hover:border-[#C9A24B]/40 transition'>
                                <h3 className='font-serif-display text-lg text-white'>{item.q}</h3>
                                <p className='text-white/60 text-sm leading-relaxed mt-2'>{item.a}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== NEWSLETTER ===== */}
            <NewsletterSubscribe variant='eloir' source='contact-us' />
        </>
    )
}

export default ContactUs
