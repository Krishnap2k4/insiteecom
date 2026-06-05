'use client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useState } from 'react'
import { FiPlus, FiTrash2, FiX } from 'react-icons/fi'

/**
 * Per-product Options editor (Shopify model).
 *
 *   options: [
 *     { name: 'Color', values: ['Red', 'Blue', 'Green'] },
 *     { name: 'Size',  values: ['S', 'M', 'L'] },
 *   ]
 *
 * Up to 3 options per product. Each option carries a name (free-text)
 * and a list of allowed values rendered as removable chips. The form
 * is intentionally simple — there's no global catalog to pick from;
 * admins type whatever makes sense for their product.
 */
const MAX_OPTIONS = 3

const OptionsEditor = ({ value = [], onChange }) => {
    const [drafts, setDrafts] = useState(() => value.map(() => ''))

    const commit = (next) => {
        onChange(next)
        if (next.length !== drafts.length) setDrafts(next.map(() => ''))
    }

    const addOption = () => {
        if (value.length >= MAX_OPTIONS) return
        commit([...value, { name: '', values: [], position: value.length + 1 }])
        setDrafts((prev) => [...prev, ''])
    }

    const removeOption = (idx) => {
        const next = value.filter((_, i) => i !== idx).map((o, i) => ({ ...o, position: i + 1 }))
        commit(next)
        setDrafts((prev) => prev.filter((_, i) => i !== idx))
    }

    const updateName = (idx, name) => {
        commit(value.map((o, i) => (i === idx ? { ...o, name } : o)))
    }

    const addValue = (idx) => {
        const raw = (drafts[idx] || '').trim()
        if (!raw) return
        const opt = value[idx]
        if (opt.values.includes(raw)) {
            setDrafts((prev) => prev.map((d, i) => (i === idx ? '' : d)))
            return
        }
        commit(value.map((o, i) => (i === idx ? { ...o, values: [...o.values, raw] } : o)))
        setDrafts((prev) => prev.map((d, i) => (i === idx ? '' : d)))
    }

    const removeValue = (idx, valIdx) => {
        commit(value.map((o, i) => (
            i === idx ? { ...o, values: o.values.filter((_, vi) => vi !== valIdx) } : o
        )))
    }

    const handleKey = (e, idx) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault()
            addValue(idx)
        }
    }

    if (value.length === 0) {
        return (
            <div className='border border-dashed rounded p-6 text-center'>
                <p className='text-sm text-gray-600 mb-3'>
                    This product is sold as a <strong>single SKU</strong>. Add options if it comes in multiple choices (e.g. Color, Size).
                </p>
                <Button type='button' variant='outline' onClick={addOption} className='cursor-pointer'>
                    <FiPlus className='mr-1' /> Add option
                </Button>
            </div>
        )
    }

    return (
        <div className='space-y-4'>
            {value.map((opt, idx) => (
                <div key={idx} className='border rounded p-4 bg-gray-50/50'>
                    <div className='flex items-start gap-3 flex-wrap'>
                        <div className='flex-1 min-w-[200px]'>
                            <Label className='mb-2 block'>Option name</Label>
                            <Input
                                placeholder='Color, Size, Material…'
                                value={opt.name}
                                onChange={(e) => updateName(idx, e.target.value)}
                            />
                        </div>
                        <Button
                            type='button'
                            variant='ghost'
                            size='sm'
                            onClick={() => removeOption(idx)}
                            className='cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50 mt-7'
                            title='Remove option'
                        >
                            <FiTrash2 size={14} />
                        </Button>
                    </div>

                    <div className='mt-3'>
                        <Label className='mb-2 block'>Values</Label>
                        <div className='border rounded-md p-2 bg-white'>
                            <div className='flex flex-wrap items-center gap-1'>
                                {opt.values.map((v, vi) => (
                                    <span key={vi} className='flex items-center gap-1 bg-primary/10 text-primary text-xs px-2 py-1 rounded-full'>
                                        {v}
                                        <button type='button' onClick={() => removeValue(idx, vi)} className='hover:text-red-600 cursor-pointer' aria-label={`Remove ${v}`}>
                                            <FiX size={12} />
                                        </button>
                                    </span>
                                ))}
                                <Input
                                    type='text'
                                    value={drafts[idx] || ''}
                                    onChange={(e) => setDrafts((prev) => prev.map((d, i) => (i === idx ? e.target.value : d)))}
                                    onKeyDown={(e) => handleKey(e, idx)}
                                    onBlur={() => addValue(idx)}
                                    placeholder={opt.values.length === 0 ? `Type a value and press Enter…` : ''}
                                    className='border-none shadow-none focus-visible:ring-0 px-1 flex-1 min-w-[120px] h-7'
                                />
                            </div>
                        </div>
                    </div>
                </div>
            ))}

            {value.length < MAX_OPTIONS && (
                <Button type='button' variant='outline' onClick={addOption} className='cursor-pointer'>
                    <FiPlus className='mr-1' /> Add another option
                </Button>
            )}
            {value.length >= MAX_OPTIONS && (
                <p className='text-xs text-gray-500'>Maximum of {MAX_OPTIONS} options per product.</p>
            )}
        </div>
    )
}

export default OptionsEditor
