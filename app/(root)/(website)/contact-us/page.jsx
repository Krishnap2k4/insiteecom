'use client'
import WebsiteBreadcrumb from '@/components/Application/Website/WebsiteBreadcrumb'
import ButtonLoading from '@/components/Application/ButtonLoading'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import axios from '@/lib/apiClient'
import { showToast } from '@/lib/showToast'
import { useState } from 'react'
import { FiMail, FiMapPin, FiPhone } from 'react-icons/fi'

const breadCrumb = { title: 'Contact us', links: [{ label: 'Contact us' }] }

const ContactUs = () => {
    const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' })
    const [loading, setLoading] = useState(false)
    const [done, setDone] = useState(false)

    const onChange = (k) => (e) => setForm((s) => ({ ...s, [k]: e.target.value }))

    const submit = async (e) => {
        e?.preventDefault()
        if (!form.name || !form.email || !form.message) {
            return showToast('error', 'Name, email and message are required.')
        }
        setLoading(true)
        try {
            const { data: res } = await axios.post('/api/contact/submit', form)
            if (!res?.success) throw new Error(res?.message || 'Could not send.')
            setDone(true)
            showToast('success', res.message)
        } catch (err) {
            showToast('error', err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div>
            <WebsiteBreadcrumb props={breadCrumb} />
            <div className='lg:px-32 px-5 my-12 grid lg:grid-cols-[1fr_2fr] gap-8'>
                <div className='space-y-4'>
                    <div>
                        <h2 className='text-2xl font-semibold'>Get in touch</h2>
                        <p className='text-sm text-gray-500 mt-1'>We'd love to hear from you. Send us a message and our team will reply within 24 hours.</p>
                    </div>
                    <div className='space-y-3 text-sm'>
                        <div className='flex items-start gap-3'>
                            <FiMail className='mt-0.5 text-gray-500 shrink-0' />
                            <a className='hover:underline' href='mailto:support@estore.com'>support@estore.com</a>
                        </div>
                        <div className='flex items-start gap-3'>
                            <FiPhone className='mt-0.5 text-gray-500 shrink-0' />
                            <a className='hover:underline' href='tel:+91-8569874589'>+91-8569874589</a>
                        </div>
                        <div className='flex items-start gap-3'>
                            <FiMapPin className='mt-0.5 text-gray-500 shrink-0' />
                            <span>E-store market<br />Lucknow, India 256320</span>
                        </div>
                    </div>
                </div>

                <div className='border rounded shadow-sm p-6'>
                    {done ? (
                        <div className='text-center py-10'>
                            <h3 className='text-xl font-semibold mb-2'>Thanks — we&apos;ll be in touch</h3>
                            <p className='text-sm text-gray-500'>Our team will reply to <strong>{form.email}</strong> shortly.</p>
                        </div>
                    ) : (
                        <form onSubmit={submit} className='space-y-4'>
                            <div className='grid md:grid-cols-2 gap-4'>
                                <div>
                                    <Label className='mb-1.5 block'>Name <span className='text-red-500'>*</span></Label>
                                    <Input value={form.name} onChange={onChange('name')} required />
                                </div>
                                <div>
                                    <Label className='mb-1.5 block'>Email <span className='text-red-500'>*</span></Label>
                                    <Input type='email' value={form.email} onChange={onChange('email')} required />
                                </div>
                                <div>
                                    <Label className='mb-1.5 block'>Phone</Label>
                                    <Input value={form.phone} onChange={onChange('phone')} />
                                </div>
                                <div>
                                    <Label className='mb-1.5 block'>Subject</Label>
                                    <Input value={form.subject} onChange={onChange('subject')} placeholder='General enquiry' />
                                </div>
                            </div>
                            <div>
                                <Label className='mb-1.5 block'>Message <span className='text-red-500'>*</span></Label>
                                <Textarea rows={6} value={form.message} onChange={onChange('message')} required />
                            </div>
                            <ButtonLoading loading={loading} type='submit' text='Send message' />
                        </form>
                    )}
                </div>
            </div>
        </div>
    )
}

export default ContactUs
