'use client'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import ButtonLoading from '@/components/Application/ButtonLoading'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useEffect } from 'react'

const formSchema = z.object({
    label: z.string().max(50).optional().default(''),
    fullName: z.string().max(120).optional().default(''),
    phone: z.string().min(7, 'Phone is required.'),
    line1: z.string().min(3, 'Address line 1 is required.'),
    line2: z.string().optional().default(''),
    landmark: z.string().optional().default(''),
    city: z.string().min(2, 'City is required.'),
    state: z.string().min(2, 'State is required.'),
    country: z.string().min(2, 'Country is required.'),
    pincode: z.string().min(3, 'Pincode is required.'),
})

/**
 * Reusable address form. Used in the add and edit dialogs on the
 * address book page. Caller controls submit handler and loading state
 * so the form is decoupled from any specific API endpoint.
 */
const AddressForm = ({ initialValues, onSubmit, loading, submitLabel = 'Save address' }) => {
    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            label: '',
            fullName: '',
            phone: '',
            line1: '',
            line2: '',
            landmark: '',
            city: '',
            state: '',
            country: '',
            pincode: '',
            ...initialValues,
        },
    })

    useEffect(() => {
        if (initialValues) {
            form.reset({
                label: '', fullName: '', phone: '', line1: '', line2: '', landmark: '',
                city: '', state: '', country: '', pincode: '',
                ...initialValues,
            })
        }
    }, [initialValues])

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='grid md:grid-cols-2 grid-cols-1 gap-4'>
                <FormField control={form.control} name="label" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Label</FormLabel>
                        <FormControl><Input placeholder="Home, Office..." {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="fullName" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Recipient name</FormLabel>
                        <FormControl><Input placeholder="Full name" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Phone <span className='text-red-500'>*</span></FormLabel>
                        <FormControl><Input placeholder="Phone number" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="pincode" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Pincode <span className='text-red-500'>*</span></FormLabel>
                        <FormControl><Input placeholder="Postal / ZIP code" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <div className='md:col-span-2'>
                    <FormField control={form.control} name="line1" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Address line 1 <span className='text-red-500'>*</span></FormLabel>
                            <FormControl><Textarea placeholder="House / building / street" rows={2} {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>
                <div className='md:col-span-2'>
                    <FormField control={form.control} name="line2" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Address line 2</FormLabel>
                            <FormControl><Input placeholder="Apartment / suite / unit" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>
                <FormField control={form.control} name="landmark" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Landmark</FormLabel>
                        <FormControl><Input placeholder="Nearby landmark" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="city" render={({ field }) => (
                    <FormItem>
                        <FormLabel>City <span className='text-red-500'>*</span></FormLabel>
                        <FormControl><Input placeholder="City" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="state" render={({ field }) => (
                    <FormItem>
                        <FormLabel>State <span className='text-red-500'>*</span></FormLabel>
                        <FormControl><Input placeholder="State / province" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="country" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Country <span className='text-red-500'>*</span></FormLabel>
                        <FormControl><Input placeholder="Country" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />

                <div className='md:col-span-2 mt-2'>
                    <ButtonLoading loading={loading} type="submit" text={submitLabel} className="cursor-pointer" />
                </div>
            </form>
        </Form>
    )
}

export default AddressForm
