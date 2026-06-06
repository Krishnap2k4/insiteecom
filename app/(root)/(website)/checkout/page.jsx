'use client'
import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import Script from 'next/script'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import ButtonLoading from '@/components/Application/ButtonLoading'
import WebsiteBreadcrumb from '@/components/Application/Website/WebsiteBreadcrumb'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import axios from '@/lib/apiClient'
import useFetch from '@/hooks/useFetch'
import { showToast } from '@/lib/showToast'
import { zSchema } from '@/lib/zodSchema'
import { fetchCart, applyCartCoupon } from '@/store/reducer/cartReducer'
import {
    WEBSITE_ORDER_DETAILS,
    WEBSITE_PRODUCT_DETAILS,
    WEBSITE_SHOP,
    WEBSITE_LOGIN,
} from '@/routes/WebsiteRoute'
import { IoCloseCircleSharp } from 'react-icons/io5'
import { FaShippingFast } from 'react-icons/fa'
import { FiPlus, FiCreditCard, FiDollarSign } from 'react-icons/fi'
import loading from '@/public/assets/images/loading.svg'

const breadCrumb = { title: 'Checkout', links: [{ label: 'Checkout' }] }

/**
 * Payment-method radio block. Razorpay covers cards / UPI / netbanking
 * via the gateway popup; COD records the order with paymentStatus
 * 'pending' so the admin can mark cash collected on delivery.
 */
const PaymentMethodPicker = ({ value, onChange }) => {
    const options = [
        {
            key: 'razorpay',
            Icon: FiCreditCard,
            title: 'Pay online',
            sub: 'Cards, UPI, netbanking (secured by Razorpay)',
        },
        {
            key: 'cod',
            Icon: FiDollarSign,
            title: 'Cash on delivery',
            sub: 'Pay with cash when the order is delivered',
        },
    ]
    return (
        <div>
            <p className='font-semibold mb-2 text-white/90'>Payment method</p>
            <div className='space-y-2'>
                {options.map(({ key, Icon, title, sub }) => {
                    const active = value === key
                    return (
                        <label
                            key={key}
                            className={`flex items-center gap-3 p-3 border cursor-pointer transition ${active ? 'border-[#C9A24B] bg-[#C9A24B]/10' : 'border-[#C9A24B]/20 hover:border-[#C9A24B]/40'}`}
                        >
                            <input
                                type='radio'
                                name='payment-method'
                                value={key}
                                checked={active}
                                onChange={() => onChange(key)}
                                className='accent-[#C9A24B]'
                            />
                            <Icon size={20} className='text-white/50 shrink-0' />
                            <div className='min-w-0'>
                                <p className='font-medium text-sm text-white'>{title}</p>
                                <p className='text-xs text-white/40'>{sub}</p>
                            </div>
                        </label>
                    )
                })}
            </div>
        </div>
    )
}

