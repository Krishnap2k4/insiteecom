'use client'
import BreadCrumb from '@/components/Application/Admin/BreadCrumb'
import ButtonLoading from '@/components/Application/ButtonLoading'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import axios from '@/lib/apiClient'
import { showToast } from '@/lib/showToast'
import { zodResolver } from '@hookform/resolvers/zod'
import { Chip } from '@mui/material'
import { use, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { ADMIN_DASHBOARD, ADMIN_ROLES_SHOW } from '@/routes/AdminPanelRoute'

const formSchema = z.object({
    name: z.string().min(2, 'Name is required.'),
    description: z.string().max(280).optional(),
    permissions: z.array(z.string()).default([]),
})

const breadcrumbData = [
    { href: ADMIN_DASHBOARD, label: 'Home' },
    { href: ADMIN_ROLES_SHOW, label: 'Roles' },
    { href: '', label: 'Edit Role' },
]

const RoleEditPage = ({ params }) => {
    const { id } = use(params)

    const [role, setRole] = useState(null)
    const [permissionData, setPermissionData] = useState({ grouped: {}, categories: [] })
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: { name: '', description: '', permissions: [] },
    })

    useEffect(() => {
        const load = async () => {
            try {
                const [roleRes, permRes] = await Promise.all([
                    axios.get(`/api/admin/roles/${id}`),
                    axios.get('/api/admin/permissions'),
                ])
                if (roleRes?.data?.success) {
                    const r = roleRes.data.data
                    setRole(r)
                    form.reset({
                        name: r.name,
                        description: r.description || '',
                        permissions: r.permissions || [],
                    })
                }
                if (permRes?.data?.success) {
                    setPermissionData(permRes.data.data)
                }
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [id])

    const onSubmit = async (values) => {
        setSaving(true)
        try {
            const { data: res } = await axios.put(`/api/admin/roles/${id}`, values)
            if (!res?.success) throw new Error(res?.message || 'Could not save role.')
            showToast('success', res.message)
        } catch (err) {
            showToast('error', err.message)
        } finally {
            setSaving(false)
        }
    }

    const toggleCategory = (categoryCodes, selected) => {
        const current = new Set(form.getValues('permissions') || [])
        for (const code of categoryCodes) {
            if (selected) current.add(code)
            else current.delete(code)
        }
        form.setValue('permissions', [...current], { shouldDirty: true })
    }

    return (
        <div>
            <BreadCrumb breadcrumbData={breadcrumbData} />

            <Card className="py-0 rounded shadow-sm">
                <CardHeader className="pt-3 px-3 border-b [.border-b]:pb-2">
                    <div className='flex items-center justify-between gap-3'>
                        <h4 className='text-xl font-semibold'>
                            Edit Role {role && <span className='text-gray-400 font-mono text-sm ml-2'>({role.code})</span>}
                        </h4>
                        {role?.isSystem && <Chip size='small' label='System' color='primary' variant='outlined' />}
                    </div>
                </CardHeader>
                <CardContent className="pb-5">
                    {loading && (
                        <div className='py-10 text-center text-gray-400'>Loading…</div>
                    )}

                    {!loading && role && (
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)}>
                                <div className='grid md:grid-cols-2 gap-5 mb-6'>
                                    <FormField control={form.control} name='name' render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Name <span className='text-red-500'>*</span></FormLabel>
                                            <FormControl><Input {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <div className='hidden md:block' />
                                    <div className='md:col-span-2'>
                                        <FormField control={form.control} name='description' render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Description</FormLabel>
                                                <FormControl><Textarea rows={2} {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                    </div>
                                </div>

                                <h4 className='font-semibold mb-3'>Permissions</h4>
                                <FormField control={form.control} name='permissions' render={({ field }) => {
                                    const selected = new Set(field.value || [])
                                    return (
                                        <div className='space-y-4'>
                                            {permissionData.categories.map((category) => {
                                                const perms = permissionData.grouped[category] || []
                                                if (perms.length === 0) return null
                                                const categoryCodes = perms.map((p) => p.code)
                                                const allSelected = categoryCodes.every((c) => selected.has(c))
                                                const someSelected = categoryCodes.some((c) => selected.has(c))
                                                return (
                                                    <div key={category} className='border rounded-lg p-4'>
                                                        <div className='flex items-center justify-between mb-3'>
                                                            <h5 className='font-medium'>{category}</h5>
                                                            <label className='flex items-center gap-2 text-sm text-gray-500 cursor-pointer'>
                                                                <Checkbox
                                                                    checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                                                                    onCheckedChange={(v) => toggleCategory(categoryCodes, v === true)}
                                                                />
                                                                <span>{allSelected ? 'All' : someSelected ? 'Some' : 'None'}</span>
                                                            </label>
                                                        </div>
                                                        <div className='grid sm:grid-cols-2 lg:grid-cols-3 gap-2'>
                                                            {perms.map((perm) => (
                                                                <label key={perm.code} className='flex items-start gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer'>
                                                                    <Checkbox
                                                                        checked={selected.has(perm.code)}
                                                                        onCheckedChange={(v) => {
                                                                            const next = new Set(selected)
                                                                            if (v) next.add(perm.code)
                                                                            else next.delete(perm.code)
                                                                            field.onChange([...next])
                                                                        }}
                                                                    />
                                                                    <div className='flex-1 min-w-0'>
                                                                        <p className='text-sm font-medium leading-tight'>{perm.name}</p>
                                                                        <p className='text-xs text-gray-400 font-mono truncate'>{perm.code}</p>
                                                                    </div>
                                                                </label>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )
                                }} />

                                <div className='mt-6'>
                                    <ButtonLoading loading={saving} type='submit' text='Save changes' className='cursor-pointer' />
                                </div>
                            </form>
                        </Form>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

export default RoleEditPage
