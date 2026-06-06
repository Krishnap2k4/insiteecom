'use client'
import * as React from 'react'
import { useState } from 'react'
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { CheckIcon, ChevronDown, XIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '../ui/badge'

/**
 * Combobox-style select used by every admin form (coupon, campaign,
 * variant, etc.). Supports single and multi modes.
 *
 * Defensive notes:
 *   - `options` may be empty or stale on first render (the parent's
 *     useFetch hasn't returned yet, the row references a soft-deleted
 *     id, etc.). We must never assume `options.find(...)` returns a
 *     match — always fall back to rendering the raw value as a label.
 *   - `selected` for multi mode must always be treated as an array,
 *     even if the parent passes `null`/`undefined` (we coerce).
 */
function Select({
    options,
    selected,
    setSelected,
    placeholder = 'Select options',
    isMulti = false,
}) {
    const [open, setOpen] = useState(false)

    // Normalise inputs so the body of the component never crashes on
    // unexpected shapes.
    const safeOptions = Array.isArray(options) ? options : []
    const safeSelected = isMulti
        ? (Array.isArray(selected) ? selected : [])
        : (selected ?? null)

    const labelForValue = (value) => {
        const opt = safeOptions.find((o) => o.value === value)
        return opt?.label ?? String(value ?? '')
    }

    const handleSelect = (option) => {
        if (isMulti) {
            if (safeSelected.includes(option.value)) {
                setSelected(safeSelected.filter((s) => s !== option.value))
            } else {
                setSelected([...safeSelected, option.value])
            }
        } else {
            setSelected(option.value)
            setOpen(false)
        }
    }

    const handleRemove = (value) => {
        setSelected(safeSelected.filter((s) => s !== value))
    }

    const handleClearAll = () => {
        setSelected(isMulti ? [] : null)
    }

    const hasSelection = isMulti
        ? safeSelected.length > 0
        : safeSelected !== null && safeSelected !== undefined && safeSelected !== ''

    return (
        <Popover open={open} onOpenChange={setOpen} modal={false}>
            <PopoverTrigger className='w-full' asChild>
                <Button
                    variant='outline'
                    role='combobox'
                    aria-expanded={open}
                    className='justify-between dark:bg-card'
                >
                    <div>
                        {isMulti && safeSelected.length > 0 ? (
                            safeSelected.map((value) => (
                                <Badge key={value} className='me-2'>
                                    {labelForValue(value)}
                                    <span
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            handleRemove(value)
                                        }}
                                    >
                                        <XIcon className='ml-2 h-4 w-4 cursor-pointer' />
                                    </span>
                                </Badge>
                            ))
                        ) : (
                            !isMulti && hasSelection
                                ? labelForValue(safeSelected)
                                : placeholder
                        )}
                    </div>

                    <div className='flex items-center gap-2'>
                        {hasSelection && (
                            <span onClick={(e) => { e.stopPropagation(); handleClearAll() }}>
                                <XIcon className='h-4 w-4 shrink-0 opacity-50' />
                            </span>
                        )}
                        <ChevronDown className='h-4 w-4 shrink-0 opacity-50' />
                    </div>
                </Button>
            </PopoverTrigger>
            <PopoverContent align='start' className='p-0'>
                <Command>
                    <CommandList>
                        <CommandInput placeholder='Search options...' />
                        <CommandEmpty>No options found.</CommandEmpty>
                        <CommandGroup>
                            {safeOptions.map((option) => {
                                const isChecked = isMulti
                                    ? safeSelected.includes(option.value)
                                    : safeSelected === option.value
                                return (
                                    <CommandItem
                                        key={option.value}
                                        value={option.label}
                                        onSelect={() => handleSelect(option)}
                                        onMouseDown={(e) => {
                                            e.preventDefault()
                                            handleSelect(option)
                                        }}
                                    >
                                        {option.label}
                                        <CheckIcon
                                            className={cn(
                                                'ml-auto h-4 w-4',
                                                isChecked ? 'opacity-100' : 'opacity-0',
                                            )}
                                        />
                                    </CommandItem>
                                )
                            })}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}

export default Select
