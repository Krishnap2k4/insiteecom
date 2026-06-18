'use client'
import { useState } from 'react'
import axios from '@/lib/apiClient'
import { showToast } from '@/lib/showToast'
import ButtonLoading from '@/components/Application/ButtonLoading'
import { Mail } from 'lucide-react'

/**
 * Reusable newsletter subscribe block.
 *
 * Props:
 *   variant      — 'inline' (default), 'stacked', or 'premium' (luxury dark gold)
 *   source       — attribution string sent to the API
 *   heading      — optional headline above the form
 *   description  — optional supporting copy
 */
const NewsletterSubscribe = ({
    variant = 'inline',
    source = 'footer',
    heading = 'Join our newsletter',
    description = 'Get new arrivals, restocks, and the occasional sale — straight to your inbox. No spam.',
    className = '',
}) => {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [done, setDone] = useState(false)

    const onSubmit = async (e) => {
        e?.preventDefault()
        const trimmed = email.trim()
        if (!trimmed) return showToast('error', 'Please enter your email.')
        setLoading(true)
        try {
            const { data: res } = await axios.post('/api/newsletter/subscribe', { email: trimmed, source })
            if (!res?.success) throw new Error(res?.message || 'Could not subscribe.')
            setDone(true)
            setEmail('')
            showToast('success', res.message)
        } catch (err) {
            showToast('error', err.message)
        } finally {
            setLoading(false)
        }
    }

    // ===== Premium Luxury Variant =====
    if (variant === 'premium') {
        return (
            <section className='relative py-20 bg-dark-gold border-y border-[#C9A24B]/30 overflow-hidden'>
                <span className='absolute pointer-events-none animate-sparkle text-[#F0D77C] top-10 left-1/4 text-xl' style={{ animationDelay: '0s' }}>✦</span>
                <span className='absolute pointer-events-none animate-sparkle text-[#F0D77C] bottom-10 right-1/3 text-lg' style={{ animationDelay: '1.5s' }}>✦</span>
                <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[#C9A24B]/15 rounded-full blur-3xl'></div>

                <div className='relative max-w-3xl mx-auto px-6 text-center'>
                    <div className='inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-[#C9A24B] to-[#F0D77C] shadow-xl shadow-[#C9A24B]/30 mb-4'>
                        <Mail size={26} className='text-[#1a1208]' />
                    </div>
                    <div className='flex items-center justify-center gap-3 text-[#C9A24B]'>
                        <span className='h-px w-16 bg-[#C9A24B]/50'></span>
                        <span className='text-xs'>❖</span>
                        <span className='h-px w-16 bg-[#C9A24B]/50'></span>
                    </div>
                    <h3 className='font-serif-display text-4xl md:text-5xl gold-shine mt-4 pb-2'>Join the House</h3>
                    <p className='text-white/70 mt-3'>Be first to receive launches, private editions and exclusive offers.</p>

                    {done ? (
                        <p className='text-sm text-[#F0D77C] bg-[#C9A24B]/10 border border-[#C9A24B]/30 p-4 mt-8 max-w-lg mx-auto'>
                            ✦ Check your inbox to confirm your subscription.
                        </p>
                    ) : (
                        <form onSubmit={onSubmit} className='mt-8 flex flex-col sm:flex-row gap-3 max-w-lg mx-auto'>
                            <input
                                type='email'
                                className='w-full sm:flex-1 h-12 bg-black/40 border border-[#C9A24B]/50 text-white placeholder:text-white/40 rounded-none focus:border-[#F0D77C] focus:outline-none px-4 text-sm transition-colors'
                                required
                                placeholder='Your email address'
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoComplete='email'
                            />
                            <button
                                type='submit'
                                disabled={loading}
                                className='w-full sm:w-auto btn-gold uppercase text-[11px] tracking-[0.3em] font-bold px-8 py-3 disabled:opacity-50 cursor-pointer'>
                                {loading ? 'Subscribing...' : 'Subscribe'}
                            </button>
                        </form>
                    )}
                </div>
            </section>
        )
    }

    // ===== Default / Inline / Stacked Variant (unchanged for admin/other pages) =====
    return (
        <div className={className}>
            {heading && <h3 className='text-base font-semibold mb-1'>{heading}</h3>}
            {description && <p className='text-sm text-gray-500 mb-3'>{description}</p>}
            {done ? (
                <p className='text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md p-3'>
                    Check your inbox to confirm your subscription.
                </p>
            ) : (
                <form
                    onSubmit={onSubmit}
                    className={variant === 'stacked' ? 'space-y-2' : 'flex flex-wrap gap-2 max-w-md'}
                >
                    <input
                        type='email'
                        placeholder='you@example.com'
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className='flex-1 min-w-[200px] border rounded px-3 py-2 text-sm'
                        autoComplete='email'
                    />
                    <ButtonLoading
                        loading={loading}
                        type='submit'
                        text='Subscribe'
                        className='shrink-0 cursor-pointer'
                    />
                </form>
            )}
        </div>
    )
}

export default NewsletterSubscribe
