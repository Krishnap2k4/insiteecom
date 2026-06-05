import ProductBox from '@/components/Application/Website/ProductBox'
import { Button } from '@/components/ui/button'
import axios from '@/lib/apiClient'
import { WEBSITE_HOME, WEBSITE_SHOP } from '@/routes/WebsiteRoute'
import Image from 'next/image'
import Link from 'next/link'
import { FiChevronRight } from 'react-icons/fi'

/**
 * Brand landing page. Server-rendered: shows the brand hero (logo +
 * description) and its published products in a grid.
 */
const BrandPage = async ({ params }) => {
    const { slug } = await params

    const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/brand/by-slug/${encodeURIComponent(slug)}`
    const { data: res } = await axios.get(url)

    if (!res?.success) {
        return (
            <div className='min-h-[60vh] flex items-center justify-center px-4'>
                <div className='max-w-md text-center'>
                    <p className='text-7xl font-semibold text-primary mb-2'>404</p>
                    <h1 className='text-2xl font-semibold mb-3'>Brand not found</h1>
                    <p className='text-gray-500 mb-8'>We couldn&apos;t find a brand at <span className='font-mono'>/b/{slug}</span>.</p>
                    <div className='flex gap-3 justify-center'>
                        <Button asChild className='rounded-full px-6'>
                            <Link href={WEBSITE_SHOP}>Browse shop</Link>
                        </Button>
                        <Button asChild variant='outline' className='rounded-full px-6'>
                            <Link href={WEBSITE_HOME}>Go home</Link>
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    const { brand, products = [] } = res.data
    const logoUrl = brand.logo?.secure_url

    return (
        <div>
            {/* Brand hero */}
            <section className='bg-gradient-to-b from-gray-50 to-white border-b'>
                <div className='lg:px-32 px-4 py-12'>
                    <nav className='text-sm text-gray-500 mb-6 flex items-center gap-1 flex-wrap'>
                        <Link href={WEBSITE_HOME} className='hover:text-primary'>Home</Link>
                        <FiChevronRight size={14} />
                        <Link href={WEBSITE_SHOP} className='hover:text-primary'>Brands</Link>
                        <FiChevronRight size={14} />
                        <span className='font-medium text-gray-700'>{brand.name}</span>
                    </nav>

                    <div className='flex items-center gap-6 flex-wrap'>
                        {logoUrl && (
                            <div className='w-24 h-24 lg:w-32 lg:h-32 border rounded-xl overflow-hidden bg-white shrink-0 p-2'>
                                <Image
                                    src={logoUrl}
                                    width={128}
                                    height={128}
                                    alt={brand.name}
                                    className='w-full h-full object-contain'
                                />
                            </div>
                        )}
                        <div>
                            <h1 className='text-3xl lg:text-4xl font-semibold mb-2'>{brand.name}</h1>
                            {brand.description && (
                                <p className='text-gray-600 max-w-2xl'>{brand.description}</p>
                            )}
                            <p className='text-sm text-gray-500 mt-2'>
                                {products.length} product{products.length === 1 ? '' : 's'}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <div className='lg:px-32 px-4 py-10'>
                {products.length === 0 ? (
                    <div className='py-20 text-center'>
                        <h3 className='text-xl font-semibold mb-2'>No products yet</h3>
                        <p className='text-gray-500'>
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
