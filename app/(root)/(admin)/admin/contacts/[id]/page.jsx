'use client'
import BreadCrumb from '@/components/Application/Admin/BreadCrumb'
import { Button } from '@/components/ui/button'
import ButtonLoading from '@/components/Application/ButtonLoading'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import Select from '@/components/Application/Select'
import axios from '@/lib/apiClient'
import { showToast } from '@/lib/showToast'
import {
    ADMIN_CONTACTS_SHOW,
    ADMIN_DASHBOARD,
    ADMIN_SUPPORT_DETAILS,
} from '@/routes/AdminPanelRoute'
import Link from 'next/link'
import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const breadcrumbData = [
    { href: ADMIN_DASHBOARD, label: 'Home' },
    { href: ADMIN_CONTACTS_SHOW, label: 'Contact submissions' },
    { href: '', label: 'Details' },
]

const STATUS_OPTIONS = [
    { value: 'new', label: 'New' },
    { value: 'in_progress', label: 'In progress' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'spam', label: 'Spam' },
]

const ContactDetail = ({ params }) => {
    const { id } = use(params)
    const router = useRouter()
    const [doc, setDoc] = useState(null)
    const [loading, setLoading] = useState(true)
    const [busy, setBusy] = useState(false)

    const load = async () => {
        try {
            const { data: res } = await axios.get(`/api/admin/contacts/${id}`)
            if (res?.success) setDoc(res.data); else setDoc(null)
        } finally { setLoading(false) }
    }
    useEffect(() => { load() /* eslint-disable-next-line */ }, [id])

    const updateStatus = async (status) => {
        setBusy(true)
        try {
            const { data: res } = await axios.put(`/api/admin/contacts/${id}`, { status })
            if (!res?.success) throw new Error(res?.message)
            showToast('success', res.message)
            await load()
        } catch (err) { showToast('error', err.message) }
        finally { setBusy(false) }
    }

    const convert = async () => {
        if (!confirm('Convert this submission into a support conversation?')) return
        setBusy(true)
        try {
            const { data: res } = await axios.post(`/api/admin/contacts/${id}/convert`)
            if (!res?.success) throw new Error(res?.message)
            showToast('success', res.message)
            router.push(ADMIN_SUPPORT_DETAILS(res.data.conversation))
        } catch (err) { showToast('error', err.message) }
        finally { setBusy(false) }
    }

    if (loading) {
        return (
            <div>
                <BreadCrumb breadcrumbData={breadcrumbData} />
                <div className='border rounded p-10 text-center text-gray-500'>Loading…</div>
            </div>
        )
    }
    if (!doc) {
        return (
            <div>
                <BreadCrumb breadcrumbData={breadcrumbData} />
                <div className='border rounded p-10 text-center text-red-500 font-semibold'>Submission not found.</div>
            </div>
        )
    }

    return (
        <div>
            <BreadCrumb breadcrumbData={breadcrumbData} />
            <div className='grid lg:grid-cols-[2fr_1fr] gap-5'>
                <Card className='py-0 rounded shadow-sm'>
                    <CardHeader className='pt-3 px-3 border-b [.border-b]:pb-2'>
                        <h4 className='font-semibold'>{doc.subject}</h4>
                        <p className='text-xs text-gray-500 mt-0.5'>From {doc.name} · {doc.email}{doc.phone ? ' · ' + doc.phone : ''}</p>
                    </CardHeader>
                    <CardContent className='p-4 whitespace-pre-wrap text-sm'>{doc.message}</CardContent>
                </Card>

                <div className='space-y-5'>
                    <Card className='py-0 rounded shadow-sm'>
                        <CardHeader className='pt-3 px-3 border-b [.border-b]:pb-2'>
                            <h4 className='font-semibold'>Status</h4>
                        </CardHeader>
                        <CardContent className='p-3'>
                            <Select
                                options={STATUS_OPTIONS}
                                selected={doc.status}
                                setSelected={updateStatus}
                                isMulti={false}
                            />
                        </CardContent>
                    </Card>

                    <Card className='py-0 rounded shadow-sm'>
                        <CardHeader className='pt-3 px-3 border-b [.border-b]:pb-2'>
                            <h4 className='font-semibold'>Actions</h4>
                        </CardHeader>
                        <CardContent className='p-3 space-y-2 text-sm'>
                            {doc.conversation ? (
                                <Button asChild className='w-full'>
                                    <Link href={ADMIN_SUPPORT_DETAILS(doc.conversation._id || doc.conversation)}>
                                        View conversation
                                    </Link>
                                </Button>
                            ) : (
                                <>
                                    <p className='text-xs text-gray-500'>If this customer has an account, you can promote this submission into a tracked support conversation.</p>
                                    <ButtonLoading type='button' text='Convert to ticket' loading={busy} onClick={convert} className='w-full' />
                                </>
                            )}
                            <Button asChild variant='outline' className='w-full mt-2'>
                                <a href={`mailto:${doc.email}?subject=Re:%20${encodeURIComponent(doc.subject)}`}>
                                    Reply by email
                                </a>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

export default ContactDetail
