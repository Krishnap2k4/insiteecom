'use client'
import { Card, CardContent } from '@/components/ui/card'
import axios from '@/lib/apiClient'
import { use, useEffect, useState } from 'react'
import verifiedImg from "@/public/assets/images/verified.gif"
import verificationFailedImg from "@/public/assets/images/verification-failed.gif"
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { WEBSITE_HOME } from '@/routes/WebsiteRoute'
const EmailVerification = ({ params }) => {
    const { token } = use(params)
    const [isVerified, setIsVerified] = useState(false)
    useEffect(() => {
        const verify = async () => {
            const { data: verificationResponse } = await axios.post('/api/auth/verify-email', { token })
            if (verificationResponse.success) {
                setIsVerified(true)
            }
        }

        verify()
    }, [token])
    return (
        <Card className="w-[400px] shadow-2xl shadow-[#C9A24B]/10">
            <CardContent className="pt-8">
                {isVerified ?
                    <div >
                        <div className='flex justify-center items-center'>
                            <Image src={verifiedImg.src} height={verifiedImg.height} width={verifiedImg.width} className='h-[100px] w-auto' alt='Verification success' />
                        </div>
                        <div className='text-center'>
                            <h1 className='text-2xl font-serif-display text-white mt-6 mb-4'>Verification Success!</h1>
                            <p className='text-white/60 text-sm mb-8'>Your email has been successfully verified.</p>
                            <Button asChild className="btn-dark-gold w-full py-6 uppercase tracking-widest text-xs font-semibold rounded-none h-auto">
                                <Link href={WEBSITE_HOME}>Continue Shopping</Link>
                            </Button>
                        </div>
                    </div>
                    :
                    <div >
                        <div className='flex justify-center items-center'>
                            <Image src={verificationFailedImg.src} height={verificationFailedImg.height} width={verificationFailedImg.width} className='h-[100px] w-auto' alt='Verification Failed' />
                        </div>
                        <div className='text-center'>
                            <h1 className='text-2xl font-serif-display text-red-400 mt-6 mb-4'>Verification Failed</h1>
                            <p className='text-white/60 text-sm mb-8'>The verification link is invalid or has expired.</p>
                            <Button asChild className="btn-dark-gold w-full py-6 uppercase tracking-widest text-xs font-semibold rounded-none h-auto">
                                <Link href={WEBSITE_HOME}>Continue Shopping</Link>
                            </Button>
                        </div>
                    </div>
                }
            </CardContent>
        </Card>
    )
}

export default EmailVerification