import { response } from '@/lib/helperFunction'
import { FREE_DELIVERY_THRESHOLD, STANDARD_DELIVERY_CHARGE } from '@/lib/shipping'

export async function GET() {
    return response(true, 200, 'Shipping config.', {
        freeDeliveryThreshold: FREE_DELIVERY_THRESHOLD,
        standardDeliveryCharge: STANDARD_DELIVERY_CHARGE,
    })
}
