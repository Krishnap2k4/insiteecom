import React from 'react'

const layout = ({ children }) => {
    return (
        <div className='storefront min-h-screen w-full flex justify-center items-center bg-gradient-to-br from-[#0e0e0e] via-[#15110a] to-[#0e0e0e] relative overflow-hidden'>
            <div className='absolute top-1/4 -left-20 w-80 h-80 bg-[#C9A24B]/25 rounded-full blur-3xl animate-glow'></div>
            <div className='absolute bottom-1/4 -right-20 w-96 h-96 bg-[#F0D77C]/15 rounded-full blur-3xl animate-glow' style={{ animationDelay: '2s' }}></div>
            <div className='relative z-10 w-full flex justify-center items-center px-4'>
                {children}
            </div>
        </div>
    )
}

export default layout