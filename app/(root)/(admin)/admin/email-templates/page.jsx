'use client'
import BreadCrumb from '@/components/Application/Admin/BreadCrumb'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import axios from '@/lib/apiClient'
import { showToast } from '@/lib/showToast'
import {
    ADMIN_DASHBOARD,
    ADMIN_EMAIL_TEMPLATES_SHOW,
    ADMIN_EMAIL_TEMPLATE_EDIT,
} from '@/routes/AdminPanelRoute'
import useFetch from '@/hooks/useFetch'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FiCheckCircle, FiEdit, FiFile } from 'react-icons/fi'

const breadcrumbData = [
    { href: ADMIN_DASHBOARD, label: 'Home' },
    { href: ADMIN_EMAIL_TEMPLATES_SHOW, label: 'Email templates' },
]

const ShowEmailTemplates = () => {
    const router = useRouter()
    const { data, loading, refetch } = useFetch('/api/admin/email-templates')
    const templates = data?.data || []
    const catalog = data?.meta?.catalog || []
    const [creating, setCreating] = useState(null)

    const templatesByCode = useMemo(() => {
        const map = new Map()
        for (const t of templates) map.set(t.code, t)
        return map
    }, [templates])

    const seedAndEdit = async (entry) => {
        setCreating(entry.code)
        try {
            const { data: res } = await axios.post('/api/admin/email-templates', {
                code: entry.code,
                name: entry.name,
                description: entry.description || '',
                subject: `${entry.name} — sample subject`,
                body: `<p>Hello {{customer.name}},</p>\n<p>This is the ${entry.name} email. Edit me!</p>`,
                isActive: false,
            })
            if (!res?.success) throw new Error(res?.message)
            showToast('success', res.message)
            router.push(ADMIN_EMAIL_TEMPLATE_EDIT(res.data._id))
        } catch (err) {
            showToast('error', err.message)
        } finally {
            setCreating(null)
        }
    }

    return (
        <div>
            <BreadCrumb breadcrumbData={breadcrumbData} />
            <Card className='py-0 rounded shadow-sm'>
                <CardHeader className='pt-3 px-3 border-b [.border-b]:pb-2'>
                    <h4 className='text-xl font-semibold'>Email templates</h4>
                    <p className='text-xs text-gray-500 mt-1'>
                        Edit the email customers receive at each lifecycle event. Inactive templates fall back to the hardcoded defaults shipped with the app.
                    </p>
                </CardHeader>
                <CardContent className='p-0'>
                    {loading ? (
                        <div className='p-10 text-center text-gray-500'>Loading…</div>
                    ) : (
                        <ul className='divide-y'>
                            {catalog.map((entry) => {
                                const existing = templatesByCode.get(entry.code)
                                return (
                                    <li key={entry.code} className='px-5 py-4 flex items-start justify-between gap-4'>
                                        <div className='min-w-0 flex-1'>
                                            <div className='flex items-center gap-2'>
                                                <p className='font-medium'>{entry.name}</p>
                                                {existing
                                                    ? existing.isActive
                                                        ? <span className='text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 inline-flex items-center gap-1'><FiCheckCircle size={10} /> Active</span>
                                                        : <span className='text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800'>Draft</span>
                                                    : <span className='text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 inline-flex items-center gap-1'><FiFile size={10} /> File fallback</span>
                                                }
                                            </div>
                                            <p className='text-xs font-mono text-gray-400 mt-0.5'>{entry.code}</p>
                                            <p className='text-sm text-gray-500 mt-1'>{entry.description}</p>
                                        </div>
                                        {existing ? (
                                            <Button asChild variant='outline' size='sm'>
                                                <Link href={ADMIN_EMAIL_TEMPLATE_EDIT(existing._id)} className='inline-flex items-center gap-1'>
                                                    <FiEdit size={12} /> Edit
                                                </Link>
                                            </Button>
                                        ) : (
                                            <Button
                                                type='button'
                                                size='sm'
                                                disabled={creating === entry.code}
                                                onClick={() => seedAndEdit(entry)}
                                            >
                                                {creating === entry.code ? 'Creating…' : 'Create override'}
                                            </Button>
                                        )}
                                    </li>
                                )
                            })}
                        </ul>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

export default ShowEmailTemplates
