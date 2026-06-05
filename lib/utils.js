import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const sizes = [
  { label: 'S', value: 'S' },
  { label: 'M', value: 'M' },
  { label: 'L', value: 'L' },
  { label: 'XL', value: 'XL' },
  { label: '2XL', value: '2XL' }
];


export const sortings = [
  { label: 'Default Sorting', value: 'default_sorting' },
  { label: 'Ascending Order', value: 'asc' },
  { label: 'Descending Order', value: 'desc' },
  { label: 'Price: Low To High', value: 'price_low_high' },
  { label: 'Price: High To Low', value: 'price_high_low' },
]

// Legacy combined status — kept for back-compat with existing admin
// views and dashboard widgets. New code reads `paymentStatus` and
// `fulfillmentStatus` separately (Module 3 redesign).
export const orderStatus = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'unverified']

// Module 3 — split status axes.
export const paymentStatus = ['pending', 'paid', 'failed', 'refunded', 'partially_refunded']
export const fulfillmentStatus = ['unfulfilled', 'partial', 'fulfilled', 'cancelled']

/**
 * Derive the legacy combined `status` from the new split axes so that
 * older admin lists/widgets keep displaying a single value.
 */
export const deriveLegacyOrderStatus = ({ paymentStatus: ps, fulfillmentStatus: fs }) => {
    if (fs === 'cancelled') return 'cancelled'
    if (ps === 'failed') return 'unverified'
    if (fs === 'fulfilled') return 'delivered'
    if (fs === 'partial') return 'shipped'
    if (ps === 'paid') return 'processing'
    return 'pending'
}