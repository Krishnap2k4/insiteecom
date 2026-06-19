import WebsiteBreadcrumb from '@/components/Application/Website/WebsiteBreadcrumb'
import React from 'react'

export const metadata = {
    title: 'Refund & Return Policy',
    description: 'Eligibility for returns, reporting damaged products, replacements, and refund processing timelines.',
}

const breadcrumb = {
    title: 'Refund & Return Policy',
    links: [{ label: 'Refund & Return Policy' }],
}

const RefundPolicy = () => {
    return (
        <div>
            <WebsiteBreadcrumb props={breadcrumb} />
            <div className='lg:px-40 px-5 py-20 text-white/70'>
                <h1 className='text-3xl font-serif-display text-[#F0D77C] mb-2'>Refund &amp; Return Policy</h1>
                <p className='text-white/40 text-xs mb-6'>Last Updated: June 2026</p>

                <p>At ELOIR, customer satisfaction is important to us. Due to the personal nature of fragrance products, we have established the following Refund &amp; Return Policy. By placing an order on our website, you agree to the terms outlined below.</p>

                {/* 1. Returns */}
                <p className='mt-8'><b className='text-white'>1. Returns</b></p>
                <p className='mt-3'>For hygiene and safety reasons, perfumes and fragrance products cannot be returned once opened, used, or tampered with.</p>
                <p className='mt-3'>Returns will only be accepted if:</p>
                <ul className='list-disc ps-10 mt-3 space-y-2'>
                    <li>The product is damaged during transit.</li>
                    <li>The wrong product was delivered.</li>
                    <li>The product is defective upon arrival.</li>
                </ul>

                {/* 2. Reporting an Issue */}
                <p className='mt-8'><b className='text-white'>2. Reporting an Issue</b></p>
                <p className='mt-3'>If you receive a damaged, defective, or incorrect product, please contact us within <b className='text-white/90'>48 hours of delivery</b>.</p>
                <p className='mt-3'>To process your request, please provide:</p>
                <ul className='list-disc ps-10 mt-3 space-y-2'>
                    <li>Order Number</li>
                    <li>Full Name</li>
                    <li>Clear photos/videos of the product and packaging</li>
                    <li>Description of the issue</li>
                </ul>
                <p className='mt-3'>Requests submitted after 48 hours may not be eligible for replacement or refund.</p>

                {/* 3. Replacement Policy */}
                <p className='mt-8'><b className='text-white'>3. Replacement Policy</b></p>
                <p className='mt-3'>After verification, eligible products may be replaced at no additional cost.</p>
                <p className='mt-3'>Replacement approval is subject to inspection of the provided evidence.</p>

                {/* 4. Refund Policy */}
                <p className='mt-8'><b className='text-white'>4. Refund Policy</b></p>
                <p className='mt-3'>Refunds will only be issued in the following situations:</p>
                <ul className='list-disc ps-10 mt-3 space-y-2'>
                    <li>Product is unavailable after payment.</li>
                    <li>Incorrect item delivered and replacement is unavailable.</li>
                    <li>Verified damaged product where replacement is unavailable.</li>
                    <li>Order cancelled before shipment.</li>
                </ul>
                <p className='mt-3'>Approved refunds will be processed to the original payment method.</p>

                {/* 5. Refund Processing Time */}
                <p className='mt-8'><b className='text-white'>5. Refund Processing Time</b></p>
                <p className='mt-3'>Once approved, refunds are generally processed within <b className='text-white/90'>5–10 business days</b>, depending on your bank, payment provider, or card issuer. ELOIR is not responsible for delays caused by financial institutions.</p>

                {/* 6. Non-Refundable Situations */}
                <p className='mt-8'><b className='text-white'>6. Non-Refundable Situations</b></p>
                <p className='mt-3'>Refunds or returns will not be provided for:</p>
                <ul className='list-disc ps-10 mt-3 space-y-2'>
                    <li>Change of mind after purchase.</li>
                    <li>Personal fragrance preference.</li>
                    <li>Allergic reactions due to individual sensitivities — customers are advised to perform a patch test before use.</li>
                    <li>Normal variations in fragrance performance, longevity, or projection.</li>
                    <li>Incorrect address provided by the customer.</li>
                    <li>Refusal to accept delivery.</li>
                </ul>

                {/* 7. Cancellation Policy */}
                <p className='mt-8'><b className='text-white'>7. Cancellation Policy</b></p>
                <p className='mt-3'>Orders may be cancelled before they are shipped. Once an order has been dispatched, cancellation requests cannot be accepted.</p>
                <p className='mt-3'>To request a cancellation, please contact us as soon as possible with your Order Number and registered email address.</p>

                {/* 8. Consumer Rights */}
                <p className='mt-8'><b className='text-white'>8. Consumer Rights</b></p>
                <p className='mt-3'>Nothing in this policy limits your statutory rights under the <b className='text-white/90'>Consumer Protection Act, 2019</b> or any other applicable Indian law. If you believe your consumer rights have been violated, you may contact the relevant consumer forum.</p>

                {/* 9. Contact Us */}
                <p className='mt-8'><b className='text-white'>9. Contact Us</b></p>
                <p className='mt-3'>For refund, replacement, or return requests, please contact us with your order details. We will do our best to resolve all genuine concerns quickly and fairly.</p>
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

export default RefundPolicy
