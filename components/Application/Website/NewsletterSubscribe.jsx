'use client'
import { useState } from 'react'
import axios from '@/lib/apiClient'
import { showToast } from '@/lib/showToast'
import { Input } from '@/components/ui/input'
import ButtonLoading from '@/components/Application/ButtonLoading'

/**
 * Reusable newsletter subscribe block. Drops into the footer today
 * and will be the storefront `newsletter` CMS block tomorrow
 * (Module 7).
 *
 * Props:
 *   variant      — 'inline' (default, horizontal) or 'stacked'
 *   source       — attribution string sent to the API (e.g. 'footer',
 *                  'cms-home', 'popup'). Lets analytics segment signups.
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
                    <Input
                        type='email'
                        placeholder='you@example.com'
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className='flex-1 min-w-[200px]'
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
