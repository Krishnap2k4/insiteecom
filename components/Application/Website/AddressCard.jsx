'use client'
import { Button } from '@/components/ui/button'
import { FiEdit2, FiTrash2, FiStar, FiCheck } from 'react-icons/fi'

/**
 * Single address tile in the address book grid. Stays presentational —
 * actions (edit / delete / set-default) bubble up via callbacks so the
 * parent owns the API calls and dialog state.
 */
const AddressCard = ({ address, onEdit, onDelete, onSetDefault, busy }) => {
    return (
        <div className={`relative border rounded-lg p-5 transition ${address.isDefault ? 'border-primary shadow-sm bg-primary/5' : 'border-gray-200 hover:border-gray-300'}`}>
            {address.isDefault && (
                <span className='absolute -top-2.5 left-4 bg-primary text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1'>
                    <FiStar size={11} /> Default
                </span>
            )}

            <div className='flex justify-between items-start mb-3 gap-2'>
                <div className='min-w-0'>
                    <h4 className='font-semibold truncate'>{address.label || 'Address'}</h4>
                    {address.fullName && (
                        <p className='text-sm text-gray-700 truncate'>{address.fullName}</p>
                    )}
                </div>
            </div>

            <div className='text-sm text-gray-600 space-y-1 mb-4'>
                <p>{address.line1}</p>
                {address.line2 && <p>{address.line2}</p>}
                {address.landmark && <p className='text-xs text-gray-500'>Near {address.landmark}</p>}
                <p>{address.city}, {address.state} {address.pincode}</p>
                <p>{address.country}</p>
                <p className='font-medium pt-1'>{address.phone}</p>
            </div>

            <div className='flex gap-2 flex-wrap'>
                {!address.isDefault && (
                    <Button
                        size="sm"
                        variant="outline"
                        type="button"
                        onClick={() => onSetDefault(address)}
                        disabled={busy}
                        className='cursor-pointer'
                    >
                        <FiCheck size={14} className='mr-1' /> Set as default
                    </Button>
                )}
                <Button
                    size="sm"
                    variant="ghost"
                    type="button"
                    onClick={() => onEdit(address)}
                    disabled={busy}
                    className='cursor-pointer'
                >
                    <FiEdit2 size={14} className='mr-1' /> Edit
                </Button>
                <Button
                    size="sm"
                    variant="ghost"
                    type="button"
                    onClick={() => onDelete(address)}
                    disabled={busy}
                    className='cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50'
                >
                    <FiTrash2 size={14} className='mr-1' /> Delete
                </Button>
            </div>
        </div>
    )
}

export default AddressCard
