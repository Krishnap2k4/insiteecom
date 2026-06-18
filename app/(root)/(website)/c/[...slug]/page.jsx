import ProductBox from '@/components/Application/Website/ProductBox'
import { Button } from '@/components/ui/button'
import axios from '@/lib/apiClient'
import { getApiBaseUrl } from '@/lib/serverApiUrl'
import { WEBSITE_CATEGORY, WEBSITE_HOME, WEBSITE_SHOP } from '@/routes/WebsiteRoute'
import Image from 'next/image'
import Link from 'next/link'
import { FiChevronRight } from 'react-icons/fi'
import imgPlaceholder from '@/public/assets/images/img-placeholder.webp'

const CategoryNotFound = ({ path }) => (
    <div className='min-h-[60vh] flex items-center justify-center px-4 bg-dark-gold pt-[120px]'>
        <div className='max-w-md text-center'>
            <p className='text-7xl font-serif-display gold-text mb-2'>404</p>
            <h1 className='text-2xl font-serif-display text-white mb-3'>Category not found</h1>
            <p className='text-white/50 mb-8'>We couldn&apos;t find a category at <span className='font-mono text-[#F0D77C]'>/c/{path}</span>.</p>
            <div className='flex gap-3 justify-center'>
                <Link href={WEBSITE_SHOP} className='btn-dark-gold px-6 py-2.5 text-xs font-semibold uppercase tracking-widest'>
                    Browse shop
                </Link>
                <Link href={WEBSITE_HOME} className='btn-outline-gold px-6 py-2.5 text-xs font-semibold uppercase tracking-widest'>
                    Go home
                </Link>
            </div>
        </div>
    </div>
)

/**
 * Hierarchical category browse. Catches any depth — `/c/men`,
 * `/c/men/shirts`, `/c/men/shirts/casual`. Server-rendered: API call
 * returns the category + ancestors (breadcrumb) + child categories
 * + products in this category or any descendant.
 */
const CategoryPage = async ({ params }) => {
    const { slug } = await params
    const path = Array.isArray(slug) ? slug.join('/') : slug

    let res = null
    try {
        const baseUrl = await getApiBaseUrl()
        if (!baseUrl) throw new Error('API base URL unavailable')
        const url = `${baseUrl}/category/by-path?path=${encodeURIComponent(path)}`
        const { data } = await axios.get(url)
        res = data
    } catch (err) {
        console.error('[c/[...slug]] fetch failed:', err?.message || err)
        return <CategoryNotFound path={path} />
    }

    if (!res?.success) return <CategoryNotFound path={path} />

    const { category, ancestors = [], children = [], products = [], meta } = res.data

    return (
        <div className="bg-dark-gold min-h-screen pt-[120px]">
            <div className='h-px w-full bg-gradient-to-r from-transparent via-[#C9A24B] to-transparent'></div>

            {/* Hero / header */}
            <section className='bg-gradient-to-b from-[#0e0e0e] to-[#0a0805] border-b border-[#C9A24B]/20'>
                <div className='max-w-7xl mx-auto px-4 lg:px-8 py-10'>
                    {/* Breadcrumb */}
                    <nav className='text-xs tracking-wider uppercase text-white/50 mb-4 flex items-center gap-2 flex-wrap'>
                        <Link href={WEBSITE_HOME} className='hover:text-[#F0D77C] transition-colors'>Home</Link>
                        {ancestors.map((a) => (
                            <span key={a._id} className='flex items-center gap-2'>
                                <FiChevronRight size={12} className="text-[#C9A24B]/50" />
                                <Link href={WEBSITE_CATEGORY(a.path)} className='hover:text-[#F0D77C] transition-colors'>{a.name}</Link>
                            </span>
                        ))}
                        <span className='flex items-center gap-2 text-[#F0D77C]'>
                            <FiChevronRight size={12} className="text-[#C9A24B]/50" />
                            <span className='font-semibold'>{category.name}</span>
                        </span>
                    </nav>

                    <div className='flex items-center justify-between gap-4 flex-wrap'>
                        <div>
                            <h1 className='text-4xl lg:text-5xl font-serif-display gold-shine mb-2'>{category.name}</h1>
                            {category.description && (
                                <p className='text-white/60 max-w-2xl text-sm leading-relaxed'>{category.description}</p>
                            )}
                            <p className='text-xs tracking-widest uppercase text-[#C9A24B] mt-4'>
                                {meta?.total ?? 0} product{meta?.total === 1 ? '' : 's'}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <div className='max-w-7xl mx-auto px-4 lg:px-8 py-12'>
                {/* Sub-categories */}
                {children.length > 0 && (
                    <div className='mb-12'>
                        <div className="flex items-center gap-3 mb-6">
                            <span className='h-px w-4 bg-[#C9A24B]/50'></span>
                            <h2 className='text-[11px] tracking-[0.4em] uppercase text-[#F0D77C] font-semibold'>Shop by Sub-category</h2>
                            <span className='h-px flex-1 bg-gradient-to-r from-[#C9A24B]/20 to-transparent'></span>
                        </div>
                        <div className='flex gap-3 flex-wrap'>
                            {children.map((c) => (
                                <Link
                                    key={c._id}
                                    href={WEBSITE_CATEGORY(c.path)}
                                    className='border border-[#C9A24B]/30 bg-white/5 hover:bg-[#C9A24B]/10 px-5 py-2.5 text-xs font-semibold uppercase tracking-widest text-white/80 hover:text-[#F0D77C] hover:border-[#F0D77C]/50 transition-all'
                                >
                                    {c.name}
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {/* Products */}
                {products.length === 0 ? (
                    <div className='py-20 text-center border border-[#C9A24B]/20 bg-[#0a0805]'>
                        <Image
                            src={imgPlaceholder.src}
                            width={120}
                            height={120}
                            alt=''
                            className='mx-auto mb-4 opacity-10 filter grayscale'
                        />
                        <h3 className='text-xl font-serif-display text-[#F0D77C] mb-2'>Nothing here yet</h3>
                        <p className='text-white/50 text-sm'>
                            No products in this category{children.length > 0 ? ' — try a sub-category above' : ''}.
                        </p>
                    </div>
                ) : (
                    <div className='grid lg:grid-cols-4 sm:grid-cols-3 grid-cols-2 lg:gap-6 gap-4'>
                        {products.map((product) => (
                            <ProductBox key={product._id} product={product} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default CategoryPage
