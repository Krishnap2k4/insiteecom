'use client'
import { Card, CardContent } from '@/components/ui/card'
import React, { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { zodResolver } from "@hookform/resolvers/zod"
import { zSchema } from '@/lib/zodSchema'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useForm } from 'react-hook-form'
import ButtonLoading from '@/components/Application/ButtonLoading'

import Link from 'next/link'
import { WEBSITE_LOGIN, } from '@/routes/WebsiteRoute'
import axios from '@/lib/apiClient'
import { showToast } from '@/lib/showToast'
import OTPVerification from '@/components/Application/OTPVerification'
import UpdatePassword from '@/components/Application/UpdatePassword'
const ResetPassword = () => {
    const [emailVerificationLoading, setEmailVerificationLoading] = useState(false)
    const [otpVerificationLoading, setOtpVerificationLoading] = useState(false)
    const [otpEmail, setOtpEmail] = useState()
    const [isOtpVerified, setIsOtpVerified] = useState(false)
    const formSchema = zSchema.pick({
        email: true
    })

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: ""
        }
    })

    const handleEmailVerification = async (values) => {
        try {
            setEmailVerificationLoading(true)
            const { data: sendOtpResponse } = await axios.post('/api/auth/reset-password/send-otp', values)
            if (!sendOtpResponse.success) {
                throw new Error(sendOtpResponse.message)
            }
            setOtpEmail(values.email)
            showToast('success', sendOtpResponse.message)

        } catch (error) {
            showToast('error', error.message)
        } finally {
            setEmailVerificationLoading(false)
        }
    }


    // otp verification  
    const handleOtpVerification = async (values) => {
        try {
            setOtpVerificationLoading(true)
            const { data: otpResponse } = await axios.post('/api/auth/reset-password/verify-otp', values)
            if (!otpResponse.success) {
                throw new Error(otpResponse.message)
            }
            showToast('success', otpResponse.message)
            setIsOtpVerified(true)
        } catch (error) {
            showToast('error', error.message)
        } finally {
            setOtpVerificationLoading(false)
        }
    }

    return (
        <Card className="w-[400px] shadow-2xl shadow-[#C9A24B]/10">
            <CardContent className="pt-8">
                <div className='flex justify-center mb-6'>
                    <div className='font-serif-display gold-shine text-4xl tracking-widest'>ELOIR</div>
                </div>

                {!otpEmail
                    ?
                    <>
                        <div className='text-center'>
                            <h1 className='text-2xl font-serif-display text-white mb-2'>Reset Password</h1>
                            <p className='text-white/60 text-sm'>Enter your email for password reset.</p>
                        </div>
                        <div className='mt-5'>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(handleEmailVerification)} >
                                    <div className='mb-5'>
                                        <FormField
                                            control={form.control}
                                            name="email"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Email</FormLabel>
                                                    <FormControl>
                                                        <Input type="email" placeholder="example@gmail.com" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div className='mb-6 mt-6'>
                                        <button disabled={emailVerificationLoading} type="submit" className="btn-dark-gold w-full py-3 uppercase tracking-widest text-xs font-semibold cursor-pointer disabled:opacity-50">
                                            {emailVerificationLoading ? 'Sending OTP...' : 'Send OTP'}
                                        </button>
                                    </div>
                                    <div className='text-center text-sm text-white/60'>
                                        <div className='flex justify-center items-center gap-2'>
                                            <Link href={WEBSITE_LOGIN} className='text-[#C9A24B] hover:text-[#F0D77C] hover:underline transition-colors'>Back To Sign In</Link>
                                        </div>
                                    </div>
                                </form>
                            </Form>
                        </div>
                    </>
                    :
                    <>
                        {!isOtpVerified
                            ?
                            <OTPVerification email={otpEmail} onSubmit={handleOtpVerification} loading={otpVerificationLoading} />
                            :
                            <UpdatePassword email={otpEmail} />
                        }
                    </>
                }
            </CardContent>
        </Card>
    )
}

export default ResetPassword