import WebsiteBreadcrumb from '@/components/Application/Website/WebsiteBreadcrumb'
import React from 'react'

export const metadata = {
    title: 'Cancellation Policy',
    description: 'How to cancel an order, eligibility conditions, and refund timelines for cancelled orders.',
}

const breadcrumb = {
    title: 'Cancellation Policy',
    links: [{ label: 'Cancellation Policy' }],
}

const CancellationPolicy = () => {
    return (
        <div>
            <WebsiteBreadcrumb props={breadcrumb} />
            <div className='lg:px-40 px-5 py-20 text-white/70'>
                <h1 className='text-3xl font-serif-display text-[#F0D77C] mb-2'>Cancellation Policy</h1>
                <p className='text-white/40 text-xs mb-6'>Last Updated: June 2025</p>

                <p>At ELOIR, we understand that plans may change. Please review our cancellation policy below. By placing an order on our website, you agree to the terms outlined in this policy.</p>

                {/* 1. Order Cancellation */}
                <p className='mt-8'><b className='text-white'>1. Order Cancellation</b></p>
                <p className='mt-3'>Customers may request cancellation of an order before it has been processed or shipped.</p>
                <p className='mt-3'>Once an order has been dispatched, shipped, or handed over to the courier partner, cancellation requests cannot be accepted.</p>

                {/* 2. How to Cancel an Order */}
                <p className='mt-8'><b className='text-white'>2. How to Cancel an Order</b></p>
                <p className='mt-3'>To cancel your order, please contact us as soon as possible with:</p>
                <ul className='list-disc ps-10 mt-3 space-y-2'>
                    <li>Order Number</li>
                    <li>Full Name</li>
                    <li>Registered Phone Number</li>
                </ul>
                <p className='mt-4'>You may contact us through:</p>
                <div className='mt-3 space-y-1'>
                    <p>Email: <a href='mailto:eloir.perfumes@gmail.com' className='text-[#F0D77C] hover:text-[#E5C76B] transition-colors'>eloir.perfumes@gmail.com</a></p>
                    <p>Phone / WhatsApp: <a href='https://wa.me/918007900071' target='_blank' rel='noopener noreferrer' className='text-[#F0D77C] hover:text-[#E5C76B] transition-colors'>+91 8007900071</a></p>
                    <p>Instagram: <a href='https://www.instagram.com/eloir.perfumes' target='_blank' rel='noopener noreferrer' className='text-[#F0D77C] hover:text-[#E5C76B] transition-colors'>@eloir.perfumes</a></p>
                </div>

                {/* 3. Refund for Cancelled Orders */}
                <p className='mt-8'><b className='text-white'>3. Refund for Cancelled Orders</b></p>
                <p className='mt-3'>If an order is successfully cancelled before shipment, a full refund will be issued to the original payment method.</p>
                <p className='mt-3'>Refunds are typically processed within <b className='text-white/90'>5–10 business days</b>, depending on your payment provider or bank. ELOIR is not responsible for delays caused by financial institutions.</p>

                {/* 4. Orders Not Eligible for Cancellation */}
                <p className='mt-8'><b className='text-white'>4. Orders Not Eligible for Cancellation</b></p>
                <p className='mt-3'>Orders cannot be cancelled if:</p>
                <ul className='list-disc ps-10 mt-3 space-y-2'>
                    <li>The order has already been shipped.</li>
                    <li>The order is out for delivery.</li>
                    <li>The order has been delivered.</li>
                    <li>Incorrect information was provided by the customer after dispatch.</li>
                </ul>

                {/* 5. ELOIR's Right to Cancel */}
                <p className='mt-8'><b className='text-white'>5. ELOIR&apos;s Right to Cancel</b></p>
                <p className='mt-3'>ELOIR reserves the right to cancel any order due to:</p>
                <ul className='list-disc ps-10 mt-3 space-y-2'>
                    <li>Product unavailability</li>
                    <li>Pricing or technical errors</li>
                    <li>Suspected fraudulent activity</li>
                    <li>Incomplete or incorrect customer information</li>
                </ul>
                <p className='mt-3'>In such cases, customers will receive a full refund to their original payment method within 5–10 business days.</p>

                {/* 6. Consumer Rights */}
                <p className='mt-8'><b className='text-white'>6. Consumer Rights</b></p>
                <p className='mt-3'>Nothing in this policy limits your statutory rights under the <b className='text-white/90'>Consumer Protection Act, 2019</b> or any other applicable Indian law. Consumers retain the right to approach the appropriate consumer forum for unresolved grievances.</p>

                {/* 7. Contact Us */}
                <p className='mt-8'><b className='text-white'>7. Contact Us</b></p>
                <p className='mt-3'>For cancellation-related inquiries, please contact us. We will do our best to resolve all genuine concerns quickly and fairly.</p>
                <div className='mt-3 space-y-1'>
                    <p><b className='text-white/90'>ELOIR Perfumes</b></p>
                    <p>Email: <a href='mailto:eloir.perfumes@gmail.com' className='text-[#F0D77C] hover:text-[#E5C76B] transition-colors'>eloir.perfumes@gmail.com</a></p>
                    <p>Phone / WhatsApp: <a href='https://wa.me/918007900071' target='_blank' rel='noopener noreferrer' className='text-[#F0D77C] hover:text-[#E5C76B] transition-colors'>+91 8007900071</a></p>
                    <p>Instagram: <a href='https://www.instagram.com/eloir.perfumes' target='_blank' rel='noopener noreferrer' className='text-[#F0D77C] hover:text-[#E5C76B] transition-colors'>@eloir.perfumes</a></p>
                </div>
            </div>
        </div>
    )
}

export default CancellationPolicy
