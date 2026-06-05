'use client'
import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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
    const router = useRouter()
    const sp = useSearchParams()
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
                <div className='border rounded shadow-sm p-5 max-w-2xl'>
                    <h1 className='text-xl font-semibold mb-1'>Start a new conversation</h1>
                    <p className='text-sm text-gray-500 mb-5'>Our team typically replies within 24 hours.</p>

                    {order && (
                        <div className='mb-5 rounded-md bg-gray-50 border p-3 text-sm'>
                            <p className='text-xs text-gray-500'>Linked to order</p>
                            <p className='font-medium'>{order.orderNumber}</p>
                        </div>
                    )}

                    <div className='space-y-4'>
                        <div>
                            <Label className='mb-1.5 block'>Subject</Label>
                            <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder='What is this about?' />
                        </div>
                        <div>
                            <Label className='mb-1.5 block'>Message</Label>
                            <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={6} placeholder='Tell us how we can help…' />
                        </div>
                        <div className='flex justify-end gap-2'>
                            <Button asChild variant='outline'>
                                <Link href={WEBSITE_MESSAGES}>Cancel</Link>
                            </Button>
                            <ButtonLoading type='button' text='Send' loading={loading} onClick={submit} />
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
