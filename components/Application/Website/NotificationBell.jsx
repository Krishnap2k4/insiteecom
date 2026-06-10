'use client'
import { useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import Link from 'next/link'
import { Bell, Check } from 'lucide-react'
import axios from '@/lib/apiClient'

const fromTime = (d) => {
    if (!d) return ''
    const diff = Date.now() - new Date(d).getTime()
    const m = Math.floor(diff / 60000)
    if (m < 1) return 'just now'
    if (m < 60) return `${m}m ago`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h}h ago`
    const days = Math.floor(h / 24)
    return `${days}d ago`
}

const NotificationBell = () => {
    const auth = useSelector((s) => s.authStore?.auth)
    const isLoggedIn = Boolean(auth?._id)
    const [open, setOpen] = useState(false)
    const [items, setItems] = useState([])
    const [unread, setUnread] = useState(0)
    const containerRef = useRef(null)

    useEffect(() => {
        const onClick = (e) => {
            if (open && containerRef.current && !containerRef.current.contains(e.target)) {
                setOpen(false)
            }
        }
        document.addEventListener('mousedown', onClick)
        return () => document.removeEventListener('mousedown', onClick)
    }, [open])

    const fetchCount = async () => {
        if (!isLoggedIn) return
        try {
            const { data: res } = await axios.get('/api/notifications/unread-count')
            if (res?.success) setUnread(res.data?.unreadCount || 0)
        } catch { /* swallow */ }
    }

    const fetchList = async () => {
        if (!isLoggedIn) return
        try {
            const { data: res } = await axios.get('/api/notifications?limit=10')
            if (res?.success) {
                setItems(res.data?.items || [])
                setUnread(res.data?.unreadCount || 0)
            }
        } catch { /* swallow */ }
    }

    useEffect(() => {
        if (!isLoggedIn) {
            setItems([])
            setUnread(0)
            return
        }
        fetchCount()
        const t = setInterval(() => {
            if (document.visibilityState === 'visible') fetchCount()
        }, 30000)
        return () => clearInterval(t)
    /* eslint-disable-next-line */
    }, [isLoggedIn])

    const onToggle = async () => {
        const next = !open
        setOpen(next)
        if (next) await fetchList()
    }

    const markAllRead = async () => {
        try {
            await axios.post('/api/notifications/mark-read', { all: true })
            setUnread(0)
            setItems((prev) => prev.map((n) => ({ ...n, read: true })))
        } catch { /* swallow */ }
    }

    if (!isLoggedIn) return null

    return (
        <div ref={containerRef} className='relative'>
            <button type='button' onClick={onToggle} className='relative hover:text-[#E5C76B] transition-colors cursor-pointer'>
                <Bell size={18} />
                {unread > 0 && (
                    <span className='absolute bg-gradient-to-r from-[#C9A24B] to-[#F0D77C] text-black text-[9px] font-bold rounded-full min-w-4 h-4 px-1 flex justify-center items-center -right-2 -top-1'>
                        {unread > 9 ? '9+' : unread}
                    </span>
                )}
            </button>

            {open && (
                <div className='absolute right-0 mt-3 w-80 bg-[#0a0805] border border-[#C9A24B]/30 shadow-2xl shadow-black/50 z-50'>
                    <div className='flex items-center justify-between px-4 py-3 border-b border-[#C9A24B]/20'>
                        <p className='text-sm font-serif-display text-white flex items-center gap-2'>
                            <Bell size={14} className='text-[#F0D77C]' />
                            Notifications
                        </p>
                        {unread > 0 && (
                            <button type='button' onClick={markAllRead} className='text-[10px] text-[#F0D77C] hover:text-[#E5C76B] uppercase tracking-wider flex items-center gap-1 cursor-pointer'>
                                <Check size={10} /> Mark read
                            </button>
                        )}
                    </div>
                    <div className='max-h-96 overflow-y-auto'>
                        {items.length === 0 ? (
                            <div className='py-8 text-center'>
                                <Bell size={28} className='text-[#C9A24B]/30 mx-auto mb-2' />
                                <p className='text-sm text-white/50'>You&apos;re all caught up.</p>
                            </div>
                        ) : (
                            <ul className='divide-y divide-[#C9A24B]/10'>
                                {items.map((n) => {
                                    const inner = (
                                        <div className={`px-4 py-3 hover:bg-[#C9A24B]/10 transition ${n.read ? '' : 'bg-[#C9A24B]/5'}`}>
                                            <div className='flex items-start gap-2'>
                                                {!n.read && <span className='w-2 h-2 rounded-full bg-[#F0D77C] shrink-0 mt-1.5' />}
                                                <div className='min-w-0 flex-1'>
                                                    <p className='text-sm font-medium text-white truncate'>{n.title}</p>
                                                    {n.body && <p className='text-xs text-white/50 mt-0.5 line-clamp-2'>{n.body}</p>}
                                                    <p className='text-[10px] text-[#F0D77C]/50 mt-1'>{fromTime(n.createdAt)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                    return (
                                        <li key={n._id}>
                                            {n.actionUrl ? (
                                                <Link href={n.actionUrl} onClick={() => setOpen(false)}>{inner}</Link>
                                            ) : inner}
                                        </li>
                                    )
                                })}
                            </ul>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

export default NotificationBell
