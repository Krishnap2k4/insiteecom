'use client'
import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import useRequireAuth from '@/hooks/useRequireAuth'
import UserPanelLayout from '@/components/Application/Website/UserPanelLayout'
import WebsiteBreadcrumb from '@/components/Application/Website/WebsiteBreadcrumb'
import ButtonLoading from '@/components/Application/ButtonLoading'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import axios from '@/lib/apiClient'
import useFetch from '@/hooks/useFetch'
import { showToast } from '@/lib/showToast'
import { WEBSITE_MESSAGES, WEBSITE_MESSAGE_DETAILS } from '@/routes/WebsiteRoute'
import Link from 'next/link'

const breadCrumb = {
    title: 'New conversation',
    links: [{ label: 'Messages', href: WEBSITE_MESSAGES }, { label: 'New' }],
}

const NewMessageInner = () => {
    const { isLoggedIn, rehydrated } = useRequireAuth()
    const router = useRouter()
    const sp = useSearchParams()
    if (!rehydrated || !isLoggedIn) return null
    const orderRef = sp.get('order')
    const { data: orderData } = useFetch(orderRef ? `/api/orders/get/${orderRef}` : null)
    const order = orderData?.data?.order

    const [subject, setSubject] = useState(order ? `Question about order ${order.orderNumber}` : '')
    const [body, setBody] = useState('')
    const [loading, setLoading] = useState(false)

    const submit = async () => {
        if (!subject.trim() || !body.trim()) {
            return showToast('error', 'Subject and message are required.')
        }
        setLoading(true)
        try {
            const { data: res } = await axios.post('/api/support/conversations', {
                subject: subject.trim(),
                body: body.trim(),
                relatedOrder: order?._id,
                subjectType: order ? 'order' : 'general',
            })
            if (!res?.success) throw new Error(res?.message || 'Could not start conversation.')
            showToast('success', res.message)
            router.push(WEBSITE_MESSAGE_DETAILS(res.data._id))
        } catch (err) {
            showToast('error', err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div>
            <WebsiteBreadcrumb props={breadCrumb} />
            <UserPanelLayout>
                <div className='border border-[#C9A24B]/20 bg-[#0a0805] rounded shadow-sm p-5 max-w-2xl'>
                    <h1 className='text-xl font-serif-display text-[#F0D77C] mb-1'>Start a new conversation</h1>
                    <p className='text-sm text-white/50 mb-5'>Our team typically replies within 24 hours.</p>

                    {order && (
                        <div className='mb-5 rounded-md bg-[#15110a] border border-[#C9A24B]/20 p-3 text-sm'>
                            <p className='text-xs text-white/50'>Linked to order</p>
                            <p className='font-medium text-white/80'>{order.orderNumber}</p>
                        </div>
                    )}

                    <div className='space-y-4'>
                        <div>
                            <Label className='mb-1.5 block text-white/70'>Subject</Label>
                            <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder='What is this about?' className='bg-white/5 border-[#C9A24B]/30 text-white placeholder:text-white/30 focus:border-[#C9A24B] focus:ring-1 focus:ring-[#C9A24B]' />
                        </div>
                        <div>
                            <Label className='mb-1.5 block text-white/70'>Message</Label>
                            <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={6} placeholder='Tell us how we can help…' className='bg-white/5 border-[#C9A24B]/30 text-white placeholder:text-white/30 focus:border-[#C9A24B] focus:ring-1 focus:ring-[#C9A24B]' />
                        </div>
                        <div className='flex justify-end gap-2'>
                            <Link href={WEBSITE_MESSAGES} className='btn-outline-gold px-6 py-2.5 text-xs font-semibold uppercase tracking-widest'>
                                Cancel
                            </Link>
                            <ButtonLoading type='button' text='Send' loading={loading} onClick={submit} className='btn-dark-gold px-6 py-2.5 text-xs font-semibold uppercase tracking-widest' />
                        </div>
                    </div>
                </div>
            </UserPanelLayout>
        </div>
    )
}

const NewMessage = () => (
    <Suspense fallback={null}>
        <NewMessageInner />
    </Suspense>
)

export default NewMessage
