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
        <div className={`relative border p-5 transition ${address.isDefault ? 'border-[#C9A24B] bg-[#C9A24B]/10' : 'border-[#C9A24B]/20 hover:border-[#C9A24B]/40'}`}>
            {address.isDefault && (
                <span className='absolute -top-2.5 left-4 bg-gradient-to-r from-[#C9A24B] to-[#F0D77C] text-[#0a0805] text-xs px-2 py-0.5 flex items-center gap-1'>
                    <FiStar size={11} /> Default
                </span>
            )}

            <div className='flex justify-between items-start mb-3 gap-2'>
                <div className='min-w-0'>
                    <h4 className='font-semibold truncate text-white'>{address.label || 'Address'}</h4>
                    {address.fullName && (
                        <p className='text-sm text-white/60 truncate'>{address.fullName}</p>
                    )}
                </div>
            </div>

            <div className='text-sm text-white/50 space-y-1 mb-4'>
                <p>{address.line1}</p>
                {address.line2 && <p>{address.line2}</p>}
                {address.landmark && <p className='text-xs text-white/40'>Near {address.landmark}</p>}
                <p>{address.city}, {address.state} {address.pincode}</p>
                <p>{address.country}</p>
                <p className='font-medium pt-1 text-white/70'>{address.phone}</p>
            </div>

            <div className='flex gap-2 flex-wrap'>
                {!address.isDefault && (
                    <Button
                        size="sm"
                        variant="outline"
                        type="button"
                        onClick={() => onSetDefault(address)}
                        disabled={busy}
                        className='cursor-pointer border-[#C9A24B]/30 text-[#C9A24B] hover:bg-[#C9A24B]/10 hover:text-[#F0D77C]'
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
                    className='cursor-pointer text-red-400 hover:text-red-300 hover:bg-red-500/10'
                >
                    <FiTrash2 size={14} className='mr-1' /> Delete
                </Button>
            </div>
        </div>
    )
}

export default AddressCard
