'use client'
import UserPanelLayout from '@/components/Application/Website/UserPanelLayout'
import WebsiteBreadcrumb from '@/components/Application/Website/WebsiteBreadcrumb'
import ButtonLoading from '@/components/Application/ButtonLoading'
import axios from '@/lib/apiClient'
import { showToast } from '@/lib/showToast'
import {
    WEBSITE_ORDER_DETAILS,
    WEBSITE_RETURNS,
} from '@/routes/WebsiteRoute'
import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { FiCheckCircle, FiClock, FiInfo, FiPackage, FiRefreshCw, FiTruck, FiXCircle } from 'react-icons/fi'

const breadCrumb = {
    title: 'Return details',
    links: [{ label: 'Returns', href: WEBSITE_RETURNS }, { label: 'Details' }],
}

const PALETTE = {
    requested: { text: 'Requested', cls: 'bg-amber-500/20 text-amber-400', Icon: FiClock },
    approved: { text: 'Approved', cls: 'bg-sky-500/20 text-sky-400', Icon: FiCheckCircle },
    received: { text: 'Items received', cls: 'bg-indigo-500/20 text-indigo-400', Icon: FiPackage },
    refunded: { text: 'Refunded', cls: 'bg-emerald-500/20 text-emerald-400', Icon: FiRefreshCw },
    replaced: { text: 'Replacement shipped', cls: 'bg-emerald-500/20 text-emerald-400', Icon: FiTruck },
    rejected: { text: 'Rejected', cls: 'bg-red-500/20 text-red-400', Icon: FiXCircle },
    cancelled: { text: 'Cancelled', cls: 'bg-white/10 text-white/50', Icon: FiXCircle },
}

const formatDate = (d) => d ? new Date(d).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
}) : null

/**
 * Step progress strip — Requested → Approved → Items received →
 * Refunded/Replaced. Skips itself for terminal failure states
 * (rejected / cancelled), which render as a single info banner above
 * instead.
 */
