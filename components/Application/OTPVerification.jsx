import { zSchema } from '@/lib/zodSchema'
import { zodResolver } from '@hookform/resolvers/zod'
import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import ButtonLoading from './ButtonLoading'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '../ui/input-otp'
import { showToast } from '@/lib/showToast'
import axios from '@/lib/apiClient'

const OTPVerification = ({ email, onSubmit, loading }) => {

    const [isResendingOtp, setIsResendingOtp] = useState(false)

    const formSchema = zSchema.pick({
        otp: true, email: true
    })

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            otp: "",
            email: email
        }
    })

    const handleOtpVerification = async (values) => {
        onSubmit(values)
    }

    const resendOTP = async () => {
        try {
            setIsResendingOtp(true)
            const { data: resendOtpResponse } = await axios.post('/api/auth/resend-otp',
                { email }
            )
            if (!resendOtpResponse.success) {
                throw new Error(resendOtpResponse.message)
            }
            showToast('success', resendOtpResponse.message)
        } catch (error) {
            showToast('error', error.message)
        } finally {
            setIsResendingOtp(false)
        }
    }

    return (
        <div>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(handleOtpVerification)} >
                    <div className='text-center' >
                        <h1 className='text-2xl font-serif-display text-white mb-2'>Verification Required</h1>
                        <p className='text-white/60 text-sm max-w-sm mx-auto'>We have sent a One-time Password (OTP) to your registered email address. Valid for 10 minutes.</p>
                    </div>
                    <div className='mb-6 mt-8 flex justify-center'>
                        <FormField
                            control={form.control}
                            name="otp"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-white/80 sr-only">One-time Password (OTP)</FormLabel>
                                    <FormControl>
                                        <InputOTP maxLength={6} {...field}>
                                            <InputOTPGroup>
                                                <InputOTPSlot className="text-xl size-12 bg-black/40 border-[#C9A24B]/30 text-[#F0D77C] focus:ring-[#C9A24B]/50 transition-all font-serif-display" index={0} />
                                                <InputOTPSlot className="text-xl size-12 bg-black/40 border-[#C9A24B]/30 text-[#F0D77C] focus:ring-[#C9A24B]/50 transition-all font-serif-display" index={1} />
                                                <InputOTPSlot className="text-xl size-12 bg-black/40 border-[#C9A24B]/30 text-[#F0D77C] focus:ring-[#C9A24B]/50 transition-all font-serif-display" index={2} />
                                                <InputOTPSlot className="text-xl size-12 bg-black/40 border-[#C9A24B]/30 text-[#F0D77C] focus:ring-[#C9A24B]/50 transition-all font-serif-display" index={3} />
                                                <InputOTPSlot className="text-xl size-12 bg-black/40 border-[#C9A24B]/30 text-[#F0D77C] focus:ring-[#C9A24B]/50 transition-all font-serif-display" index={4} />
                                                <InputOTPSlot className="text-xl size-12 bg-black/40 border-[#C9A24B]/30 text-[#F0D77C] focus:ring-[#C9A24B]/50 transition-all font-serif-display" index={5} />
                                            </InputOTPGroup>
                                        </InputOTP>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <div className='mb-3'>
                        <button disabled={loading} type="submit" className="btn-dark-gold w-full py-3 uppercase tracking-widest text-xs font-semibold cursor-pointer disabled:opacity-50">
                            {loading ? 'Verifying...' : 'Verify Email'}
                        </button>
                        <div className='text-center mt-6 text-sm'>
                            {!isResendingOtp ?
                                <button onClick={resendOTP} type='button' className='text-[#C9A24B] hover:text-[#F0D77C] hover:underline transition-colors cursor-pointer'>Resend OTP</button>
                                :
                                <span className='text-white/50'>Resending...</span>
                            }

                        </div>
                    </div>

                </form>
            </Form>
        </div>
    )
}

export default OTPVerification