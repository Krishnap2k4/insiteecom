'use client'
import { BsCart2 } from 'react-icons/bs'
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
import { WEBSITE_CART, WEBSITE_CHECKOUT, WEBSITE_PRODUCT_DETAILS } from '@/routes/WebsiteRoute'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { showToast } from '@/lib/showToast'
import { HiMinus, HiPlus } from 'react-icons/hi2'

const Cart = () => {
    const [open, setOpen] = useState(false)
    const cart = useSelector((s) => s.cartStore)
    const dispatch = useDispatch()

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
            <SheetTrigger className='relative'>
                <BsCart2 size={25} className='text-gray-500 hover:text-primary' />
                {cart.count > 0 && (
                    <span className='absolute bg-red-500 text-white text-xs rounded-full w-4 h-4 flex justify-center items-center -right-2 -top-1'>
                        {cart.count}
                    </span>
                )}
            </SheetTrigger>
            <SheetContent className='sm:max-w-[450px] w-full'>
                <SheetHeader className='py-2'>
                    <SheetTitle className='text-2xl'>My Cart</SheetTitle>
                    <SheetDescription></SheetDescription>
                </SheetHeader>

                <div className='h-[calc(100vh-40px)] pb-10'>
                    <div className='h-[calc(100%-128px)] overflow-auto px-2'>
                        {cart.count === 0 && (
                            <div className='h-full flex justify-center items-center text-xl font-semibold'>
                                Your cart is empty.
                            </div>
                        )}

                        {cart.products?.map((product) => (
                            <div
                                key={product.variantId}
                                className={`flex justify-between items-start gap-4 mb-4 border-b pb-4 ${product.unavailable ? 'opacity-75' : ''}`}
                            >
                                <div className='flex gap-3 items-start min-w-0'>
                                    <Image
                                        src={product?.media || imgPlaceholder.src}
                                        height={80}
                                        width={80}
                                        alt={product.name || ''}
                                        className='w-20 h-20 rounded border object-cover'
                                    />
                                    <div className='min-w-0'>
                                        <h4 className='text-sm font-medium line-clamp-2'>
                                            <Link
                                                href={WEBSITE_PRODUCT_DETAILS(product.slug, product.publicId)}
                                                onClick={() => setOpen(false)}
                                            >
                                                {product.name || 'Item'}
                                            </Link>
                                        </h4>
                                        {(product.optionValues || []).length > 0 && (
                                            <p className='text-xs text-gray-500 mt-0.5'>
                                                {product.optionValues.map((ov) => `${ov.name}: ${ov.value}`).join(' · ')}
                                            </p>
                                        )}
                                        {product.unavailable && (
                                            <p className='text-xs text-red-500 mt-1'>{product.unavailableReason || 'Unavailable'}</p>
                                        )}

                                        <div className='flex items-center gap-3 mt-2'>
                                            <div className='flex items-center h-7 border w-fit rounded-full'>
                                                <button type='button' className='h-full w-7 flex justify-center items-center cursor-pointer' onClick={() => handleQty(product, -1)}>
                                                    <HiMinus size={12} />
                                                </button>
                                                <span className='w-8 text-center text-sm'>{product.qty}</span>
                                                <button type='button' className='h-full w-7 flex justify-center items-center cursor-pointer' onClick={() => handleQty(product, 1)}>
                                                    <HiPlus size={12} />
                                                </button>
                                            </div>
                                            <p className='text-sm font-semibold'>
                                                {(Number(product.sellingPrice || 0) * product.qty).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type='button'
                                    className='text-xs text-red-500 underline underline-offset-2 cursor-pointer shrink-0'
                                    onClick={() => dispatch(removeFromCartAsync({ variantId: product.variantId }))}
                                >
                                    Remove
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className='h-32 border-t pt-5 px-2'>
                        <h2 className='flex justify-between items-center text-base font-semibold'>
                            <span>Subtotal</span>
                            <span>{Number(cart.subtotal || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</span>
                        </h2>
                        <h2 className='flex justify-between items-center text-sm text-gray-500'>
                            <span>Discount applied</span>
                            <span>- {Number(cart.discount || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</span>
                        </h2>

                        <div className='flex justify-between mt-3 gap-3'>
                            <Button type='button' asChild variant='secondary' className='flex-1' onClick={() => setOpen(false)}>
                                <Link href={WEBSITE_CART}>View cart</Link>
                            </Button>
                            <Button
                                type='button'
                                asChild
                                className='flex-1'
                                onClick={() => setOpen(false)}
                                disabled={cart.count === 0 || hasUnavailable}
                            >
                                {cart.count && !hasUnavailable ? (
                                    <Link href={WEBSITE_CHECKOUT}>Checkout</Link>
                                ) : (
                                    <button type='button' onClick={() => showToast('error', hasUnavailable ? 'Remove unavailable items first.' : 'Your cart is empty.')}>
                                        Checkout
                                    </button>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    )
}

export default Cart
