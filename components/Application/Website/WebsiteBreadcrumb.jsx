import { WEBSITE_HOME } from '@/routes/WebsiteRoute'
import Link from 'next/link'
import React from 'react'

const WebsiteBreadcrumb = ({ props }) => {
    return (
        <div className="pt-[130px] pb-14 flex justify-center items-center bg-gradient-to-r from-[#0a0805] via-[#15110a] to-[#0a0805] relative overflow-hidden border-b border-[#C9A24B]/10">
            <div className="absolute inset-0 dot-pattern opacity-30"></div>
            <div className="relative z-10 text-center">
                <h1 className='text-3xl font-serif-display gold-text tracking-wide mb-3'>{props.title}</h1>
                <ul className='flex gap-2 justify-center text-sm'>
                    <li><Link href={WEBSITE_HOME} className='text-white/50 hover:text-[#F0D77C] transition-colors'>Home</Link></li>

                    {props.links.map((item, index) => (
                        <li key={index} className='text-white/30'>
                            <span className='me-2'>/</span>
                            {item.href ?
                                <Link href={item.href} className='text-white/50 hover:text-[#F0D77C] transition-colors'>{item.label}</Link>
                                :
                                <span className='text-[#C9A24B]'>{item.label}</span>
                            }
                        </li>
                    ))}

                </ul>
            </div>
        </div>
    )
}

export default WebsiteBreadcrumb