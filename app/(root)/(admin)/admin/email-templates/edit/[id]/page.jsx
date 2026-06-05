'use client'
import BreadCrumb from '@/components/Application/Admin/BreadCrumb'
import { Button } from '@/components/ui/button'
import ButtonLoading from '@/components/Application/ButtonLoading'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import axios from '@/lib/apiClient'
import useFetch from '@/hooks/useFetch'
import { showToast } from '@/lib/showToast'
import {
    ADMIN_DASHBOARD,
    ADMIN_EMAIL_TEMPLATES_SHOW,
} from '@/routes/AdminPanelRoute'
import { use, useEffect, useState } from 'react'
import { FiEye } from 'react-icons/fi'

const breadcrumbData = [
    { href: ADMIN_DASHBOARD, label: 'Home' },
    { href: ADMIN_EMAIL_TEMPLATES_SHOW, label: 'Email templates' },
    { href: '', label: 'Edit' },
]

const EditEmailTemplate = ({ params }) => {
    const { id } = use(params)
    const { data, loading: fetchLoading } = useFetch(`/api/admin/email-templates/${id}`)

    const [form, setForm] = useState({ name: '', description: '', subject: '', body: '', isActive: false })
    const [saving, setSaving] = useState(false)
    const [preview, setPreview] = useState(null)
    const [previewing, setPreviewing] = useState(false)

    const tmpl = data?.data?.template
    const catalog = data?.data?.catalog

    useEffect(() => {
        if (tmpl) {
            setForm({
                name: tmpl.name || '',
                description: tmpl.description || '',
                subject: tmpl.subject || '',
                body: tmpl.body || '',
                isActive: Boolean(tmpl.isActive),
            })
        }
    }, [tmpl])

    const save = async () => {
        setSaving(true)
        try {
            const { data: res } = await axios.put(`/api/admin/email-templates/${id}`, form)
            if (!res?.success) throw new Error(res?.message)
            showToast('success', res.message)
        } catch (err) { showToast('error', err.message) }
        finally { setSaving(false) }
    }

    const runPreview = async () => {
        setPreviewing(true)
        try {
            const { data: res } = await axios.post('/api/admin/email-templates/preview', {
                code: tmpl.code,
                subject: form.subject,
                body: form.body,
            })
            if (!res?.success) throw new Error(res?.message)
            setPreview(res.data)
        } catch (err) { showToast('error', err.message) }
        finally { setPreviewing(false) }
    }

    if (fetchLoading) {
        return (
            <div>
                <BreadCrumb breadcrumbData={breadcrumbData} />
                <div className='border rounded p-10 text-center text-gray-500'>Loading…</div>
            </div>
        )
    }
    if (!tmpl) {
        return (
            <div>
                <BreadCrumb breadcrumbData={breadcrumbData} />
                <div className='border rounded p-10 text-center text-red-500 font-semibold'>Template not found.</div>
            </div>
        )
    }

    return (
        <div>
            <BreadCrumb breadcrumbData={breadcrumbData} />
            <div className='grid lg:grid-cols-[3fr_2fr] gap-5'>
                <div className='space-y-5'>
                    <Card className='py-0 rounded shadow-sm'>
                        <CardHeader className='pt-3 px-3 border-b [.border-b]:pb-2'>
                            <div className='flex items-start justify-between gap-3'>
                                <div>
                                    <h4 className='text-lg font-semibold'>{form.name || tmpl.name}</h4>
                                    <p className='text-xs font-mono text-gray-400 mt-0.5'>{tmpl.code}</p>
                                </div>
                                <div className='flex items-center gap-2'>
                                    <Switch
                                        checked={form.isActive}
                                        onCheckedChange={(v) => setForm((s) => ({ ...s, isActive: v }))}
                                    />
                                    <span className='text-xs text-gray-500'>
                                        {form.isActive ? 'Active' : 'Falls back to file template'}
                                    </span>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className='p-4 space-y-4'>
                            <div>
                                <Label className='mb-1.5 block'>Name</Label>
                                <Input value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} />
                            </div>
                            <div>
                                <Label className='mb-1.5 block'>Internal description</Label>
                                <Input value={form.description} onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))} />
                            </div>
                            <div>
                                <Label className='mb-1.5 block'>Subject</Label>
                                <Input value={form.subject} onChange={(e) => setForm((s) => ({ ...s, subject: e.target.value }))} placeholder='Order {{order.orderNumber}} confirmed' />
                            </div>
                            <div>
                                <Label className='mb-1.5 block'>HTML body</Label>
                                <Textarea
                                    value={form.body}
                                    onChange={(e) => setForm((s) => ({ ...s, body: e.target.value }))}
                                    rows={18}
                                    className='font-mono text-xs'
                                />
                                <p className='text-xs text-gray-400 mt-1'>Use {'{{var}}'} tokens — see the variables panel.</p>
                            </div>
                            <div className='flex gap-2'>
                                <ButtonLoading type='button' text='Save' loading={saving} onClick={save} />
                                <Button type='button' variant='outline' onClick={runPreview} disabled={previewing}>
                                    <FiEye className='mr-1' size={14} /> Preview with sample data
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {preview && (
                        <Card className='py-0 rounded shadow-sm'>
                            <CardHeader className='pt-3 px-3 border-b [.border-b]:pb-2'>
                                <h4 className='font-semibold'>Preview</h4>
                            </CardHeader>
                            <CardContent className='p-4'>
                                <p className='text-xs text-gray-500'>Subject</p>
                                <p className='font-medium mb-3'>{preview.subject}</p>
                                <p className='text-xs text-gray-500'>Body (rendered)</p>
                                <div className='border rounded mt-1 max-h-[60vh] overflow-y-auto'>
                                    <iframe
                                        title='preview'
                                        srcDoc={preview.body}
                                        className='w-full h-[60vh] bg-white'
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                <div>
                    <Card className='py-0 rounded shadow-sm sticky top-4'>
                        <CardHeader className='pt-3 px-3 border-b [.border-b]:pb-2'>
                            <h4 className='font-semibold'>Available variables</h4>
                            <p className='text-xs text-gray-500 mt-0.5'>Drop any of these tokens into the subject or body.</p>
                        </CardHeader>
                        <CardContent className='p-4 space-y-2 text-sm'>
                            {(catalog?.variables || []).length === 0 && (
                                <p className='text-gray-500 text-xs'>No variables documented for this template.</p>
                            )}
                            {(catalog?.variables || []).map((v) => (
                                <div key={v.name} className='flex items-start justify-between gap-3 py-1 border-b last:border-b-0'>
                                    <div className='min-w-0'>
                                        <code className='text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-800'>{`{{${v.name}}}`}</code>
                                        {v.description && <p className='text-xs text-gray-500 mt-1'>{v.description}</p>}
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

export default EditEmailTemplate
