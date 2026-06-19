import ProductBox from '@/components/Application/Website/ProductBox'
import { Button } from '@/components/ui/button'
import { getBrandBySlug } from '@/lib/data/brandBySlug'
import { WEBSITE_HOME, WEBSITE_SHOP } from '@/routes/WebsiteRoute'
import Image from 'next/image'
import Link from 'next/link'
import { FiChevronRight } from 'react-icons/fi'

const BrandNotFound = ({ slug }) => (
    <div className='min-h-[60vh] flex items-center justify-center px-4 bg-dark-gold pt-[120px]'>
        <div className='max-w-md text-center'>
            <p className='text-7xl font-serif-display gold-text mb-2'>404</p>
            <h1 className='text-2xl font-serif-display text-white mb-3'>Brand not found</h1>
            <p className='text-white/50 mb-8'>We couldn&apos;t find a brand at <span className='font-mono text-[#F0D77C]'>/b/{slug}</span>.</p>
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
 * Brand landing page. Server-rendered: shows the brand hero (logo +
 * description) and its published products in a grid.
 */
const BrandPage = async ({ params }) => {
    const { slug } = await params

    const result = await getBrandBySlug(slug)
    if (!result.ok) return <BrandNotFound slug={slug} />

    const { brand, products = [] } = result.data
    const logoUrl = brand.logo?.secure_url

    return (
        <div className="bg-dark-gold min-h-screen pt-[120px]">
            <div className='h-px w-full bg-gradient-to-r from-transparent via-[#C9A24B] to-transparent'></div>

            {/* Brand hero */}
            <section className='bg-gradient-to-b from-[#0e0e0e] to-[#0a0805] border-b border-[#C9A24B]/20'>
                <div className='max-w-7xl mx-auto px-4 lg:px-8 py-12'>
                    <nav className='text-xs tracking-wider uppercase text-white/50 mb-6 flex items-center gap-2 flex-wrap'>
                        <Link href={WEBSITE_HOME} className='hover:text-[#F0D77C] transition-colors'>Home</Link>
                        <FiChevronRight size={12} className="text-[#C9A24B]/50" />
                        <Link href={WEBSITE_SHOP} className='hover:text-[#F0D77C] transition-colors'>Brands</Link>
                        <FiChevronRight size={12} className="text-[#C9A24B]/50" />
                        <span className='font-semibold text-[#F0D77C]'>{brand.name}</span>
                    </nav>

                    <div className='flex items-center gap-6 flex-wrap'>
                        {logoUrl && (
                            <div className='w-24 h-24 lg:w-32 lg:h-32 border border-[#C9A24B]/30 rounded-full overflow-hidden bg-[#15110a] shrink-0 p-4 shadow-lg shadow-[#C9A24B]/10'>
                                <Image
                                    src={logoUrl}
                                    width={128}
                                    height={128}
                                    alt={brand.name}
                                    className='w-full h-full object-contain filter drop-shadow-md brightness-110'
                                />
                            </div>
                        )}
                        <div>
                            <h1 className='text-4xl lg:text-5xl font-serif-display gold-shine mb-2'>{brand.name}</h1>
                            {brand.description && (
                                <p className='text-white/60 max-w-2xl text-sm leading-relaxed'>{brand.description}</p>
                            )}
                            <p className='text-xs tracking-widest uppercase text-[#C9A24B] mt-4'>
                                {products.length} product{products.length === 1 ? '' : 's'}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <div className='max-w-7xl mx-auto px-4 lg:px-8 py-12'>
                {products.length === 0 ? (
                    <div className='py-20 text-center border border-[#C9A24B]/20 bg-[#0a0805]'>
                        <h3 className='text-xl font-serif-display text-[#F0D77C] mb-2'>No products yet</h3>
                        <p className='text-white/50 text-sm'>
                            We haven&apos;t listed any products for this brand yet — check back soon.
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

export default BrandPage
