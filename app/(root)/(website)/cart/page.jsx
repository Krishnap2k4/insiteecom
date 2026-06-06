'use client'
import WebsiteBreadcrumb from '@/components/Application/Website/WebsiteBreadcrumb'
import { Button } from '@/components/ui/button'
import { WEBSITE_CHECKOUT, WEBSITE_PRODUCT_DETAILS, WEBSITE_SHOP } from '@/routes/WebsiteRoute'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import imgPlaceholder from '@/public/assets/images/img-placeholder.webp'
import { HiMinus, HiPlus } from 'react-icons/hi2'
import { IoCloseCircleOutline } from 'react-icons/io5'
import { removeFromCartAsync, updateCartQty } from '@/store/reducer/cartReducer'

const breadCrumb = { title: 'Cart', links: [{ label: 'Cart' }] }

const CartPage = () => {
    const dispatch = useDispatch()
    const cart = useSelector((s) => s.cartStore)
    const hasUnavailable = cart.products.some((p) => p.unavailable)

    const setQty = (variantId, qty) => {
        if (qty <= 0) dispatch(removeFromCartAsync({ variantId }))
        else if (qty <= 99) dispatch(updateCartQty({ variantId, qty }))
    }

    return (
        <div>
            <WebsiteBreadcrumb props={breadCrumb} />
            {cart.count === 0 ? (
                <div className='w-full h-[500px] flex justify-center items-center py-32'>
                    <div className='text-center'>
                        <h4 className='text-4xl font-serif-display gold-text mb-5'>Your cart is empty</h4>
                        <Link href={WEBSITE_SHOP} className='btn-dark-gold px-8 py-3 uppercase tracking-widest text-xs font-semibold'>Continue Shopping</Link>
                    </div>
                </div>
            ) : (
                <div className='flex lg:flex-nowrap flex-wrap gap-10 my-20 lg:px-32 px-4'>
                    <div className='lg:w-[70%] w-full'>
                        <table className='w-full border border-[#C9A24B]/20'>
                            <thead className='border-b border-[#C9A24B]/20 bg-[#0a0805] md:table-header-group hidden'>
                                <tr>
                                    <th className='text-start p-3 text-[11px] tracking-[0.2em] uppercase text-white/50'>Product</th>
                                    <th className='text-center p-3 text-[11px] tracking-[0.2em] uppercase text-white/50'>Price</th>
                                    <th className='text-center p-3 text-[11px] tracking-[0.2em] uppercase text-white/50'>Quantity</th>
                                    <th className='text-center p-3 text-[11px] tracking-[0.2em] uppercase text-white/50'>Total</th>
                                    <th className='text-center p-3 text-[11px] tracking-[0.2em] uppercase text-white/50'>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cart.products.map((product) => (
                                    <tr key={product.variantId} className={`md:table-row block border-b border-[#C9A24B]/10 ${product.unavailable ? 'bg-red-900/10' : ''}`}>
                                        <td className='p-3'>
                                            <div className='flex items-center gap-5'>
                                                <Image src={product.media || imgPlaceholder.src} width={60} height={60} alt={product.name || ''} className='object-cover' />
                                                <div>
                                                    <h4 className='text-lg font-medium line-clamp-1 text-white'>
                                                        <Link href={WEBSITE_PRODUCT_DETAILS(product.slug, product.publicId)}>
                                                            {product.name || 'Item'}
                                                        </Link>
                                                    </h4>
                                                    {(product.optionValues || []).length > 0 && (
                                                        <p className='text-sm text-white/40'>
                                                            {product.optionValues.map((ov) => `${ov.name}: ${ov.value}`).join(' · ')}
                                                        </p>
                                                    )}
                                                    {product.unavailable && (
                                                        <p className='text-xs text-red-400 mt-0.5'>{product.unavailableReason || 'Unavailable'}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>

                                        <td className='md:table-cell flex justify-between md:p-3 px-3 pb-2 text-center text-white/70'>
                                            <span className='md:hidden font-medium text-white/40'>Price</span>
                                            <span>{Number(product.sellingPrice || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</span>
                                        </td>
                                        <td className='md:table-cell flex justify-between md:p-3 px-3 pb-2'>
                                            <span className='md:hidden font-medium text-white/40'>Quantity</span>
                                            <div className='flex justify-center'>
                                                <div className='flex justify-center items-center md:h-10 h-7 border border-[#C9A24B]/30 w-fit'>
                                                    <button type='button' className='h-full w-10 flex justify-center items-center cursor-pointer text-white/70 hover:text-[#F0D77C] transition-colors' onClick={() => setQty(product.variantId, product.qty - 1)}>
                                                        <HiMinus />
                                                    </button>
                                                    <input type='text' value={product.qty} className='md:w-14 w-8 text-center border-none outline-offset-0 bg-transparent text-white' readOnly />
                                                    <button type='button' className='h-full w-10 flex justify-center items-center cursor-pointer text-white/70 hover:text-[#F0D77C] transition-colors' onClick={() => setQty(product.variantId, product.qty + 1)}>
                                                        <HiPlus />
                                                    </button>
                                                </div>
                                            </div>
                                        </td>
                                        <td className='md:table-cell flex justify-between md:p-3 px-3 pb-2 text-center text-white/70'>
                                            <span className='md:hidden font-medium text-white/40'>Total</span>
                                            <span>{(Number(product.sellingPrice || 0) * product.qty).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</span>
                                        </td>
                                        <td className='md:table-cell flex justify-between md:p-3 px-3 pb-2 text-center'>
                                            <span className='md:hidden font-medium text-white/40'>Remove</span>
                                            <button type='button' onClick={() => dispatch(removeFromCartAsync({ variantId: product.variantId }))} className='text-red-400 hover:text-red-300 cursor-pointer transition-colors'>
                                                <IoCloseCircleOutline size={22} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className='lg:w-[30%] w-full'>
                        <div className='bg-[#0a0805] border border-[#C9A24B]/20 p-5 sticky top-5'>
                            <h4 className='text-lg font-serif-display text-[#F0D77C] mb-5'>Order Summary</h4>
                            <table className='w-full'>
                                <tbody>
                                    <tr className='border-b border-[#C9A24B]/10'>
                                        <td className='font-medium py-2 text-white/70'>Subtotal</td>
                                        <td className='text-end py-2 text-white'>
                                            {Number(cart.subtotal || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                                        </td>
                                    </tr>
                                    <tr className='border-b border-[#C9A24B]/10'>
                                        <td className='font-medium py-2 text-white/70'>Discount</td>
                                        <td className='text-end py-2 text-[#C9A24B]'>
                                            -{Number(cart.discount || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className='font-semibold py-2 text-white'>Total</td>
                                        <td className='text-end py-2 font-semibold text-[#F0D77C]'>
                                            {Number(cart.subtotal || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>

                            {hasUnavailable
                                ? <span className='btn-dark-gold w-full py-3 uppercase tracking-widest text-xs font-semibold mt-5 mb-3 block text-center opacity-50'>Remove unavailable items</span>
                                : <Link href={WEBSITE_CHECKOUT} className='btn-dark-gold w-full py-3 uppercase tracking-widest text-xs font-semibold mt-5 mb-3 block text-center'>Proceed to Checkout</Link>
                            }

                            <p className='text-center'>
                                <Link href={WEBSITE_SHOP} className='text-white/40 hover:text-[#F0D77C] transition-colors text-sm'>Continue Shopping</Link>
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default CartPage
