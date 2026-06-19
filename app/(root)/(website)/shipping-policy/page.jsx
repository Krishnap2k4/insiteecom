import WebsiteBreadcrumb from '@/components/Application/Website/WebsiteBreadcrumb'
import React from 'react'

export const metadata = {
    title: 'Shipping Policy',
    description: 'Order processing times, delivery estimates across India, tracking, and how we handle damaged or lost shipments.',
}

const breadcrumb = {
    title: 'Shipping Policy',
    links: [{ label: 'Shipping Policy' }],
}

const ShippingPolicy = () => {
    return (
        <div>
            <WebsiteBreadcrumb props={breadcrumb} />
            <div className='lg:px-40 px-5 py-20 text-white/70'>
                <h1 className='text-3xl font-serif-display text-[#F0D77C] mb-2'>Shipping Policy</h1>
                <p className='text-white/40 text-xs mb-6'>Last Updated: June 2026</p>

                <p>At ELOIR, we are committed to delivering your fragrances safely and efficiently. Please read our shipping policy carefully before placing an order. By placing an order, you agree to the terms outlined below.</p>

                {/* 1. Order Processing */}
                <p className='mt-8'><b className='text-white'>1. Order Processing</b></p>
                <p className='mt-3'>All orders are processed within <b className='text-white/90'>1–3 business days</b> after successful payment confirmation.</p>
                <p className='mt-3'>Orders placed on weekends or public holidays will be processed on the next business day.</p>

                {/* 2. Shipping Coverage */}
                <p className='mt-8'><b className='text-white'>2. Shipping Coverage</b></p>
                <p className='mt-3'>We currently ship across India.</p>
                <p className='mt-3'>Delivery availability may vary depending on the serviceability of your location by our courier partners.</p>

                {/* 3. Estimated Delivery Time */}
                <p className='mt-8'><b className='text-white'>3. Estimated Delivery Time</b></p>
                <p className='mt-3'>Estimated delivery times are:</p>
                <ul className='list-disc ps-10 mt-3 space-y-2'>
                    <li><b className='text-white/90'>Metro Cities:</b> 2–5 business days</li>
                    <li><b className='text-white/90'>Other Cities &amp; Towns:</b> 3–7 business days</li>
                    <li><b className='text-white/90'>Remote Areas:</b> 5–10 business days</li>
                </ul>
                <p className='mt-3'>Delivery timelines are estimates and may vary due to unforeseen circumstances.</p>

                {/* 4. Shipping Charges */}
                <p className='mt-8'><b className='text-white'>4. Shipping Charges</b></p>
                <p className='mt-3'>Shipping charges, if applicable, will be displayed during checkout before payment.</p>
                <p className='mt-3'>Free shipping offers may be available during promotional periods and will be clearly communicated on the website.</p>

                {/* 5. Order Tracking */}
                <p className='mt-8'><b className='text-white'>5. Order Tracking</b></p>
                <p className='mt-3'>Once your order is shipped, you will receive a tracking number and courier details via email, SMS, or WhatsApp (where applicable).</p>
                <p className='mt-3'>Customers can use the tracking details to monitor the status of their shipment.</p>

                {/* 6. Delivery Delays */}
                <p className='mt-8'><b className='text-white'>6. Delivery Delays</b></p>
                <p className='mt-3'>While we strive to deliver orders within the estimated timeframe, delays may occur due to:</p>
                <ul className='list-disc ps-10 mt-3 space-y-2'>
                    <li>Weather conditions</li>
                    <li>Public holidays</li>
                    <li>Courier service disruptions</li>
                    <li>Natural disasters</li>
                    <li>Incorrect shipping information provided by the customer</li>
                </ul>
                <p className='mt-3'>ELOIR is not liable for delays caused by circumstances beyond our control.</p>

                {/* 7. Incorrect Shipping Information */}
                <p className='mt-8'><b className='text-white'>7. Incorrect Shipping Information</b></p>
                <p className='mt-3'>Customers are responsible for providing accurate shipping details at the time of placing an order.</p>
                <p className='mt-3'>ELOIR will not be responsible for delays, failed deliveries, or additional charges arising from incorrect or incomplete address information.</p>

                {/* 8. Damaged Shipments */}
                <p className='mt-8'><b className='text-white'>8. Damaged Shipments</b></p>
                <p className='mt-3'>If your package arrives damaged, please contact us within <b className='text-white/90'>48 hours of delivery</b> and provide:</p>
                <ul className='list-disc ps-10 mt-3 space-y-2'>
                    <li>Order Number</li>
                    <li>Photos/videos of the package</li>
                    <li>Photos/videos of the product</li>
                </ul>
                <p className='mt-3'>Claims submitted after 48 hours may not be eligible for review. Please refer to our <a href='/refund-policy' className='text-[#F0D77C] hover:text-[#E5C76B] transition-colors'>Refund &amp; Return Policy</a> for further details.</p>

                {/* 9. Lost Shipments */}
                <p className='mt-8'><b className='text-white'>9. Lost Shipments</b></p>
                <p className='mt-3'>If your order is marked as delivered but has not been received, please contact us immediately.</p>
                <p className='mt-3'>We will coordinate with the courier partner to investigate the issue. Please note that investigation timelines may vary depending on the courier partner.</p>

                {/* 10. Consumer Rights */}
                <p className='mt-8'><b className='text-white'>10. Consumer Rights</b></p>
                <p className='mt-3'>Nothing in this policy limits your statutory rights under the <b className='text-white/90'>Consumer Protection Act, 2019</b> or any other applicable Indian law. Consumers retain the right to approach the appropriate consumer forum for unresolved grievances.</p>

                {/* 11. Contact Us */}
                <p className='mt-8'><b className='text-white'>11. Contact Us</b></p>
                <p className='mt-3'>For shipping-related questions, please contact us. We will do our best to assist you promptly.</p>
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

export default ShippingPolicy
