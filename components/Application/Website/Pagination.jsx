'use client'
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react'

/**
 * Build the displayed page list with leading/trailing context and ellipsis.
 *
 *   total ≤ 7         → show all pages
 *   current near start → 1 [2] 3 4 5 … 20
 *   current in middle  → 1 … 8 9 [10] 11 12 … 20
 *   current near end   → 1 … 16 17 18 19 [20]
 */
const buildPageList = (current, total) => {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

    const pages = new Set([1, total, current, current - 1, current + 1])
    if (current <= 4)          [2, 3, 4, 5].forEach((p) => pages.add(p))
    if (current >= total - 3)  [total - 4, total - 3, total - 2, total - 1].forEach((p) => pages.add(p))

    const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b)
    const out = []
    for (let i = 0; i < sorted.length; i++) {
        if (i > 0 && sorted[i] - sorted[i - 1] > 1) out.push('…')
        out.push(sorted[i])
    }
    return out
}

const BASE_BTN = 'h-9 min-w-9 px-3 text-[11px] tracking-[0.15em] uppercase border border-[#C9A24B]/30 text-white/70 hover:text-[#F0D77C] hover:border-[#C9A24B] hover:bg-[#C9A24B]/10 transition-colors cursor-pointer inline-flex items-center justify-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-white/70 disabled:hover:border-[#C9A24B]/30'

const ACTIVE_BTN = 'h-9 min-w-9 px-3 text-[11px] tracking-[0.15em] uppercase border border-[#F0D77C] bg-gradient-to-r from-[#C9A24B] to-[#F0D77C] text-[#0a0805] font-semibold inline-flex items-center justify-center cursor-default'

/**
 * Numbered pagination matching the storefront's dark-gold aesthetic.
 * `page` and `onPageChange` are 0-indexed to match the API.
 */
const Pagination = ({ page, totalPages, onPageChange, disabled = false, className = '' }) => {
    if (!totalPages || totalPages <= 1) return null

    const current = page + 1
    const list = buildPageList(current, totalPages)

    const go = (next) => {
        if (disabled || next === page || next < 0 || next >= totalPages) return
        onPageChange(next)
    }

    return (
        <nav aria-label='Pagination' className={`flex items-center justify-center flex-wrap gap-2 ${className}`}>
            {/* Previous */}
            <button
                type='button'
                onClick={() => go(page - 1)}
                disabled={disabled || page === 0}
                className={BASE_BTN}
                aria-label='Previous page'
            >
                <ChevronLeft size={13} />
                <span className='hidden sm:inline'>Prev</span>
            </button>

            {/* Page numbers */}
            {list.map((p, i) =>
                p === '…' ? (
                    <span key={`gap-${i}`} className='inline-flex items-center justify-center w-7 text-white/40' aria-hidden='true'>
                        <MoreHorizontal size={14} />
                    </span>
                ) : p === current ? (
                    <span key={p} className={ACTIVE_BTN} aria-current='page'>{p}</span>
                ) : (
                    <button
                        key={p}
                        type='button'
                        onClick={() => go(p - 1)}
                        disabled={disabled}
                        className={BASE_BTN}
                        aria-label={`Go to page ${p}`}
                    >
                        {p}
                    </button>
                )
            )}

            {/* Next */}
            <button
                type='button'
                onClick={() => go(page + 1)}
                disabled={disabled || page >= totalPages - 1}
                className={BASE_BTN}
                aria-label='Next page'
            >
                <span className='hidden sm:inline'>Next</span>
                <ChevronRight size={13} />
            </button>
        </nav>
    )
}

export default Pagination
