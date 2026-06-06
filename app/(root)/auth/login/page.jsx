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
import { z } from 'zod'
import Link from 'next/link'
import { USER_DASHBOARD, WEBSITE_REGISTER, WEBSITE_RESETPASSWORD } from '@/routes/WebsiteRoute'
import axios from '@/lib/apiClient'
import { showToast } from '@/lib/showToast'
import OTPVerification from '@/components/Application/OTPVerification'
import { useDispatch } from 'react-redux'
import { login } from '@/store/reducer/authReducer'
import { useRouter, useSearchParams } from 'next/navigation'
import { ADMIN_DASHBOARD } from '@/routes/AdminPanelRoute'
const LoginPage = () => {
    const dispatch = useDispatch()
    const searchParams = useSearchParams()
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [otpVerificationLoading, setOtpVerificationLoading] = useState(false)
    const [isTypePassword, setIsTypePassword] = useState(true)
    const [otpEmail, setOtpEmail] = useState()
    const formSchema = zSchema.pick({
        email: true
    }).extend({
        password: z.string().min('3', 'Password field is required.')
    })

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    })

    const handleLoginSubmit = async (values) => {
        try {
            setLoading(true)
            const { data: loginResponse } = await axios.post('/api/auth/login', values)
            if (!loginResponse.success) {
                throw new Error(loginResponse.message)
            }

            setOtpEmail(values.email)
            form.reset()
            showToast('success', loginResponse.message)
        } catch (error) {
            showToast('error', error.message)
        } finally {
            setLoading(false)
        }
    }


    // otp verification  
    const handleOtpVerification = async (values) => {
        try {
            setOtpVerificationLoading(true)
            const { data: otpResponse } = await axios.post('/api/auth/verify-otp', values)
            if (!otpResponse.success) {
                throw new Error(otpResponse.message)
            }
            setOtpEmail('')
            showToast('success', otpResponse.message)

            dispatch(login(otpResponse.data))

            if (searchParams.has('callback')) {
                router.push(searchParams.get('callback'))
            } else {
                otpResponse.data.role === 'admin' ? router.push(ADMIN_DASHBOARD) : router.push(USER_DASHBOARD)
            }

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
                            <h1 className='text-2xl font-serif-display text-white mb-2'>Sign In</h1>
                            <p className='text-white/60 text-sm'>Enter your credentials to access your account.</p>
                        </div>
                        <div className='mt-5'>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(handleLoginSubmit)} >
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
                                    <div className='mb-5'>
                                        <FormField
                                            control={form.control}
                                            name="password"
                                            render={({ field }) => (
                                                <FormItem className="relative">
                                                    <FormLabel>Password</FormLabel>
                                                    <FormControl>
                                                        <Input type={isTypePassword ? 'password' : 'text'} placeholder="••••••••" className="pr-10" {...field} />
                                                    </FormControl>
                                                    <button className='absolute top-[34px] right-3 cursor-pointer text-white/50 hover:text-[#F0D77C] transition-colors' type='button' onClick={() => setIsTypePassword(!isTypePassword)}>
                                                        {isTypePassword ?
                                                            <EyeOff size={16} />
                                                            :
                                                            <Eye size={16} />
                                                        }
                                                    </button>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <div className='mb-6 mt-6'>
                                        <button disabled={loading} type="submit" className="btn-dark-gold w-full py-3 uppercase tracking-widest text-xs font-semibold cursor-pointer disabled:opacity-50">
                                            {loading ? 'Authenticating...' : 'Sign In'}
                                        </button>
                                    </div>
                                    <div className='text-center text-sm text-white/60'>
                                        <div className='flex justify-center items-center gap-2'>
                                            <p>New to ELOIR?</p>
                                            <Link href={WEBSITE_REGISTER} className='text-[#C9A24B] hover:text-[#F0D77C] hover:underline transition-colors'>Create an account</Link>
                                        </div>
                                        <div className='mt-4'>
                                            <Link href={WEBSITE_RESETPASSWORD} className='text-white/40 hover:text-white/80 transition-colors'>Forgot your password?</Link>
                                        </div>
                                    </div>
                                </form>
                            </Form>
                        </div>
                    </>
                    :
                    <OTPVerification email={otpEmail} onSubmit={handleOtpVerification} loading={otpVerificationLoading} />
                }


            </CardContent>
        </Card>
    )
}

export default LoginPage