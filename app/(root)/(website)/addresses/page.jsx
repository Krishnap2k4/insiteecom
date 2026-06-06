'use client'
import { Button } from '@/components/ui/button'
import {
    Dialog, DialogContent, DialogDescription, DialogFooter,
    DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import UserPanelLayout from '@/components/Application/Website/UserPanelLayout'
import WebsiteBreadcrumb from '@/components/Application/Website/WebsiteBreadcrumb'
import AddressForm from '@/components/Application/Website/AddressForm'
import AddressCard from '@/components/Application/Website/AddressCard'
import axios from '@/lib/apiClient'
import { showToast } from '@/lib/showToast'
import { USER_ADDRESSES, WEBSITE_LOGIN } from '@/routes/WebsiteRoute'
import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import Link from 'next/link'
import { FiMapPin, FiPlus } from 'react-icons/fi'

const breadCrumbData = {
    title: 'My Addresses',
    links: [{ label: 'Addresses' }],
}

const AddressBookPage = () => {
    const authStore = useSelector((s) => s.authStore)
    const isLoggedIn = Boolean(authStore?.auth)

    const [addresses, setAddresses] = useState([])
    const [loading, setLoading] = useState(true)
    const [busy, setBusy] = useState(false)

    const [formOpen, setFormOpen] = useState(false)
    const [editing, setEditing] = useState(null)
    const [deleting, setDeleting] = useState(null)

    const loadAddresses = async () => {
        try {
            const { data: res } = await axios.get('/api/account/addresses')
            if (res.success) {
                setAddresses(res.data || [])
            }
        } catch (err) {
            showToast('error', 'Could not load addresses.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (isLoggedIn) loadAddresses()
        else setLoading(false)
    }, [isLoggedIn])

    const handleSubmit = async (values) => {
        setBusy(true)
        try {
            const { data: res } = editing
                ? await axios.put(`/api/account/addresses/${editing._id}`, values)
                : await axios.post('/api/account/addresses', values)

            if (!res.success) throw new Error(res.message)
            showToast('success', res.message)
            setFormOpen(false)
            setEditing(null)
            await loadAddresses()
        } catch (err) {
            showToast('error', err.message)
        } finally {
            setBusy(false)
        }
    }

    const handleDelete = async () => {
        if (!deleting) return
        setBusy(true)
        try {
            const { data: res } = await axios.delete(`/api/account/addresses/${deleting._id}`)
            if (!res.success) throw new Error(res.message)
            showToast('success', res.message)
            setDeleting(null)
            await loadAddresses()
        } catch (err) {
            showToast('error', err.message)
        } finally {
            setBusy(false)
        }
    }

    const handleSetDefault = async (address) => {
        setBusy(true)
        try {
            const { data: res } = await axios.post(`/api/account/addresses/${address._id}/default`)
            if (!res.success) throw new Error(res.message)
            showToast('success', res.message)
            await loadAddresses()
        } catch (err) {
            showToast('error', err.message)
        } finally {
            setBusy(false)
        }
    }

    const openAddDialog = () => {
        setEditing(null)
        setFormOpen(true)
    }

    const openEditDialog = (address) => {
        setEditing(address)
        setFormOpen(true)
    }

    return (
        <div>
            <WebsiteBreadcrumb props={breadCrumbData} />
            <UserPanelLayout>
                <div className='border border-[#C9A24B]/20 bg-[#0a0805]'>
                    <div className='p-5 flex items-center justify-between border-b border-[#C9A24B]/20 gap-3'>
                        <h2 className='text-xl font-serif-display text-[#F0D77C]'>Saved Addresses</h2>
                        {isLoggedIn && (
                            <Dialog open={formOpen} onOpenChange={(open) => {
                                setFormOpen(open)
                                if (!open) setEditing(null)
                            }}>
                                <DialogTrigger asChild>
                                    <Button type="button" onClick={openAddDialog} className='cursor-pointer btn-dark-gold py-2 px-4 uppercase tracking-widest text-xs font-semibold'>
                                        <FiPlus className='mr-1' /> Add address
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto bg-[#0a0805] border-[#C9A24B]/30'>
                                    <DialogHeader>
                                        <DialogTitle>{editing ? 'Edit address' : 'Add a new address'}</DialogTitle>
                                        <DialogDescription>
                                            Used at checkout. You can edit or remove this any time.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <AddressForm
                                        initialValues={editing}
                                        onSubmit={handleSubmit}
                                        loading={busy}
                                        submitLabel={editing ? 'Save changes' : 'Add address'}
                                    />
                                </DialogContent>
                            </Dialog>
                        )}
                    </div>

                    <div className='p-5'>
                        {!isLoggedIn && (
                            <div className='py-10 text-center'>
                                <FiMapPin className='mx-auto text-[#C9A24B]/30 mb-3' size={48} />
                                <p className='text-white/50 mb-4'>Sign in to manage your saved addresses.</p>
                                <Link href={WEBSITE_LOGIN} className='btn-dark-gold px-6 py-2.5 uppercase tracking-widest text-xs font-semibold'>Sign in</Link>
                            </div>
                        )}

                        {isLoggedIn && loading && (
                            <div className='grid md:grid-cols-2 gap-4'>
                                {[0, 1].map((i) => (
                                    <div key={i} className='border border-[#C9A24B]/20 p-5 animate-pulse'>
                                        <div className='h-4 w-24 bg-white/10 rounded mb-3'></div>
                                        <div className='h-3 w-full bg-white/5 rounded mb-2'></div>
                                        <div className='h-3 w-3/4 bg-white/5 rounded mb-2'></div>
                                        <div className='h-3 w-1/2 bg-white/5 rounded'></div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {isLoggedIn && !loading && addresses.length === 0 && (
                            <div className='py-10 text-center'>
                                <FiMapPin className='mx-auto text-[#C9A24B]/30 mb-3' size={48} />
                                <p className='text-white/50 mb-4'>You have no saved addresses yet.</p>
                                <button type='button' onClick={openAddDialog} className='btn-dark-gold px-6 py-2.5 uppercase tracking-widest text-xs font-semibold cursor-pointer'>
                                    <FiPlus className='mr-1 inline' /> Add your first address
                                </button>
                            </div>
                        )}

                        {isLoggedIn && !loading && addresses.length > 0 && (
                            <div className='grid md:grid-cols-2 gap-4'>
                                {addresses.map((a) => (
                                    <AddressCard
                                        key={a._id}
                                        address={a}
                                        onEdit={openEditDialog}
                                        onDelete={setDeleting}
                                        onSetDefault={handleSetDefault}
                                        busy={busy}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </UserPanelLayout>

            <Dialog open={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(null)}>
                <DialogContent className='max-w-md bg-[#0a0805] border-[#C9A24B]/30'>
                    <DialogHeader>
                        <DialogTitle>Delete this address?</DialogTitle>
                        <DialogDescription>
                            This will remove the address from your address book. It can&apos;t be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className='gap-2'>
                        <Button type="button" variant="outline" onClick={() => setDeleting(null)} disabled={busy} className='cursor-pointer'>
                            Cancel
                        </Button>
                        <Button type="button" variant="destructive" onClick={handleDelete} disabled={busy} className='cursor-pointer'>
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default AddressBookPage
