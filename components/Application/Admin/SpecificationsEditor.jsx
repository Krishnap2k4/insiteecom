'use client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FiPlus, FiTrash2 } from 'react-icons/fi'

/**
 * Simple key/value editor for product specifications.
 *
 *   specifications: [
 *     { name: 'Material', value: 'Cotton' },
 *     { name: 'Country of origin', value: 'India' },
 *   ]
 *
 * Static product info — different from options (which drive variants).
 * Rendered as a Specifications table on the storefront product page.
 */
const SpecificationsEditor = ({ value = [], onChange }) => {
    const addRow = () => onChange([...value, { name: '', value: '' }])
    const removeRow = (idx) => onChange(value.filter((_, i) => i !== idx))
    const updateRow = (idx, patch) => onChange(value.map((row, i) => (i === idx ? { ...row, ...patch } : row)))

    return (
        <div className='space-y-2'>
            {value.length === 0 ? (
                <p className='text-sm text-gray-500 py-2'>
                    No specifications yet. Add static info like Material, Country of origin, Care instructions.
                </p>
            ) : (
                value.map((row, idx) => (
                    <div key={idx} className='grid grid-cols-1 md:grid-cols-12 gap-2 items-end bg-white border rounded p-3'>
                        <div className='md:col-span-4'>
                            <Input
                                placeholder='Material'
                                value={row.name || ''}
                                onChange={(e) => updateRow(idx, { name: e.target.value })}
                            />
                        </div>
                        <div className='md:col-span-7'>
                            <Input
                                placeholder='Cotton'
                                value={row.value || ''}
                                onChange={(e) => updateRow(idx, { value: e.target.value })}
                            />
                        </div>
                        <div className='md:col-span-1 flex justify-end'>
                            <Button type='button' size='sm' variant='ghost' onClick={() => removeRow(idx)} className='cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50'>
                                <FiTrash2 size={14} />
                            </Button>
                        </div>
                    </div>
                ))
            )}
            <Button type='button' size='sm' variant='outline' onClick={addRow} className='cursor-pointer'>
                <FiPlus size={13} className='mr-1' /> Add specification
            </Button>
        </div>
    )
}

export default SpecificationsEditor