const Checkout = () => {
    const router = useRouter()
    const dispatch = useDispatch()
    const cart = useSelector((s) => s.cartStore)
    const auth = useSelector((s) => s.authStore?.auth)
    const isLoggedIn = Boolean(auth?._id)

    const [placingOrder, setPlacingOrder] = useState(false)
    const [savingOrder, setSavingOrder] = useState(false)

    const [selectedAddressId, setSelectedAddressId] = useState(null)
    const [showInlineForm, setShowInlineForm] = useState(false)
    const [savedAddrNote, setSavedAddrNote] = useState('')

    const [paymentMethod, setPaymentMethod] = useState('razorpay')

    const [couponDiscountAmount, setCouponDiscountAmount] = useState(0)
    const [couponLoading, setCouponLoading] = useState(false)
    const [couponCode, setCouponCode] = useState('')
    const isCouponApplied = couponDiscountAmount > 0

    const { data: addressData } = useFetch(isLoggedIn ? '/api/account/addresses' : null)
    const addresses = useMemo(() => addressData?.data || [], [addressData])

    useEffect(() => {
        if (!selectedAddressId && addresses.length > 0) {
            const def = addresses.find((a) => a.isDefault) || addresses[0]
            setSelectedAddressId(def?._id || null)
        }
    }, [addresses, selectedAddressId])

    const subtotal = Number(cart.subtotal || 0)
    const discount = Number(cart.discount || 0)
    const totalAmount = Math.max(0, subtotal - couponDiscountAmount)
    const hasUnavailable = cart.products.some((p) => p.unavailable)

    // ---- Coupon form ----
    const couponFormSchema = zSchema.pick({ code: true, minShoppingAmount: true })
    const couponForm = useForm({
        resolver: zodResolver(couponFormSchema),
        defaultValues: { code: '', minShoppingAmount: subtotal },
    })
    useEffect(() => couponForm.setValue('minShoppingAmount', subtotal), [subtotal, couponForm])

    const applyCoupon = async (values) => {
        setCouponLoading(true)
        try {
            // /api/coupon/apply is server-authoritative — it reads the
            // live cart and returns the exact discountAmount we should
            // charge against, accounting for scope, caps, and per-user
            // limits. The client never recomputes.
            const { data: res } = await axios.post('/api/coupon/apply', { code: values.code })
            if (!res?.success) throw new Error(res?.message || 'Could not apply coupon.')
            const code = couponForm.getValues('code')
            setCouponDiscountAmount(res.data.discountAmount || 0)
            setCouponCode(code)
            await dispatch(applyCartCoupon({ code }))
            showToast('success', res.message)
            couponForm.resetField('code', '')
        } catch (err) {
            showToast('error', err.message)
        } finally {
            setCouponLoading(false)
        }
    }
    const removeCoupon = async () => {
        setCouponCode('')
        setCouponDiscountAmount(0)
        await dispatch(applyCartCoupon({ code: null }))
    }

    // ---- Inline address form (guest path or new-address) ----
    const inlineSchema = z.object({
        fullName: z.string().trim().min(2),
        email: z.string().email(),
        phone: z.string().trim().min(7),
        line1: z.string().trim().min(3),
        line2: z.string().trim().optional().default(''),
        landmark: z.string().trim().optional().default(''),
        city: z.string().trim().min(2),
        state: z.string().trim().min(2),
        country: z.string().trim().min(2),
        pincode: z.string().trim().min(3),
        customerNote: z.string().optional().default(''),
    })
    const orderForm = useForm({
        resolver: zodResolver(inlineSchema),
        defaultValues: {
            fullName: auth?.name || '',
            email: auth?.email || '',
            phone: '',
            line1: '', line2: '', landmark: '',
            city: '', state: '', country: '', pincode: '',
            customerNote: '',
        },
    })

    useEffect(() => {
        if (auth) {
            orderForm.setValue('fullName', auth.name || '')
            orderForm.setValue('email', auth.email || '')
        }
    }, [auth, orderForm])

    const getOrderId = async () => {
        const { data: res } = await axios.post('/api/payment/get-order-id', {
            couponCode: isCouponApplied ? couponCode : null,
            couponDiscountAmount,
        })
        if (!res?.success) throw new Error(res?.message || 'Could not init payment.')
        return res.data
    }

    const submitOrder = async (formData) => {
        if (cart.count === 0) return showToast('error', 'Your cart is empty.')
        if (hasUnavailable) return showToast('error', 'Remove unavailable items before checking out.')

        const useSavedAddress = isLoggedIn && selectedAddressId && !showInlineForm
        let email = auth?.email
        let prefill = { name: auth?.name || '', email, contact: '' }
        let savePayloadAddr = {}

        if (useSavedAddress) {
            const addr = addresses.find((a) => a._id === selectedAddressId)
            if (!addr) return showToast('error', 'Pick a shipping address.')
            prefill = { name: addr.fullName || prefill.name, email, contact: addr.phone || '' }
            savePayloadAddr = { addressId: selectedAddressId }
        } else {
            email = formData.email
            prefill = { name: formData.fullName, email, contact: formData.phone }
            savePayloadAddr = {
                shippingAddress: {
                    fullName: formData.fullName,
                    phone: formData.phone,
                    line1: formData.line1,
                    line2: formData.line2 || '',
                    landmark: formData.landmark || '',
                    city: formData.city,
                    state: formData.state,
                    country: formData.country,
                    pincode: formData.pincode,
                },
            }
        }

        const basePayload = {
            email,
            customerNote: formData.customerNote || '',
            couponCode: isCouponApplied ? couponCode : null,
            couponDiscountAmount,
            ...savePayloadAddr,
        }

        if (paymentMethod === 'cod') {
            setPlacingOrder(true)
            setSavingOrder(true)
            try {
                const { data: saved } = await axios.post('/api/payment/save-order', {
                    ...basePayload,
                    paymentMethod: 'cod',
                })
                if (!saved?.success) throw new Error(saved?.message || 'Could not place order.')
                showToast('success', saved.message)
                await dispatch(fetchCart())
                router.push(WEBSITE_ORDER_DETAILS(saved.data.orderNumber))
            } catch (err) {
                showToast('error', err.message)
            } finally {
                setSavingOrder(false)
                setPlacingOrder(false)
            }
            return
        }

        setPlacingOrder(true)
        try {
            const { order_id: rzOrderId, amount } = await getOrderId()

            const razOption = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                amount: Math.round(amount * 100),
                currency: 'INR',
                name: process.env.NEXT_PUBLIC_BRAND_NAME || 'ELOIR',
                description: 'Payment for order',
                image: 'https://res.cloudinary.com/dg7efdu9o/image/upload/v1750052410/logo-black_mb1rve.webp',
                order_id: rzOrderId,
                handler: async (response) => {
                    setSavingOrder(true)
                    try {
                        const { data: saved } = await axios.post('/api/payment/save-order', {
                            ...basePayload,
                            paymentMethod: 'razorpay',
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_signature: response.razorpay_signature,
                        })
                        if (!saved?.success) throw new Error(saved?.message || 'Could not save order.')
                        showToast('success', saved.message)
                        await dispatch(fetchCart())
                        router.push(WEBSITE_ORDER_DETAILS(saved.data.orderNumber))
                    } catch (err) {
                        showToast('error', err.message)
                    } finally {
                        setSavingOrder(false)
                    }
                },
                prefill,
                theme: { color: '#C9A24B' },
            }

            const rzp = new Razorpay(razOption)
            rzp.on('payment.failed', (resp) => showToast('error', resp.error?.description || 'Payment failed.'))
            rzp.open()
        } catch (err) {
            showToast('error', err.message)
        } finally {
            setPlacingOrder(false)
        }
    }

    return (
        <div>
            {savingOrder && (
                <div className='h-screen w-screen fixed top-0 left-0 z-50 bg-black/60 backdrop-blur-sm'>
                    <div className='h-screen flex flex-col gap-4 justify-center items-center'>
                        <Image src={loading.src} height={80} width={80} alt='Loading' />
                        <h4 className='font-semibold text-[#F0D77C]'>Confirming your order…</h4>
                    </div>
                </div>
            )}

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
                    <div className='lg:w-[60%] w-full space-y-6'>
                        <div>
                            <div className='flex font-semibold gap-2 items-center text-[#F0D77C]'>
                                <FaShippingFast size={22} /> Shipping Address
                            </div>

                            {isLoggedIn && addresses.length > 0 && !showInlineForm && (
                                <div className='mt-4 space-y-3'>
                                    {addresses.map((addr) => {
                                        const active = addr._id === selectedAddressId
                                        return (
                                            <button
                                                key={addr._id}
                                                type='button'
                                                onClick={() => setSelectedAddressId(addr._id)}
                                                className={`w-full text-left p-4 border transition ${active ? 'border-[#C9A24B] bg-[#C9A24B]/10' : 'border-[#C9A24B]/20 hover:border-[#C9A24B]/40'}`}
                                            >
                                                <div className='flex justify-between items-start gap-3'>
                                                    <div className='min-w-0'>
                                                        <p className='font-medium text-white'>
                                                            {addr.label} · {addr.fullName || '—'}
                                                        </p>
                                                        <p className='text-sm text-white/50 mt-0.5'>
                                                            {[addr.line1, addr.line2, addr.landmark].filter(Boolean).join(', ')}
                                                        </p>
                                                        <p className='text-sm text-white/50'>
                                                            {addr.city}, {addr.state} {addr.pincode}, {addr.country}
                                                        </p>
                                                        <p className='text-sm text-white/40 mt-0.5'>{addr.phone}</p>
                                                    </div>
                                                    {addr.isDefault && (
                                                        <span className='text-xs px-2 py-0.5 bg-[#C9A24B]/20 text-[#F0D77C]'>
                                                            Default
                                                        </span>
                                                    )}
                                                </div>
                                            </button>
                                        )
                                    })}
                                    <button
                                        type='button'
                                        onClick={() => setShowInlineForm(true)}
                                        className='inline-flex items-center gap-1 text-sm text-[#C9A24B] hover:text-[#F0D77C] transition-colors'
                                    >
                                        <FiPlus /> Use a different address
                                    </button>
                                </div>
                            )}

                            {(!isLoggedIn || showInlineForm || addresses.length === 0) && (
                                <div className='mt-4'>
                                    {!isLoggedIn && (
                                        <div className='mb-4 text-sm bg-[#C9A24B]/10 border border-[#C9A24B]/30 text-white/80 p-3'>
                                            Have an account? <Link href={WEBSITE_LOGIN} className='text-[#F0D77C] underline'>Log in</Link> to use a saved address and access your order history.
                                        </div>
                                    )}
                                    {isLoggedIn && addresses.length > 0 && (
                                        <button
                                            type='button'
                                            onClick={() => setShowInlineForm(false)}
                                            className='mb-2 text-sm text-[#C9A24B] hover:text-[#F0D77C] transition-colors'
                                        >
                                            ← Use a saved address
                                        </button>
                                    )}
                                    <Form {...orderForm}>
                                        <form className='grid grid-cols-2 gap-4' onSubmit={orderForm.handleSubmit(submitOrder)}>
                                            {[
                                                ['fullName', 'Full name*'],
                                                ['email', 'Email*'],
                                                ['phone', 'Phone*'],
                                                ['line1', 'Address line 1*'],
                                                ['line2', 'Address line 2'],
                                                ['landmark', 'Landmark'],
                                                ['city', 'City*'],
                                                ['state', 'State*'],
                                                ['country', 'Country*'],
                                                ['pincode', 'Pincode*'],
                                            ].map(([key, ph]) => (
                                                <div key={key} className='mb-1'>
                                                    <FormField
                                                        control={orderForm.control}
                                                        name={key}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormControl>
                                                                    <Input placeholder={ph} {...field} />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>
                                            ))}
                                            <div className='mb-1 col-span-2'>
                                                <FormField
                                                    control={orderForm.control}
                                                    name='customerNote'
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormControl>
                                                                <Textarea placeholder='Order note (optional)' {...field} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                            <div className='mb-1 col-span-2'>
                                                <PaymentMethodPicker value={paymentMethod} onChange={setPaymentMethod} />
                                            </div>
                                            <div className='mb-1 col-span-2'>
                                                <ButtonLoading
                                                    type='submit'
                                                    text={paymentMethod === 'cod' ? 'Place order (Cash on delivery)' : 'Pay & place order'}
                                                    loading={placingOrder}
                                                    disabled={hasUnavailable}
                                                    className='btn-dark-gold px-5 py-2.5 uppercase tracking-widest text-xs font-semibold cursor-pointer disabled:opacity-50'
                                                />
                                            </div>
                                        </form>
                                    </Form>
                                </div>
                            )}

                            {isLoggedIn && !showInlineForm && addresses.length > 0 && (
                                <div className='mt-5 space-y-4'>
                                    <div>
                                        <Label className='mb-1.5 block text-sm'>Order note (optional)</Label>
                                        <Textarea
                                            value={savedAddrNote}
                                            onChange={(e) => setSavedAddrNote(e.target.value)}
                                            placeholder='Anything we should know about the delivery?'
                                        />
                                    </div>
                                    <PaymentMethodPicker value={paymentMethod} onChange={setPaymentMethod} />
                                    <ButtonLoading
                                        type='button'
                                        text={paymentMethod === 'cod' ? 'Place order (Cash on delivery)' : 'Pay & place order'}
                                        loading={placingOrder}
                                        disabled={hasUnavailable || !selectedAddressId}
                                        onClick={() => submitOrder({ customerNote: savedAddrNote })}
                                        className='btn-dark-gold px-5 py-2.5 uppercase tracking-widest text-xs font-semibold cursor-pointer disabled:opacity-50'
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className='lg:w-[40%] w-full'>
                        <div className='bg-[#0a0805] border border-[#C9A24B]/20 p-5 sticky top-5'>
                            <h4 className='text-lg font-serif-display text-[#F0D77C] mb-5'>Order Summary</h4>

                            <table className='w-full border border-[#C9A24B]/20'>
                                <tbody>
                                    {cart.products?.map((product) => (
                                        <tr key={product.variantId} className={product.unavailable ? 'opacity-60' : ''}>
                                            <td className='p-3'>
                                                <div className='flex items-center gap-4'>
                                                    <Image
                                                        src={product.media || '/assets/images/img-placeholder.webp'}
                                                        width={56}
                                                        height={56}
                                                        alt={product.name || ''}
                                                        className='rounded object-cover'
                                                    />
                                                    <div className='min-w-0'>
                                                        <h4 className='text-sm font-medium line-clamp-1'>
                                                            <Link href={WEBSITE_PRODUCT_DETAILS(product.slug, product.publicId)}>
                                                                {product.name || 'Item'}
                                                            </Link>
                                                        </h4>
                                                        {(product.optionValues || []).length > 0 && (
                                                            <p className='text-xs text-white/40'>
                                                                {product.optionValues.map((ov) => `${ov.name}: ${ov.value}`).join(' · ')}
                                                            </p>
                                                        )}
                                                        {product.unavailable && (
                                                            <p className='text-xs text-red-500 mt-0.5'>{product.unavailableReason}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className='p-3 text-right text-sm whitespace-nowrap'>
                                                {product.qty} × {Number(product.sellingPrice || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <table className='w-full mt-3'>
                                <tbody>
                                    <tr className='border-b border-[#C9A24B]/10'>
                                        <td className='font-medium py-1.5 text-white/70'>Subtotal</td>
                                        <td className='text-end py-1.5'>{subtotal.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</td>
                                    </tr>
                                    <tr className='border-b border-[#C9A24B]/10'>
                                        <td className='font-medium py-1.5 text-white/70'>Item discount</td>
                                        <td className='text-end py-1.5'>- {discount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</td>
                                    </tr>
                                    <tr className='border-b border-[#C9A24B]/10'>
                                        <td className='font-medium py-1.5 text-white/70'>Coupon</td>
                                        <td className='text-end py-1.5'>- {couponDiscountAmount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</td>
                                    </tr>
                                    <tr>
                                        <td className='font-semibold py-2 text-lg text-white'>Total</td>
                                        <td className='text-end py-2 text-lg font-semibold text-[#F0D77C]'>{totalAmount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</td>
                                    </tr>
                                </tbody>
                            </table>

                            <div className='mt-3 mb-5'>
                                {!isCouponApplied ? (
                                    <Form {...couponForm}>
                                        <form className='flex justify-between gap-3' onSubmit={couponForm.handleSubmit(applyCoupon)}>
                                            <div className='flex-1'>
                                                <FormField
                                                    control={couponForm.control}
                                                    name='code'
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormControl>
                                                                <Input placeholder='Coupon code' {...field} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                            <ButtonLoading type='submit' text='Apply' loading={couponLoading} />
                                        </form>
                                    </Form>
                                ) : (
                                    <div className='flex justify-between items-center py-1 px-4 bg-[#C9A24B]/10 border border-[#C9A24B]/30'>
                                        <div>
                                            <span className='text-xs'>Coupon:</span>
                                            <p className='text-sm font-semibold'>{couponCode}</p>
                                        </div>
                                        <button type='button' onClick={removeCoupon} className='text-red-500 cursor-pointer'>
                                            <IoCloseCircleSharp size={24} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <Script src='https://checkout.razorpay.com/v1/checkout.js' />
        </div>
    )
}

export default Checkout
