import { renderEmailLayout } from './_layout'

const brandName = () => process.env.NEXT_PUBLIC_BRAND_NAME || 'E-store'

/**
 * Double opt-in confirmation. Customer subscribed; we send them a
 * link to confirm so we know it's really their inbox.
 */
export const newsletterConfirmEmail = ({ confirmUrl }) => renderEmailLayout({
    preheader: 'Confirm your newsletter subscription',
    title: 'One last step — confirm your subscription',
    intro: `Thanks for signing up to hear from ${brandName()}. Click below to confirm this is your inbox and we'll only ever send you what you've asked for.`,
    bodyBlocks: [],
    ctaText: 'Confirm subscription',
    ctaUrl: confirmUrl,
    footnote: 'Got this by mistake? Just ignore it — without confirmation we will not send anything else.',
})

/**
 * Final welcome after the customer confirmed.
 */
export const newsletterWelcomeEmail = ({ unsubscribeUrl }) => renderEmailLayout({
    preheader: 'You are subscribed',
    title: 'Welcome aboard',
    intro: `You're officially on the ${brandName()} list. Expect occasional updates on new arrivals, restocks, and the rare sale — never spam.`,
    bodyBlocks: [
        `<p style="font-size:13px;color:#6b7280;margin-top:24px;">Changed your mind? <a href="${unsubscribeUrl}" style="color:#6b7280;text-decoration:underline;">Unsubscribe in one click</a>.</p>`,
    ],
})
