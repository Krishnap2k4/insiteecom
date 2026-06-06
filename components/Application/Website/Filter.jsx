'use client'
import useFetch from '@/hooks/useFetch'
import React, { useEffect, useState } from 'react'
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import { Checkbox } from '@/components/ui/checkbox'
import { Slider } from '@/components/ui/slider'
import { useRouter, useSearchParams } from 'next/navigation'
import { WEBSITE_SHOP } from '@/routes/WebsiteRoute'
import Link from 'next/link'
import { X } from 'lucide-react'

const Filter = () => {
    const searchParams = useSearchParams()

    const [priceFilter, setPriceFilter] = useState({ minPrice: 0, maxPrice: 3000 })
    const [selectedCategory, setSelectedCategory] = useState([])
    const [selectedColor, setSelectedColor] = useState([])
    const [selectedSize, setSelectedSize] = useState([])

    const { data: categoryData } = useFetch('/api/category/get-category')
    const { data: colorData } = useFetch('/api/product-variant/colors')
    const { data: sizeData } = useFetch('/api/product-variant/sizes')

    const urlSearchParams = new URLSearchParams(searchParams.toString())
    const router = useRouter()

    useEffect(() => {
        searchParams.get('category') ? setSelectedCategory(searchParams.get('category').split(',')) : setSelectedCategory([])
        searchParams.get('color') ? setSelectedColor(searchParams.get('color').split(',')) : setSelectedColor([])
        searchParams.get('size') ? setSelectedSize(searchParams.get('size').split(',')) : setSelectedSize([])
    }, [searchParams])

    const handlePriceChange = (value) => {
        setPriceFilter({ minPrice: value[0], maxPrice: value[1] })
    }

    const handleCategoryFilter = (categorySlug) => {
        let newSelectedCategory = [...selectedCategory]
        if (newSelectedCategory.includes(categorySlug)) {
            newSelectedCategory = newSelectedCategory.filter(cat => cat !== categorySlug)
        } else {
            newSelectedCategory.push(categorySlug)
        }
        setSelectedCategory(newSelectedCategory)
        newSelectedCategory.length > 0 ? urlSearchParams.set('category', newSelectedCategory.join(',')) : urlSearchParams.delete('category')
        router.push(`${WEBSITE_SHOP}?${urlSearchParams}`)
    }

    const handleColorFilter = (color) => {
        let newSelectedColor = [...selectedColor]
        if (newSelectedColor.includes(color)) {
            newSelectedColor = newSelectedColor.filter(cat => cat !== color)
        } else {
            newSelectedColor.push(color)
        }
        setSelectedColor(newSelectedColor)
        newSelectedColor.length > 0 ? urlSearchParams.set('color', newSelectedColor.join(',')) : urlSearchParams.delete('color')
        router.push(`${WEBSITE_SHOP}?${urlSearchParams}`)
    }

    const handleSizeFilter = (size) => {
        let newSelectedSize = [...selectedSize]
        if (newSelectedSize.includes(size)) {
            newSelectedSize = newSelectedSize.filter(cat => cat !== size)
        } else {
            newSelectedSize.push(size)
        }
        setSelectedSize(newSelectedSize)
        newSelectedSize.length > 0 ? urlSearchParams.set('size', newSelectedSize.join(',')) : urlSearchParams.delete('size')
        router.push(`${WEBSITE_SHOP}?${urlSearchParams}`)
    }

    const handlePriceFilter = () => {
        urlSearchParams.set('minPrice', priceFilter.minPrice)
        urlSearchParams.set('maxPrice', priceFilter.maxPrice)
        router.push(`${WEBSITE_SHOP}?${urlSearchParams}`)
    }

    return (
        <div>
            {searchParams.size > 0 &&
                <Link href={WEBSITE_SHOP}
                      className='flex items-center justify-center gap-2 w-full text-[10px] tracking-[0.25em] uppercase font-semibold text-black bg-gradient-to-r from-[#C9A24B] to-[#F0D77C] py-2.5 hover:from-[#F0D77C] hover:to-[#C9A24B] transition mb-4'>
                    <X size={12} /> Clear Filters
                </Link>
            }
            <Accordion type="multiple" defaultValue={['1', '2', '3', '4']}>
                <AccordionItem value="1" className="border-[#C9A24B]/20">
                    <AccordionTrigger className="text-[11px] tracking-[0.3em] uppercase font-semibold hover:no-underline text-white/90 hover:text-[#F0D77C]">
                        Category
                    </AccordionTrigger>
                    <AccordionContent>
                        <div className='max-h-48 overflow-auto'>
                            <ul>
                                {categoryData && categoryData.success && categoryData.data.map((category) => (
                                    <li key={category._id} className='mb-3'>
                                        <label className="flex items-center space-x-3 cursor-pointer group">
                                            <Checkbox
                                                onCheckedChange={() => handleCategoryFilter(category.slug)}
                                                checked={selectedCategory.includes(category.slug)}
                                                className="border-[#C9A24B]/50 data-[state=checked]:bg-[#C9A24B] data-[state=checked]:border-[#C9A24B]"
                                            />
                                            <span className='text-white/70 text-sm group-hover:text-[#F0D77C] transition-colors'>{category.name}</span>
                                        </label>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="2" className="border-[#C9A24B]/20">
                    <AccordionTrigger className="text-[11px] tracking-[0.3em] uppercase font-semibold hover:no-underline text-white/90 hover:text-[#F0D77C]">
                        Color
                    </AccordionTrigger>
                    <AccordionContent>
                        <div className='max-h-48 overflow-auto'>
                            <ul>
                                {colorData && colorData.success && colorData.data.map((color) => (
                                    <li key={color} className='mb-3'>
                                        <label className="flex items-center space-x-3 cursor-pointer group">
                                            <Checkbox
                                                onCheckedChange={() => handleColorFilter(color)}
                                                checked={selectedColor.includes(color)}
                                                className="border-[#C9A24B]/50 data-[state=checked]:bg-[#C9A24B] data-[state=checked]:border-[#C9A24B]"
                                            />
                                            <span className='text-white/70 text-sm group-hover:text-[#F0D77C] transition-colors'>{color}</span>
                                        </label>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="3" className="border-[#C9A24B]/20">
                    <AccordionTrigger className="text-[11px] tracking-[0.3em] uppercase font-semibold hover:no-underline text-white/90 hover:text-[#F0D77C]">
                        Size
                    </AccordionTrigger>
                    <AccordionContent>
                        <div className='max-h-48 overflow-auto'>
                            <ul>
                                {sizeData && sizeData.success && sizeData.data.map((size) => (
                                    <li key={size} className='mb-3'>
                                        <label className="flex items-center space-x-3 cursor-pointer group">
                                            <Checkbox
                                                onCheckedChange={() => handleSizeFilter(size)}
                                                checked={selectedSize.includes(size)}
                                                className="border-[#C9A24B]/50 data-[state=checked]:bg-[#C9A24B] data-[state=checked]:border-[#C9A24B]"
                                            />
                                            <span className='text-white/70 text-sm group-hover:text-[#F0D77C] transition-colors'>{size}</span>
                                        </label>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="4" className="border-[#C9A24B]/20">
                    <AccordionTrigger className="text-[11px] tracking-[0.3em] uppercase font-semibold hover:no-underline text-white/90 hover:text-[#F0D77C]">
                        Price
                    </AccordionTrigger>
                    <AccordionContent>
                        <Slider defaultValue={[0, 3000]} max={3000} step={1} onValueChange={handlePriceChange} className="[&_[role=slider]]:bg-[#C9A24B] [&_[role=slider]]:border-[#F0D77C]" />
                        <div className='flex justify-between items-center pt-3'>
                            <span className='text-xs text-[#F0D77C]/80'>{priceFilter.minPrice.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</span>
                            <span className='text-xs text-[#F0D77C]/80'>{priceFilter.maxPrice.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</span>
                        </div>
                        <div className='mt-4'>
                            <button
                                type="button"
                                onClick={handlePriceFilter}
                                className='btn-gold uppercase text-[10px] tracking-[0.25em] font-bold px-5 py-2.5 w-full cursor-pointer'
                            >
                                Apply Price
                            </button>
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>
    )
}

export default Filter