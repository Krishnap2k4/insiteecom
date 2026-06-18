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
import { WEBSITE_LOGIN } from '@/routes/WebsiteRoute'
import axios from '@/lib/apiClient'
import { showToast } from '@/lib/showToast'
import AuthBrand from '@/components/Application/Website/AuthBrand'
const RegisterPage = () => {
    const [loading, setLoading] = useState(false)
    const [isTypePassword, setIsTypePassword] = useState(true)
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

            form.reset()
            showToast('success', registerResponse.message)

        } catch (error) {
            showToast('error', error.message)
        } finally {
            setLoading(false)
        }
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