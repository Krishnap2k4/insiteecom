import React from 'react'
import { sortings } from '@/lib/utils'
import { SlidersHorizontal, ChevronDown } from 'lucide-react'

const Sorting = ({ sorting, setSorting, mobileFilterOpen, setMobileFilterOpen, total, page, pageSize }) => {
    // Human-readable summary: "Showing 13–24 of 87"
    const summary = (() => {
        if (!total) return null
        const start = page * pageSize + 1
        const end   = Math.min(total, (page + 1) * pageSize)
        return `${start.toLocaleString('en-IN')}–${end.toLocaleString('en-IN')} of ${total.toLocaleString('en-IN')}`
    })()

    return (
        <div className='flex justify-between items-center flex-wrap gap-3 p-4 bg-gradient-to-r from-[#0e0e0e] via-[#15110a] to-[#0e0e0e] border border-[#C9A24B]/20'>
            <button
                type="button"
                className="lg:hidden flex items-center gap-2 text-[11px] tracking-[0.25em] uppercase text-white/80 border border-[#C9A24B]/30 px-4 py-2.5 hover:border-[#F0D77C]/60 transition-colors cursor-pointer"
                onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
            >
                <SlidersHorizontal size={14} className='text-[#F0D77C]' />
                Filter
            </button>

            {/* Result count */}
            {summary && (
                <div className='text-[10px] tracking-[0.2em] uppercase text-white/50'>
                    <span className='hidden md:inline text-white/40'>Showing </span>
                    <span className='text-[#F0D77C]/80 font-medium'>{summary}</span>
                </div>
            )}

            {/* Sort selector */}
            <div className='flex items-center gap-2'>
                <span className='text-[10px] tracking-[0.2em] uppercase text-white/40 hidden md:inline'>Sort by</span>
                <div className='relative'>
                    <select
                        value={sorting}
                        onChange={(e) => setSorting(e.target.value)}
                        className='text-xs border border-[#C9A24B]/30 px-3 py-1.5 bg-[#0a0805] text-white/80 appearance-none pr-7 cursor-pointer focus:border-[#F0D77C] focus:outline-none md:w-[180px] w-[150px]'
                    >
                        {sortings.map(option => (
                            <option key={option.value} value={option.value} className='bg-[#0a0805] text-white'>{option.label}</option>
                        ))}
                    </select>
                    <ChevronDown size={12} className='absolute right-2 top-1/2 -translate-y-1/2 text-[#C9A24B] pointer-events-none' />
                </div>
            </div>
        </div>
    )
}

export default Sorting
