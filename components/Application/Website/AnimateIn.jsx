'use client'
import { useEffect, useRef, useState } from 'react'

const getTranslate = (direction) => {
    if (direction === 'left')  return 'translateX(-40px)'
    if (direction === 'right') return 'translateX(40px)'
    if (direction === 'fade')  return 'translateY(0px)'
    return 'translateY(28px)' // 'up' (default)
}

const AnimateIn = ({ children, direction = 'up', delay = 0, className = '', threshold = 0.12 }) => {
    const ref = useRef(null)
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        const el = ref.current
        if (!el) return

        let rafId
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    // rAF ensures the browser has committed the initial opacity:0 paint
                    // before we start the transition — critical when PersistGate mounts
                    // the entire tree in one shot and elements never get an invisible frame.
                    rafId = requestAnimationFrame(() => setVisible(true))
                    observer.unobserve(el)
                }
            },
            { threshold }
        )
        observer.observe(el)

        return () => {
            observer.disconnect()
            if (rafId) cancelAnimationFrame(rafId)
        }
    }, [threshold])

    const easing = 'cubic-bezier(0.22, 1, 0.36, 1)'
    const duration = '0.9s'

    return (
        <div
            ref={ref}
            className={className || undefined}
            style={{
                opacity: visible ? 1 : 0,
                transform: visible ? 'none' : getTranslate(direction),
                transition: visible
                    ? `opacity ${duration} ${easing} ${delay}ms, transform ${duration} ${easing} ${delay}ms`
                    : 'none',
                willChange: 'opacity, transform',
            }}
        >
            {children}
        </div>
    )
}

export default AnimateIn
