/**
 * Storefront loading state — shown by Next.js while a server component
 * in this segment is resolving its data. Replaces the blank screen that
 * otherwise appears during navigation under poor network conditions.
 *
 * Kept lightweight and brand-consistent (matches the gold-shine theme).
 */
const Loading = () => (
    <div className='min-h-[60vh] flex flex-col items-center justify-center px-5 py-24 gap-6'>
        <div className='flex items-center gap-3 text-[#C9A24B]'>
            <span className='h-px w-12 bg-gradient-to-r from-transparent to-[#C9A24B]' />
            <span className='text-[10px] tracking-[0.4em] uppercase text-[#F0D77C]'>Loading</span>
            <span className='h-px w-12 bg-gradient-to-l from-transparent to-[#C9A24B]' />
        </div>
        <div className='relative w-10 h-10'>
            <span className='absolute inset-0 rounded-full border border-[#C9A24B]/20' />
            <span className='absolute inset-0 rounded-full border border-transparent border-t-[#F0D77C] border-r-[#C9A24B] animate-spin' style={{ animationDuration: '1s' }} />
        </div>
    </div>
)

export default Loading
