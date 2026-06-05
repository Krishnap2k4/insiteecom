'use client'
import { Input } from '@/components/ui/input'
import { useState } from 'react'
import { FiX } from 'react-icons/fi'

/**
 * Minimal chip-style tag input. Comma or Enter commits a chip;
 * Backspace on empty input removes the last chip. Values are stored
 * lowercase and trimmed to match the Product schema.
 */
const TagsInput = ({ value = [], onChange, placeholder = 'Type a tag and press Enter…' }) => {
    const [draft, setDraft] = useState('')

    const commit = (raw) => {
        const next = String(raw || '').trim().toLowerCase()
        if (!next) return
        if (value.includes(next)) return
        onChange([...value, next])
    }

    const handleKey = (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault()
            commit(draft)
            setDraft('')
        } else if (e.key === 'Backspace' && draft === '' && value.length > 0) {
            onChange(value.slice(0, -1))
        }
    }

    const remove = (idx) => {
        onChange(value.filter((_, i) => i !== idx))
    }

    return (
        <div className='border rounded-md p-2 focus-within:ring-1 focus-within:ring-ring/30 bg-white dark:bg-card'>
            <div className='flex flex-wrap items-center gap-1'>
                {value.map((tag, idx) => (
                    <span key={idx} className='flex items-center gap-1 bg-primary/10 text-primary text-xs px-2 py-1 rounded-full'>
                        {tag}
                        <button type='button' onClick={() => remove(idx)} className='hover:text-red-600 cursor-pointer' aria-label={`Remove ${tag}`}>
                            <FiX size={12} />
                        </button>
                    </span>
                ))}
                <Input
                    type='text'
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={handleKey}
                    onBlur={() => { if (draft.trim()) { commit(draft); setDraft('') } }}
                    placeholder={value.length === 0 ? placeholder : ''}
                    className='border-none shadow-none focus-visible:ring-0 px-1 flex-1 min-w-[120px] h-7'
                />
            </div>
        </div>
    )
}

export default TagsInput
