'use client'
import { useEffect, useState } from 'react'
import BreadCrumb from '@/components/Application/Admin/BreadCrumb'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import axios from '@/lib/apiClient'
import { showToast } from '@/lib/showToast'
import { ADMIN_DASHBOARD, ADMIN_SETTINGS } from '@/routes/AdminPanelRoute'
import { Truck, Loader2 } from 'lucide-react'

const breadcrumbData = [
    { href: ADMIN_DASHBOARD, label: 'Home' },
    { href: ADMIN_SETTINGS,  label: 'Settings' },
]

/**
 * System / business-rule config. Storefront content (logo, hero, sections,
 * social, etc.) lives separately under /admin/cms.
 */
const SettingsPage = () => {
    const [loading, setLoading] = useState(true)
    const [saving,  setSaving]  = useState(false)
    const [shipping, setShipping] = useState({
        freeDeliveryThreshold: 999,
        standardDeliveryCharge: 99,
    })

    useEffect(() => {
        (async () => {
            try {
                const { data: res } = await axios.get('/api/admin/settings')
                if (res?.success && res.data?.shipping) setShipping(res.data.shipping)
            } catch {
                showToast('error', 'Could not load settings.')
            } finally {
                setLoading(false)
            }
        })()
    }, [])

    const handleSave = async () => {
        const threshold = Number(shipping.freeDeliveryThreshold)
        const charge    = Number(shipping.standardDeliveryCharge)
        if (isNaN(threshold) || threshold < 0) return showToast('error', 'Free delivery threshold must be a positive number.')
        if (isNaN(charge)    || charge    < 0) return showToast('error', 'Delivery charge must be a positive number.')

        setSaving(true)
        try {
            const { data: res } = await axios.put('/api/admin/settings', {
                shipping: { freeDeliveryThreshold: threshold, standardDeliveryCharge: charge },
            })
            if (!res?.success) throw new Error(res?.message || 'Could not save settings.')
            showToast('success', res.message)
        } catch (err) {
            showToast('error', err.message)
        } finally {
            setSaving(false)
        }
    }

    return (
        <div>
            <BreadCrumb breadcrumbData={breadcrumbData} />

            {loading ? (
                <div className='flex items-center gap-2 text-muted-foreground py-10'>
                    <Loader2 size={18} className='animate-spin' /> Loading settings…
                </div>
            ) : (
                <div className='max-w-2xl'>
                    <Card>
                        <CardHeader>
                            <CardTitle className='flex items-center gap-2 text-base'>
                                <Truck size={18} /> Shipping & Delivery
                            </CardTitle>
                            <CardDescription>
                                Set the cart subtotal required for free delivery and the flat fee charged when below it.
                                Changes take effect immediately — no redeployment needed.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className='space-y-5'>
                            <div className='grid sm:grid-cols-2 gap-5'>
                                <div className='space-y-1.5'>
                                    <Label htmlFor='threshold'>Free delivery above (₹)</Label>
                                    <Input id='threshold' type='number' min={0} value={shipping.freeDeliveryThreshold}
                                        onChange={(e) => setShipping((s) => ({ ...s, freeDeliveryThreshold: e.target.value }))} />
                                    <p className='text-xs text-muted-foreground'>Orders at or above this subtotal get free delivery.</p>
                                </div>
                                <div className='space-y-1.5'>
                                    <Label htmlFor='charge'>Standard delivery charge (₹)</Label>
                                    <Input id='charge' type='number' min={0} value={shipping.standardDeliveryCharge}
                                        onChange={(e) => setShipping((s) => ({ ...s, standardDeliveryCharge: e.target.value }))} />
                                    <p className='text-xs text-muted-foreground'>Flat fee added when subtotal is below the threshold.</p>
                                </div>
                            </div>

                            <div className='rounded-md border bg-muted/40 px-4 py-3 text-sm space-y-1'>
                                <p className='font-medium'>Preview</p>
                                <p className='text-muted-foreground'>
                                    Cart ≥ ₹{Number(shipping.freeDeliveryThreshold).toLocaleString('en-IN')} → <span className='text-green-600 font-medium'>Free delivery</span>
                                </p>
                                <p className='text-muted-foreground'>
                                    Cart &lt; ₹{Number(shipping.freeDeliveryThreshold).toLocaleString('en-IN')} → <span className='font-medium'>₹{Number(shipping.standardDeliveryCharge).toLocaleString('en-IN')} delivery charge</span>
                                </p>
                            </div>

                            <Button onClick={handleSave} disabled={saving} className='cursor-pointer'>
                                {saving && <Loader2 size={14} className='animate-spin mr-2' />}
                                {saving ? 'Saving…' : 'Save settings'}
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    )
}

export default SettingsPage
