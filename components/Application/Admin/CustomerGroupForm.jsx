'use client'
import ButtonLoading from '@/components/Application/ButtonLoading'
import { Checkbox } from '@/components/ui/checkbox'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

const formSchema = z.object({
    code: z.string().min(2).regex(/^[a-z0-9_]+$/, 'Use lowercase letters, numbers and underscores only.'),
    name: z.string().min(2),
    description: z.string().max(280).optional().default(''),
    discountPercent: z.coerce.number().min(0).max(100),
    taxExempt: z.boolean().default(false),
    isDefault: z.boolean().default(false),
})

/**
 * Shared form for creating and editing a customer group. `mode='edit'`
 * locks the `code` field — codes are referenced from other documents
 * (e.g. price rules in Marketing later) so renames are unsafe.
 */
const CustomerGroupForm = ({ initialValues, onSubmit, loading, submitLabel, mode = 'create' }) => {
    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            code: '', name: '', description: '',
            discountPercent: 0, taxExempt: false, isDefault: false,
            ...initialValues,
        },
    })

    useEffect(() => {
        if (initialValues) {
            form.reset({
                code: '', name: '', description: '',
                discountPercent: 0, taxExempt: false, isDefault: false,
                ...initialValues,
            })
        }
    }, [initialValues])

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='grid md:grid-cols-2 gap-5'>
                <FormField control={form.control} name="code" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Code <span className='text-red-500'>*</span></FormLabel>
                        <FormControl>
                            <Input
                                placeholder="e.g. wholesale"
                                {...field}
                                disabled={mode === 'edit'}
                            />
                        </FormControl>
                        <p className='text-xs text-gray-500'>Lowercase letters, numbers, underscores. Used by code and can&apos;t be renamed later.</p>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Name <span className='text-red-500'>*</span></FormLabel>
                        <FormControl><Input placeholder="Wholesale Customers" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <div className='md:col-span-2'>
                    <FormField control={form.control} name="description" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl><Textarea rows={2} placeholder="What kind of customers belong to this group?" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>
                <FormField control={form.control} name="discountPercent" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Discount percentage</FormLabel>
                        <FormControl><Input type="number" min={0} max={100} {...field} /></FormControl>
                        <p className='text-xs text-gray-500'>Applied automatically at checkout for customers in this group. 0 = no discount.</p>
                        <FormMessage />
                    </FormItem>
                )} />

                <div className='space-y-3'>
                    <FormField control={form.control} name="taxExempt" render={({ field }) => (
                        <FormItem className='flex flex-row items-start gap-3 space-y-0'>
                            <FormControl>
                                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                            <div>
                                <FormLabel className='cursor-pointer'>Tax exempt</FormLabel>
                                <p className='text-xs text-gray-500'>Orders for this group skip tax calculation.</p>
                            </div>
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="isDefault" render={({ field }) => (
                        <FormItem className='flex flex-row items-start gap-3 space-y-0'>
                            <FormControl>
                                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                            <div>
                                <FormLabel className='cursor-pointer'>Default group</FormLabel>
                                <p className='text-xs text-gray-500'>New customers will be assigned to this group automatically. Only one default at a time.</p>
                            </div>
                        </FormItem>
                    )} />
                </div>

                <div className='md:col-span-2 mt-2'>
                    <ButtonLoading loading={loading} type='submit' text={submitLabel} className='cursor-pointer' />
                </div>
            </form>
        </Form>
    )
}

export default CustomerGroupForm
