'use client'
import { Card, CardContent } from '@/components/ui/card'
import React, { useEffect, useState } from 'react'
import { Eye, EyeOff, MailCheck } from 'lucide-react'
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
import { useRouter } from 'next/navigation'
import { WEBSITE_LOGIN } from '@/routes/WebsiteRoute'
import axios from '@/lib/apiClient'
import { showToast } from '@/lib/showToast'
import AuthBrand from '@/components/Application/Website/AuthBrand'
const RegisterPage = () => {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [isTypePassword, setIsTypePassword] = useState(true)
    // After a successful register, show a "check your email" success
    // screen and auto-bounce to the login page after a few seconds so
    // the user has a clear next step.
    const [registeredEmail, setRegisteredEmail] = useState('')
    const formSchema = zSchema.pick({
        name: true, email: true, password: true
    }).extend({
        confirmPassword: z.string()
    }).refine((data) => data.password === data.confirmPassword, {
        message: 'Password and confirm password must be same.',
        path: ['confirmPassword']
    })

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            email: "",
            password: "",
            confirmPassword: "",
        },
    })

    const handleRegisterSubmit = async (values) => {
        try {
            setLoading(true)
            const { data: registerResponse } = await axios.post('/api/auth/register', values)
            if (!registerResponse.success) {
                throw new Error(registerResponse.message)
            }

            showToast('success', registerResponse.message)
            // Switch the page into success mode. The form is cleared,
            // a "check your email" panel shows, and a timer below
            // auto-redirects to the login page.
            setRegisteredEmail(values.email)
            form.reset()
        } catch (error) {
            showToast('error', error.message)
        } finally {
            setLoading(false)
        }
    }

    // Auto-redirect to the login page 4s after a successful registration.
    useEffect(() => {
        if (!registeredEmail) return
        const t = setTimeout(() => router.push(WEBSITE_LOGIN), 4000)
        return () => clearTimeout(t)
    }, [registeredEmail, router])

    if (registeredEmail) {
        return (
            <Card className="w-[400px] shadow-2xl shadow-[#C9A24B]/10">
                <CardContent className="pt-8 text-center">
                    <AuthBrand />
                    <div className='inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-[#C9A24B] to-[#F0D77C] shadow-xl shadow-[#C9A24B]/30 mb-4 mx-auto'>
                        <MailCheck size={28} className='text-[#1a1208]' />
                    </div>
                    <h1 className='text-2xl font-serif-display text-white mb-2'>Check your email</h1>
                    <p className='text-white/65 text-sm leading-relaxed'>
                        We&apos;ve sent a verification link to{' '}
                        <strong className='text-[#F0D77C] break-all'>{registeredEmail}</strong>.
                        Click the link in the email to verify your account, then sign in.
                    </p>
                    <Link
                        href={WEBSITE_LOGIN}
                        className='btn-dark-gold inline-block w-full text-center py-3 uppercase tracking-widest text-xs font-semibold mt-6'
                    >
                        Continue to sign in
                    </Link>
                    <p className='text-white/40 text-[11px] mt-4'>
                        Redirecting to sign in shortly…
                    </p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="w-[400px] shadow-2xl shadow-[#C9A24B]/10">
            <CardContent className="pt-8">
                <AuthBrand />
                <div className='text-center'>
                    <h1 className='text-2xl font-serif-display text-white mb-2'>Create Account</h1>
                    <p className='text-white/60 text-sm'>Enter your details to register.</p>
                </div>
                <div className='mt-5'>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleRegisterSubmit)} >
                            <div className='mb-5'>
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Full Name</FormLabel>
                                            <FormControl>
                                                <Input type="text" placeholder="John Doe" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
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
                                                <Input type="password" placeholder="••••••••" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className='mb-5'>
                                <FormField
                                    control={form.control}
                                    name="confirmPassword"
                                    render={({ field }) => (
                                        <FormItem className="relative">
                                            <FormLabel>Confirm Password</FormLabel>
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
                                    {loading ? 'Creating Account...' : 'Create Account'}
                                </button>
                            </div>
                            <div className='text-center text-sm text-white/60'>
                                <div className='flex justify-center items-center gap-2'>
                                    <p>Already have an account?</p>
                                    <Link href={WEBSITE_LOGIN} className='text-[#C9A24B] hover:text-[#F0D77C] hover:underline transition-colors'>Sign in</Link>
                                </div>
                            </div>
                        </form>
                    </Form>
                </div>
            </CardContent>
        </Card>
    )
}

export default RegisterPage