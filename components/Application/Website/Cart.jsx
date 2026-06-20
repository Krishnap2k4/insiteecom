'use client'
import { ShoppingBag, Minus, Plus, Trash2 } from 'lucide-react'
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet'
import { useDispatch, useSelector } from 'react-redux'
import Image from 'next/image'
import imgPlaceholder from '@/public/assets/images/img-placeholder.webp'
import { removeFromCartAsync, updateCartQty } from '@/store/reducer/cartReducer'
import Link from 'next/link'
import { WEBSITE_CART, WEBSITE_CHECKOUT, WEBSITE_LOGIN, WEBSITE_PRODUCT_DETAILS } from '@/routes/WebsiteRoute'
import { useState } from 'react'
import { showToast } from '@/lib/showToast'

const Cart = () => {
    const [open, setOpen] = useState(false)
    const cart = useSelector((s) => s.cartStore)
    const auth = useSelector((s) => s.authStore?.auth)
    const dispatch = useDispatch()
    const shippingAmount = Number(cart.shippingAmount || 0)

    const hasUnavailable = cart.products.some((p) => p.unavailable)

    const handleQty = (item, delta) => {
        const nextQty = item.qty + delta
        if (nextQty < 1) {
            dispatch(removeFromCartAsync({ variantId: item.variantId }))
        } else if (nextQty <= 99) {
            dispatch(updateCartQty({ variantId: item.variantId, qty: nextQty }))
        }
    }

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger className='relative hover:text-[#E5C76B] transition-colors cursor-pointer'>
                <ShoppingBag size={20} />
                {cart.count > 0 && (
                    <span className='absolute bg-gradient-to-r from-[#C9A24B] to-[#F0D77C] text-black text-[9px] font-bold rounded-full w-4 h-4 flex justify-center items-center -right-2 -top-1'>
                        {cart.count}
                    </span>
                )}
            </SheetTrigger>
            <SheetContent className='sm:max-w-[450px] w-full bg-[#0a0805] border-l border-[#C9A24B]/30 text-white p-0'>
                <SheetHeader className='p-5 border-b border-[#C9A24B]/20'>
                    <SheetTitle className='text-xl font-serif-display text-white flex items-center gap-3'>
                        <ShoppingBag size={20} className='text-[#F0D77C]' />
                        My Cart
                    </SheetTitle>
                    <SheetDescription className='text-white/50 text-xs'>
                        {cart.count > 0 ? `${cart.count} item${cart.count > 1 ? 's' : ''} in your bag` : 'Your bag is empty'}
                    </SheetDescription>
                </SheetHeader>

                {/* `100dvh` (dynamic viewport height) shrinks when iOS Safari's
                    bottom bar appears, so the drawer's footer (View Cart /
                    Checkout buttons) never gets hidden behind it. Old
                    browsers ignore `dvh`; the parent Sheet gives us a sane
                    fallback height in that case. */}
                <div className='flex flex-col h-[calc(100dvh-80px)]'>
                    <div className='flex-1 overflow-auto px-5 py-4'>
                        {cart.count === 0 && (
                            <div className='h-full flex flex-col justify-center items-center text-center'>
                                <ShoppingBag size={48} className='text-[#C9A24B]/30 mb-4' />
                                <p className='text-white/60 font-serif-display text-lg'>Your cart is empty.</p>
                                <p className='text-white/40 text-xs mt-1'>Discover our curated fragrances</p>
                            </div>
                        )}

                        {cart.products?.map((product) => (
                            <div
                                key={product.variantId}
                                className={`flex gap-4 mb-4 pb-4 border-b border-[#C9A24B]/15 ${product.unavailable ? 'opacity-60' : ''}`}
                            >
                                <Image
                                    src={product?.media || imgPlaceholder.src}
                                    height={80}
                                    width={80}
                                    alt={product.name || ''}
                                    className='w-20 h-20 object-cover border border-[#C9A24B]/30'
                                />
                                <div className='flex-1 min-w-0'>
                                    <h4 className='text-sm font-medium text-white line-clamp-2'>
                                        <Link
                                            href={WEBSITE_PRODUCT_DETAILS(product.slug, product.publicId)}
                                            onClick={() => setOpen(false)}
                                            className='hover:text-[#F0D77C] transition-colors'
                                        >
                                            {product.name || 'Item'}
                                        </Link>
                                    </h4>
                                    {(product.optionValues || []).length > 0 && (
                                        <p className='text-[10px] text-[#F0D77C]/60 mt-0.5 uppercase tracking-wider'>
                                            {product.optionValues.map((ov) => `${ov.name}: ${ov.value}`).join(' · ')}
                                        </p>
                                    )}
                                    {product.unavailable && (
                                        <p className='text-[10px] text-red-400 mt-1'>{product.unavailableReason || 'Unavailable'}</p>
                                    )}

                                    <div className='flex items-center justify-between mt-3'>
                                        <div className='flex items-center h-7 border border-[#C9A24B]/30 w-fit'>
                                            <button type='button' className='h-full w-7 flex justify-center items-center cursor-pointer hover:bg-[#C9A24B]/15 transition text-white/70' onClick={() => handleQty(product, -1)}>
                                                <Minus size={12} />
                                            </button>
                                            <span className='w-8 text-center text-xs text-[#F0D77C]'>{product.qty}</span>
                                            <button type='button' className='h-full w-7 flex justify-center items-center cursor-pointer hover:bg-[#C9A24B]/15 transition text-white/70' onClick={() => handleQty(product, 1)}>
                                                <Plus size={12} />
                                            </button>
                                        </div>
                                        <p className='text-sm font-serif-display gold-text'>
                                            {(Number(product.sellingPrice || 0) * product.qty).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                                        </p>
                                    </div>
                                </div>

                                <button
                                    type='button'
                                    className='text-white/40 hover:text-red-400 cursor-pointer shrink-0 mt-1 transition-colors'
                                    onClick={() => dispatch(removeFromCartAsync({ variantId: product.variantId }))}
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}
                    </div>

                    <div
                        className='shrink-0 border-t border-[#C9A24B]/30 px-5 pt-4 bg-gradient-to-t from-[#0d0a04] to-[#0a0805]'
                        // Extra bottom padding for iOS' home indicator —
                        // ensures the View Cart / Checkout buttons are
                        // never tucked under the browser chrome.
                        style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
                    >
                        {cart.count > 0 && (
                            <>
                                <div className='flex justify-between items-center text-sm'>
                                    <span className='text-white/60 uppercase tracking-wider text-[11px]'>Subtotal</span>
                                    <span className='font-serif-display text-lg gold-text'>{Number(cart.subtotal || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</span>
                                </div>
                                {(cart.discount || 0) > 0 && (
                                    <div className='flex justify-between items-center text-xs text-[#F0D77C]/60 mt-1'>
                                        <span>Discount</span>
                                        <span>- {Number(cart.discount || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</span>
                                    </div>
                                )}
                                <div className='flex justify-between items-center text-xs mt-1'>
                                    <span className='text-white/60'>Delivery</span>
                                    <span className={shippingAmount === 0 ? 'text-[#4ade80] font-semibold' : 'text-white/70'}>
                                        {shippingAmount === 0
                                            ? 'Free'
                                            : shippingAmount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                                    </span>
                                </div>
                                <div className='flex justify-between items-center text-sm mt-1 pt-1 border-t border-[#C9A24B]/20'>
                                    <span className='text-white/60 uppercase tracking-wider text-[11px]'>Total</span>
                                    <span className='font-serif-display text-lg gold-text'>
                                        {(Number(cart.subtotal || 0) + shippingAmount).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                                    </span>
                                </div>
                            </>
                        )}

                        <div className='flex gap-3 mt-4'>
                            <Link href={WEBSITE_CART}
                                  onClick={() => setOpen(false)}
                                  className='flex-1 text-center btn-dark-gold uppercase text-[10px] tracking-[0.25em] font-semibold py-3'>
                                View Cart
                            </Link>
                            {cart.count && !hasUnavailable ? (
                                <Link
                                    href={auth ? WEBSITE_CHECKOUT : `${WEBSITE_LOGIN}?callback=${WEBSITE_CHECKOUT}`}
                                    onClick={() => setOpen(false)}
                                    className='flex-1 text-center btn-gold uppercase text-[10px] tracking-[0.25em] font-bold py-3'>
                                    {auth ? 'Checkout' : 'Login to Checkout'}
                                </Link>
                            ) : (
                                <button type='button'
                                        onClick={() => showToast('error', hasUnavailable ? 'Remove unavailable items first.' : 'Your cart is empty.')}
                                        className='flex-1 text-center btn-gold uppercase text-[10px] tracking-[0.25em] font-bold py-3 opacity-50 cursor-not-allowed'>
                                    Checkout
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    )
}

export default Cart