const StepProgress = ({ doc }) => {
    const isExchange = doc.type === 'exchange'
    const finalKey = isExchange ? 'replaced' : 'refunded'
    const finalLabel = isExchange ? 'Replacement shipped' : 'Refund processed'

    const steps = [
        { key: 'requested', label: 'Requested', at: doc.createdAt },
        { key: 'approved', label: 'Approved', at: doc.approvedAt },
        { key: 'received', label: 'Items received', at: doc.receivedAt },
        { key: finalKey, label: finalLabel, at: doc.completedAt },
    ]

    // Determine which step is "current" based on doc.status.
    const reachedIdx = (() => {
        if (doc.status === 'requested') return 0
        if (doc.status === 'approved') return 1
        if (doc.status === 'received') return 2
        if (doc.status === finalKey) return 3
        return -1
    })()

    return (
        <ol className='grid grid-cols-1 sm:grid-cols-4 gap-3'>
            {steps.map((s, idx) => {
                const done = idx <= reachedIdx
                const isCurrent = idx === reachedIdx && doc.status !== finalKey
                return (
                    <li key={s.key} className='flex items-start gap-3 sm:flex-col sm:items-start'>
                        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium shrink-0
                            ${done ? (idx === 3 ? 'bg-[#C9A24B] text-[#0a0805]' : 'bg-gradient-to-r from-[#C9A24B] to-[#F0D77C] text-[#0a0805]') : 'bg-white/10 text-white/50'}
                            ${isCurrent ? 'ring-2 ring-[#C9A24B]/30' : ''}`}>
                            {done ? <FiCheckCircle size={14} /> : idx + 1}
                        </span>
                        <div className='min-w-0 sm:mt-2'>
                            <p className={`text-sm font-medium ${done ? 'text-white' : 'text-white/50'}`}>{s.label}</p>
                            <p className='text-xs text-white/40 mt-0.5'>{formatDate(s.at) || '—'}</p>
                        </div>
                    </li>
                )
            })}
        </ol>
    )
}

const NextActionBanner = ({ doc }) => {
    const Banner = ({ tone, Icon, title, body }) => {
        const tones = {
            info: 'bg-[#C9A24B]/10 border-[#C9A24B]/30 text-[#C9A24B]',
            warn: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
            success: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
            error: 'bg-red-500/10 border-red-500/30 text-red-400',
            neutral: 'bg-white/5 border-white/10 text-white/50',
        }
        return (
            <div className={`rounded-md border p-4 flex items-start gap-3 ${tones[tone]}`}>
                <Icon className='mt-0.5 shrink-0' />
                <div className='min-w-0'>
                    <p className='text-sm font-medium'>{title}</p>
                    {body && <p className='text-xs mt-0.5 opacity-90'>{body}</p>}
                </div>
            </div>
        )
    }

    switch (doc.status) {
        case 'requested':
            return <Banner tone='info' Icon={FiClock} title="We've received your request"
                body='Our team typically reviews requests within 24 hours.' />
        case 'approved':
            return <Banner tone='info' Icon={FiTruck} title='Approved — please send the items back'
                body={doc.adminNote || 'Our team will reach out with pickup or ship-back instructions.'} />
        case 'received':
            return <Banner tone='info' Icon={FiPackage}
                title={doc.type === 'exchange' ? 'Items received — preparing your replacement' : 'Items received — processing your refund'}
                body={doc.type === 'exchange' ? 'You will get a tracking link once the replacement ships.' : 'Refunds typically take 5–7 business days to reflect on your statement.'} />
        case 'refunded':
            return <Banner tone='success' Icon={FiRefreshCw} title='Refund processed'
                body='Funds should reach your statement within 5–7 business days.' />
        case 'replaced':
            return <Banner tone='success' Icon={FiTruck} title='Replacement on its way'
                body='Track the new shipment from your order page.' />
        case 'rejected':
            return <Banner tone='error' Icon={FiXCircle} title='Request not approved'
                body={doc.adminNote || 'If you think this is a mistake, reply to the rejection email and we will review again.'} />
        case 'cancelled':
            return <Banner tone='neutral' Icon={FiInfo} title='Request cancelled'
                body='You cancelled this request before it was reviewed.' />
        default:
            return null
    }
}

const ReturnDetailsPage = ({ params }) => {
    const { id } = use(params)
    const [doc, setDoc] = useState(null)
    const [loading, setLoading] = useState(true)
    const [busy, setBusy] = useState(false)

    const load = async () => {
        setLoading(true)
        try {
            const { data: res } = await axios.get(`/api/account/returns/${id}`)
            if (res?.success) setDoc(res.data); else setDoc(null)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { load() /* eslint-disable-next-line */ }, [id])

    const handleCancel = async () => {
        if (!confirm('Cancel this request?')) return
        setBusy(true)
        try {
            const { data: res } = await axios.post(`/api/account/returns/${doc._id}/cancel`)
            if (!res?.success) throw new Error(res?.message || 'Could not cancel.')
            showToast('success', res.message)
            await load()
        } catch (err) {
            showToast('error', err.message)
        } finally {
            setBusy(false)
        }
    }

    const meta = doc ? PALETTE[doc.status] || PALETTE.requested : null

    return (
        <div>
            <WebsiteBreadcrumb props={breadCrumb} />
            <UserPanelLayout>
                {loading ? (
                    <div className='border border-[#C9A24B]/20 rounded p-10 text-center text-white/50 bg-[#0a0805]'>Loading…</div>
                ) : !doc ? (
                    <div className='border border-[#C9A24B]/20 rounded p-10 text-center text-red-400 font-semibold bg-[#0a0805]'>Return not found.</div>
                ) : (
                    <div className='space-y-6'>
                        <div className='border border-[#C9A24B]/20 rounded p-5 bg-[#0a0805]'>
                            <div className='flex flex-wrap items-start justify-between gap-3'>
                                <div className='min-w-0'>
                                    <h1 className='text-2xl font-serif-display text-[#F0D77C]'>{doc.returnNumber}</h1>
                                    <p className='text-sm text-white/50 mt-1'>
                                        <span className='capitalize'>{doc.type}</span> · requested {formatDate(doc.createdAt)}
                                    </p>
                                    {doc.order?.orderNumber && (
                                        <p className='text-sm text-white/50 mt-0.5'>
                                            For order <Link href={WEBSITE_ORDER_DETAILS(doc.order.orderNumber)} className='text-[#C9A24B] hover:text-[#F0D77C] hover:underline transition-colors'>{doc.order.orderNumber}</Link>
                                        </p>
                                    )}
                                </div>
                                <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full ${meta.cls}`}>
                                    <meta.Icon size={12} /> {meta.text}
                                </span>
                            </div>
                        </div>

                        <NextActionBanner doc={doc} />

                        {!['rejected', 'cancelled'].includes(doc.status) && (
                            <div className='border border-[#C9A24B]/20 rounded p-5 bg-[#0a0805]'>
                                <h3 className='font-medium mb-4 text-[#F0D77C]'>Progress</h3>
                                <StepProgress doc={doc} />
                            </div>
                        )}

                        <div className='border border-[#C9A24B]/20 rounded p-5 bg-[#0a0805]'>
                            <h3 className='font-medium mb-3 text-[#F0D77C]'>Items</h3>
                            <table className='w-full'>
                                <tbody>
                                    {doc.items?.map((it, idx) => (
                                        <tr key={idx} className='border-b border-[#C9A24B]/10 last:border-b-0'>
                                            <td className='p-2 text-sm'>
                                                <p className='font-medium text-white'>{it.name || it.sku}</p>
                                                <p className='text-xs text-white/50'>SKU: {it.sku}</p>
                                                {it.reason && <p className='text-xs text-white/40 mt-1'>Reason: {it.reason}</p>}
                                            </td>
                                            <td className='p-2 text-sm text-right text-white/80'>Qty {it.qty}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {doc.requestNote && (
                                <p className='text-sm text-white/50 mt-3'>
                                    <strong className='text-white/80'>Your note:</strong> {doc.requestNote}
                                </p>
                            )}
                            {doc.adminNote && (
                                <p className='text-sm text-white/50 mt-3'>
                                    <strong className='text-[#F0D77C]'>From our team:</strong> {doc.adminNote}
                                </p>
                            )}
                        </div>

                        {doc.status === 'requested' && (
                            <div className='border border-[#C9A24B]/20 rounded p-5 flex flex-wrap items-center justify-between gap-3 bg-[#0a0805]'>
                                <p className='text-sm text-white/50'>Made a mistake? You can cancel while this request is still in review.</p>
                                <ButtonLoading type='button' text='Cancel request' loading={busy} onClick={handleCancel} className='btn-outline-gold py-2 px-6 uppercase tracking-widest text-xs font-semibold' />
                            </div>
                        )}
                    </div>
                )}
            </UserPanelLayout>
        </div>
    )
}

export default ReturnDetailsPage
