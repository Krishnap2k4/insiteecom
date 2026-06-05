import ProductBox from '@/components/Application/Website/ProductBox'
import { Button } from '@/components/ui/button'
import axios from '@/lib/apiClient'
import { WEBSITE_CATEGORY, WEBSITE_HOME, WEBSITE_SHOP } from '@/routes/WebsiteRoute'
import Image from 'next/image'
import Link from 'next/link'
import { FiChevronRight } from 'react-icons/fi'
import imgPlaceholder from '@/public/assets/images/img-placeholder.webp'

/**
 * Hierarchical category browse. Catches any depth — `/c/men`,
 * `/c/men/shirts`, `/c/men/shirts/casual`. Server-rendered: API call
 * returns the category + ancestors (breadcrumb) + child categories
 * + products in this category or any descendant.
 */
const CategoryPage = async ({ params }) => {
    const { slug } = await params
    const path = Array.isArray(slug) ? slug.join('/') : slug

    const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/category/by-path?path=${encodeURIComponent(path)}`
    const { data: res } = await axios.get(url)

    if (!res?.success) {
        return (
            <div className='min-h-[60vh] flex items-center justify-center px-4'>
                <div className='max-w-md text-center'>
                    <p className='text-7xl font-semibold text-primary mb-2'>404</p>
                    <h1 className='text-2xl font-semibold mb-3'>Category not found</h1>
                    <p className='text-gray-500 mb-8'>We couldn&apos;t find a category at <span className='font-mono'>/c/{path}</span>.</p>
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

    const { category, ancestors = [], children = [], products = [], meta } = res.data

    return (
        <div>
            {/* Hero / header */}
            <section className='bg-gradient-to-b from-gray-50 to-white border-b'>
                <div className='lg:px-32 px-4 py-10'>
                    {/* Breadcrumb */}
                    <nav className='text-sm text-gray-500 mb-4 flex items-center gap-1 flex-wrap'>
                        <Link href={WEBSITE_HOME} className='hover:text-primary'>Home</Link>
                        {ancestors.map((a) => (
                            <span key={a._id} className='flex items-center gap-1'>
                                <FiChevronRight size={14} />
                                <Link href={WEBSITE_CATEGORY(a.path)} className='hover:text-primary'>{a.name}</Link>
                            </span>
                        ))}
                        <span className='flex items-center gap-1 text-gray-700'>
                            <FiChevronRight size={14} />
                            <span className='font-medium'>{category.name}</span>
                        </span>
                    </nav>

                    <div className='flex items-center justify-between gap-4 flex-wrap'>
                        <div>
                            <h1 className='text-3xl lg:text-4xl font-semibold mb-1'>{category.name}</h1>
                            {category.description && (
                                <p className='text-gray-600 max-w-2xl'>{category.description}</p>
                            )}
                            <p className='text-sm text-gray-500 mt-2'>
                                {meta?.total ?? 0} product{meta?.total === 1 ? '' : 's'}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <div className='lg:px-32 px-4 py-10'>
                {/* Sub-categories */}
                {children.length > 0 && (
                    <div className='mb-10'>
                        <h2 className='text-lg font-semibold mb-4'>Shop by sub-category</h2>
                        <div className='flex gap-3 flex-wrap'>
                            {children.map((c) => (
                                <Link
                                    key={c._id}
                                    href={WEBSITE_CATEGORY(c.path)}
                                    className='border rounded-full px-4 py-2 text-sm hover:border-primary hover:text-primary transition'
                                >
                                    {c.name}
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {/* Products */}
                {products.length === 0 ? (
                    <div className='py-20 text-center'>
                        <Image
                            src={imgPlaceholder.src}
                            width={120}
                            height={120}
                            alt=''
                            className='mx-auto mb-4 opacity-30'
                        />
                        <h3 className='text-xl font-semibold mb-2'>Nothing here yet</h3>
                        <p className='text-gray-500'>
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
