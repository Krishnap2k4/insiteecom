import WebsiteBreadcrumb from '@/components/Application/Website/WebsiteBreadcrumb'
import React from 'react'

export const metadata = {
    title: 'Privacy Policy',
    description: 'How we collect, use and protect your personal information when you shop with us.',
}

const breadcrumb = {
    title: 'Privacy Policy',
    links: [
        { label: 'Privacy Policy' },
    ]
}

const PrivacyPolicy = () => {
    return (
        <div>
            <WebsiteBreadcrumb props={breadcrumb} />
            <div className='lg:px-40 px-5 py-20 text-white/70'>
                <h1 className='text-3xl font-serif-display text-[#F0D77C] mb-2'>Privacy Policy</h1>
                <p className='text-white/40 text-xs mb-6'>Last Updated: June 2025</p>

                <p>At ELOIR, we value your privacy and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, store, and safeguard your information when you visit our website or purchase our products. By using our website, you consent to the practices described in this policy.</p>

                {/* 1. Information We Collect */}
                <p className='mt-8'><b className='text-white'>1. Information We Collect</b></p>
                <p className='mt-3'>We may collect the following information:</p>

                <p className='mt-4 text-white/80 font-medium'>Personal Information</p>
                <ul className='list-disc ps-10 mt-2 space-y-1.5'>
                    <li>Full Name</li>
                    <li>Email Address</li>
                    <li>Phone Number</li>
                    <li>Shipping Address</li>
                    <li>Billing Address</li>
                </ul>

                <p className='mt-4 text-white/80 font-medium'>Order Information</p>
                <ul className='list-disc ps-10 mt-2 space-y-1.5'>
                    <li>Products purchased</li>
                    <li>Transaction details</li>
                    <li>Order history</li>
                </ul>

                <p className='mt-4 text-white/80 font-medium'>Technical Information</p>
                <ul className='list-disc ps-10 mt-2 space-y-1.5'>
                    <li>IP Address</li>
                    <li>Browser type</li>
                    <li>Device information</li>
                    <li>Website usage data</li>
                </ul>

                {/* 2. How We Use Your Information */}
                <p className='mt-8'><b className='text-white'>2. How We Use Your Information</b></p>
                <p className='mt-3'>We use your information to:</p>
                <ul className='list-disc ps-10 mt-3 space-y-2'>
                    <li>Process and fulfill orders</li>
                    <li>Provide customer support</li>
                    <li>Send order confirmations and updates</li>
                    <li>Improve our website and services</li>
                    <li>Prevent fraudulent transactions</li>
                    <li>Comply with legal obligations</li>
                </ul>

                {/* 3. Payment Security */}
                <p className='mt-8'><b className='text-white'>3. Payment Security</b></p>
                <p className='mt-3'>ELOIR does not store your debit card, credit card, UPI PIN, CVV, or banking credentials.</p>
                <p className='mt-3'>Payments are processed through secure third-party payment gateways that follow industry-standard security practices including PCI-DSS compliance.</p>

                {/* 4. Sharing of Information */}
                <p className='mt-8'><b className='text-white'>4. Sharing of Information</b></p>
                <p className='mt-3'>We do not sell, rent, or trade your personal information. Your information may be shared only with:</p>
                <ul className='list-disc ps-10 mt-3 space-y-2'>
                    <li>Payment service providers</li>
                    <li>Courier and logistics partners</li>
                    <li>Legal authorities when required by law</li>
                </ul>
                <p className='mt-3'>These parties receive only the information necessary to perform their services.</p>

                {/* 5. Cookies */}
                <p className='mt-8'><b className='text-white'>5. Cookies</b></p>
                <p className='mt-3'>Our website may use cookies and similar technologies to:</p>
                <ul className='list-disc ps-10 mt-3 space-y-2'>
                    <li>Improve website performance</li>
                    <li>Remember user preferences</li>
                    <li>Analyze website traffic</li>
                    <li>Enhance user experience</li>
                </ul>
                <p className='mt-3'>You may disable cookies through your browser settings, though some features may not function properly.</p>

                {/* 6. Data Security */}
                <p className='mt-8'><b className='text-white'>6. Data Security</b></p>
                <p className='mt-3'>We implement reasonable security measures to protect your personal information from unauthorized access, misuse, alteration, or disclosure.</p>
                <p className='mt-3'>However, no method of electronic transmission or storage is completely secure. We cannot guarantee absolute security of your data.</p>

                {/* 7. Marketing Communications */}
                <p className='mt-8'><b className='text-white'>7. Marketing Communications</b></p>
                <p className='mt-3'>With your consent, we may send:</p>
                <ul className='list-disc ps-10 mt-3 space-y-2'>
                    <li>Promotional offers</li>
                    <li>New product launches</li>
                    <li>Discount notifications</li>
                    <li>Brand updates</li>
                </ul>
                <p className='mt-3'>You may unsubscribe from marketing communications at any time by contacting us or using the unsubscribe link in our emails.</p>

                {/* 8. Data Retention */}
                <p className='mt-8'><b className='text-white'>8. Data Retention</b></p>
                <p className='mt-3'>We retain your information only as long as necessary to:</p>
                <ul className='list-disc ps-10 mt-3 space-y-2'>
                    <li>Fulfill orders</li>
                    <li>Resolve disputes</li>
                    <li>Meet legal and regulatory requirements</li>
                    <li>Maintain business records</li>
                </ul>

                {/* 9. Your Rights */}
                <p className='mt-8'><b className='text-white'>9. Your Rights</b></p>
                <p className='mt-3'>You may request to:</p>
                <ul className='list-disc ps-10 mt-3 space-y-2'>
                    <li>Access your personal information</li>
                    <li>Correct inaccurate information</li>
                    <li>Delete your personal information (subject to legal requirements)</li>
                    <li>Opt out of marketing communications</li>
                </ul>
                <p className='mt-3'>Requests can be made through our contact details below.</p>

                {/* 10. Third-Party Links */}
                <p className='mt-8'><b className='text-white'>10. Third-Party Links</b></p>
                <p className='mt-3'>Our website may contain links to third-party websites. ELOIR is not responsible for the privacy practices or content of external websites. We encourage you to review the privacy policies of any external sites you visit.</p>

                {/* 11. Children's Privacy */}
                <p className='mt-8'><b className='text-white'>11. Children&apos;s Privacy</b></p>
                <p className='mt-3'>Our website is not intended for individuals under the age of 18. We do not knowingly collect personal information from minors. If you believe a minor has provided us with personal information, please contact us immediately.</p>

                {/* 12. Changes to This Policy */}
                <p className='mt-8'><b className='text-white'>12. Changes to This Policy</b></p>
                <p className='mt-3'>ELOIR reserves the right to update this Privacy Policy at any time. Changes will be posted on this page with the updated revision date. Continued use of our website after any changes constitutes your acceptance of the updated policy.</p>

                {/* Contact */}
                <p className='mt-8'><b className='text-white'>13. Contact Us</b></p>
                <p className='mt-3'>If you have any questions, concerns, or requests regarding this Privacy Policy or your personal data, please contact our Grievance Officer:</p>
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

export default PrivacyPolicy
