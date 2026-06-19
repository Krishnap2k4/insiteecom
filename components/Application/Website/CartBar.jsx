'use client'
import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import Link from 'next/link'
import { ShoppingBag, Truck } from 'lucide-react'
import { WEBSITE_CHECKOUT } from '@/routes/WebsiteRoute'
import { WEBSITE_LOGIN } from '@/routes/WebsiteRoute'
import { usePathname } from 'next/navigation'
import { STANDARD_DELIVERY_CHARGE } from '@/lib/shipping'
import { useSiteSettings } from '@/hooks/useSiteSettings'

const CartBar = () => {
    const cart = useSelector(s => s.cartStore)
    const auth = useSelector(s => s.authStore?.auth)
    const pathname = usePathname()
    const [visible, setVisible] = useState(false)
    const { shipping } = useSiteSettings()
    const threshold = shipping?.freeDeliveryThreshold

    const isCheckout = pathname === '/checkout'

    useEffect(() => {
        const shouldShow = cart.hydrated && cart.count > 0 && !isCheckout
        const t = setTimeout(() => setVisible(shouldShow), 80)
        return () => clearTimeout(t)
    }, [cart.count, cart.hydrated, isCheckout])

    if (!cart.hydrated || cart.count === 0 || isCheckout) return null

    const subtotal = Number(cart.subtotal || 0)
    const shippingAmount = Number(cart.shippingAmount ?? STANDARD_DELIVERY_CHARGE)
    const hasFreeDelivery = shippingAmount === 0
    const remaining = Math.max(0, threshold - subtotal)
    const progress = Math.min(100, (subtotal / threshold) * 100)
    const checkoutHref = auth ? WEBSITE_CHECKOUT : `${WEBSITE_LOGIN}?callback=${WEBSITE_CHECKOUT}`

    return (
        <div
            className={`fixed bottom-0 left-0 right-0 z-[49] transition-transform duration-300 ease-out ${visible ? 'translate-y-0' : 'translate-y-full'}`}
        >
            {/* Free delivery progress strip */}
            <div className={`${hasFreeDelivery ? 'bg-[#0d2b18]' : 'bg-[#110e05]'} px-4 py-1.5 border-t border-[#C9A24B]/20`}>
                <div className='max-w-7xl mx-auto flex items-center gap-3'>
                    <Truck size={13} className={`shrink-0 ${hasFreeDelivery ? 'text-[#4ade80]' : 'text-[#C9A24B]'}`} />
                    <div className='flex-1 h-1 bg-white/10 rounded-full overflow-hidden min-w-[30px]'>
                        <div
                            className={`h-full rounded-full transition-all duration-500 ease-out ${hasFreeDelivery ? 'bg-[#4ade80]' : 'bg-gradient-to-r from-[#C9A24B] to-[#F0D77C]'}`}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <span className={`text-xs font-medium whitespace-nowrap shrink-0 ${hasFreeDelivery ? 'text-[#4ade80]' : 'text-[#F0D77C]'}`}>
                        {hasFreeDelivery
                            ? '✦ Free delivery unlocked!'
                            : <>
                                Add {remaining.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}
                                <span className='hidden md:inline'> more</span>
                                <span> for free delivery</span>
                            </>}
                    </span>
                </div>
            </div>

            {/* Main bar */}
            <div className='bg-[#0a0805]/95 backdrop-blur-md border-t border-[#C9A24B]/30 px-4 py-2.5 shadow-[0_-8px_32px_rgba(0,0,0,0.5)]'>
                <div className='max-w-7xl mx-auto flex items-center justify-between gap-4'>

                    {/* Left — bag icon + item count */}
                    <div className='flex items-center gap-3 shrink-0'>
                        <div className='relative'>
                            <ShoppingBag size={20} className='text-[#F0D77C]' />
                            <span className='absolute -top-1.5 -right-1.5 bg-gradient-to-r from-[#C9A24B] to-[#F0D77C] text-black text-[10px] font-bold rounded-full min-w-[17px] h-[17px] px-1 flex items-center justify-center leading-none'>
                                {cart.count > 99 ? '99+' : cart.count}
                            </span>
                        </div>
                        <div className='hidden sm:block leading-tight'>
                            <div className='text-white text-[13px] font-semibold'>
                                {cart.count} {cart.count === 1 ? 'item' : 'items'}
                            </div>
                            <div className='text-white/50 text-[11px]'>in your cart</div>
                        </div>
                    </div>

                    {/* Right — subtotal + CTA */}
                    <div className='flex items-center gap-3 sm:gap-5'>
                        <div className='text-right leading-tight'>
                            <div className='font-serif-display text-lg leading-none gold-text'>
                                {(subtotal + shippingAmount).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}
                            </div>
                            <div className='text-[11px] text-white/50 mt-0.5'>
                                {hasFreeDelivery
                                    ? 'incl. free delivery'
                                    : `+${shippingAmount.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })} delivery`}
                            </div>
                        </div>
                        <Link
                            href={checkoutHref}
                            className='btn-gold uppercase text-[11px] tracking-[0.2em] font-bold px-5 sm:px-7 py-2.5 whitespace-nowrap'
                        >
                            {auth ? <>Checkout <span className='hidden sm:inline'>→</span></> : 'Login to Checkout'}
                        </Link>
                    </div>

                </div>
            </div>
        </div>
    )
}

export default CartBar
