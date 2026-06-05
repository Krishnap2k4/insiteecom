'use client'
import { useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import Link from 'next/link'
import { FiBell } from 'react-icons/fi'
import axios from '@/lib/apiClient'

/**
 * Header notification bell. Only renders for authenticated customers
 * (auth is read from the Redux auth store, same source the rest of
 * the header uses).
 *
 * Light polling — every 30s while the tab is visible. Real-time push
 * (websocket / SSE) is out of scope for now; polling is plenty for an
 * in-app notification surface.
 */
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

    // Close the dropdown when clicking outside.
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
            <button type='button' onClick={onToggle} className='relative'>
                <FiBell size={22} className='text-gray-500 hover:text-primary' />
                {unread > 0 && (
                    <span className='absolute bg-red-500 text-white text-[10px] rounded-full min-w-4 h-4 px-1 flex justify-center items-center -right-2 -top-1'>
                        {unread > 9 ? '9+' : unread}
                    </span>
                )}
            </button>

            {open && (
                <div className='absolute right-0 mt-3 w-80 bg-white border rounded-md shadow-lg z-50'>
                    <div className='flex items-center justify-between px-4 py-3 border-b'>
                        <p className='text-sm font-semibold'>Notifications</p>
                        {unread > 0 && (
                            <button type='button' onClick={markAllRead} className='text-xs text-primary hover:underline'>
                                Mark all read
                            </button>
                        )}
                    </div>
                    <div className='max-h-96 overflow-y-auto'>
                        {items.length === 0 ? (
                            <p className='text-sm text-gray-500 text-center py-8'>You&apos;re all caught up.</p>
                        ) : (
                            <ul className='divide-y'>
                                {items.map((n) => {
                                    const inner = (
                                        <div className={`px-4 py-3 hover:bg-gray-50 transition ${n.read ? '' : 'bg-emerald-50/40'}`}>
                                            <div className='flex items-start gap-2'>
                                                {!n.read && <span className='w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-1.5' />}
                                                <div className='min-w-0 flex-1'>
                                                    <p className='text-sm font-medium truncate'>{n.title}</p>
                                                    {n.body && <p className='text-xs text-gray-500 mt-0.5 line-clamp-2'>{n.body}</p>}
                                                    <p className='text-[11px] text-gray-400 mt-1'>{fromTime(n.createdAt)}</p>
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
