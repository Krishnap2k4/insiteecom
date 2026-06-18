import WebsiteBreadcrumb from '@/components/Application/Website/WebsiteBreadcrumb'
import React from 'react'

export const metadata = {
    title: 'Terms & Conditions',
    description: 'The rules and conditions that govern your use of our website and purchases.',
}

const breadcrumb = {
    title: 'Terms & Conditions',
    links: [
        { label: 'Terms & Conditions' },
    ]
}

const TermsAndConditions = () => {
    return (
        <div>
            <WebsiteBreadcrumb props={breadcrumb} />
            <div className='lg:px-40 px-5 py-20 text-white/70'>
                <h1 className='text-3xl font-serif-display text-[#F0D77C] mb-5'>Terms &amp; Conditions</h1>

                <p>Welcome to ELOIR. By accessing or using our website, you agree to comply with and be bound by these Terms &amp; Conditions. Please read them carefully before placing an order.</p>

                {/* 1. General */}
                <p className='mt-8'><b className='text-white'>1. General</b></p>
                <p className='mt-3'>ELOIR offers fragrance products inspired by well-known perfumes. All product names, descriptions, and content on this website are provided for informational purposes only.</p>
                <p className='mt-3'>We reserve the right to modify, update, or discontinue any product, service, or content without prior notice.</p>

                {/* 2. Product Information */}
                <p className='mt-8'><b className='text-white'>2. Product Information</b></p>
                <p className='mt-3'>We strive to ensure that all product descriptions, images, prices, and availability are accurate. However, minor variations may occur.</p>
                <p className='mt-3'>Fragrance performance, longevity, and projection may vary depending on skin type, weather conditions, and usage.</p>

                {/* 3. Pricing & Payments */}
                <p className='mt-8'><b className='text-white'>3. Pricing &amp; Payments</b></p>
                <ul className='list-disc ps-10 mt-3 space-y-2'>
                    <li>All prices displayed on the website are in Indian Rupees (₹).</li>
                    <li>We reserve the right to change prices at any time without prior notice.</li>
                    <li>Orders will be processed only after successful payment confirmation.</li>
                </ul>

                {/* 4. Order Acceptance */}
                <p className='mt-8'><b className='text-white'>4. Order Acceptance</b></p>
                <p className='mt-3'>Placing an order does not guarantee acceptance. ELOIR reserves the right to cancel or refuse any order due to:</p>
                <ul className='list-disc ps-10 mt-3 space-y-2'>
                    <li>Product unavailability</li>
                    <li>Pricing errors</li>
                    <li>Suspected fraudulent activity</li>
                    <li>Incorrect customer information</li>
                </ul>
                <p className='mt-3'>In such cases, any payment received will be refunded.</p>

                {/* 5. Shipping */}
                <p className='mt-8'><b className='text-white'>5. Shipping</b></p>
                <ul className='list-disc ps-10 mt-3 space-y-2'>
                    <li>Orders are processed within the timelines mentioned on our website.</li>
                    <li>Delivery times may vary depending on location and courier services.</li>
                    <li>ELOIR is not responsible for delays caused by courier partners, natural events, or circumstances beyond our control.</li>
                </ul>

                {/* 6. Returns & Refunds */}
                <p className='mt-8'><b className='text-white'>6. Returns &amp; Refunds</b></p>
                <ul className='list-disc ps-10 mt-3 space-y-2'>
                    <li>Due to the nature of fragrance products, opened or used products cannot be returned.</li>
                    <li>If you receive a damaged, defective, or incorrect item, please contact us within 48 hours of delivery with clear photos and order details.</li>
                    <li>Approved claims may be eligible for replacement or refund.</li>
                </ul>

                {/* 7. Intellectual Property */}
                <p className='mt-8'><b className='text-white'>7. Intellectual Property</b></p>
                <p className='mt-3'>The ELOIR name, logo, designs, website content, graphics, and branding materials are the property of ELOIR and may not be copied, reproduced, or used without written permission.</p>

                {/* 8. Limitation of Liability */}
                <p className='mt-8'><b className='text-white'>8. Limitation of Liability</b></p>
                <ul className='list-disc ps-10 mt-3 space-y-2'>
                    <li>ELOIR shall not be liable for any indirect, incidental, special, or consequential damages arising from the use of our products or website.</li>
                    <li>Customers are responsible for checking ingredient suitability and performing a patch test where necessary.</li>
                </ul>

                {/* 9. Privacy */}
                <p className='mt-8'><b className='text-white'>9. Privacy</b></p>
                <ul className='list-disc ps-10 mt-3 space-y-2'>
                    <li>Customer information is collected and used in accordance with our Privacy Policy.</li>
                    <li>We do not sell or share personal information with third parties except as necessary to process orders and provide services.</li>
                </ul>

                {/* 10. Governing Law */}
                <p className='mt-8'><b className='text-white'>10. Governing Law</b></p>
                <p className='mt-3'>These Terms &amp; Conditions shall be governed by and interpreted in accordance with the laws of India.</p>
                <p className='mt-3'>Any disputes arising from the use of this website shall be subject to the jurisdiction of the courts in Nagpur, Maharashtra.</p>

                {/* 11. Contact Information */}
                <p className='mt-8'><b className='text-white'>11. Contact Information</b></p>
                <p className='mt-3'>For any questions regarding these Terms &amp; Conditions, please contact:</p>
                <div className='mt-3 space-y-1'>
                    <p><b className='text-white/90'>ELOIR Perfumes</b></p>
                    <p>Email: <a href='mailto:eloir.perfumes@gmail.com' className='text-[#F0D77C] hover:text-[#E5C76B] transition-colors'>eloir.perfumes@gmail.com</a></p>
                    <p>Phone: <a href='https://wa.me/918007900071' target='_blank' rel='noopener noreferrer' className='text-[#F0D77C] hover:text-[#E5C76B] transition-colors'>+91 8007900071</a></p>
                    <p>Instagram: <a href='https://www.instagram.com/eloir.perfumes' target='_blank' rel='noopener noreferrer' className='text-[#F0D77C] hover:text-[#E5C76B] transition-colors'>@eloir.perfumes</a></p>
                </div>
            </div>
        </div>
    )
}

export default TermsAndConditions
