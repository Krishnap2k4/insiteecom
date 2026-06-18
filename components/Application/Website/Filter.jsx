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
    const router = useRouter()

    const [priceFilter, setPriceFilter] = useState({ minPrice: 0, maxPrice: 3000 })
    const [selectedCategory, setSelectedCategory] = useState([])
    // { "Color": ["Red", "Blue"], "Volume": ["100ml"] }
    const [selectedOptions, setSelectedOptions] = useState({})

    const { data: categoryData } = useFetch('/api/category/get-category')
    const { data: optionsData } = useFetch('/api/product-options')

    const optionGroups = optionsData?.success ? optionsData.data : []

    // Sync state from URL on every navigation
    useEffect(() => {
        const cat = searchParams.get('category')
        setSelectedCategory(cat ? cat.split(',') : [])

        try {
            const raw = searchParams.get('options')
            setSelectedOptions(raw ? JSON.parse(raw) : {})
        } catch {
            setSelectedOptions({})
        }
    }, [searchParams])

    // Build the full URL with current filter state
    const buildUrl = (category, options, price) => {
        const params = new URLSearchParams()

        if (category.length > 0) params.set('category', category.join(','))

        const activeOptions = Object.fromEntries(
            Object.entries(options).filter(([, v]) => v.length > 0)
        )
        if (Object.keys(activeOptions).length > 0) {
            params.set('options', JSON.stringify(activeOptions))
        }

        if (price) {
            params.set('minPrice', price.minPrice)
            params.set('maxPrice', price.maxPrice)
        } else {
            const existingMin = searchParams.get('minPrice')
            const existingMax = searchParams.get('maxPrice')
            if (existingMin) params.set('minPrice', existingMin)
            if (existingMax) params.set('maxPrice', existingMax)
        }

        const qs = params.toString()
        return `${WEBSITE_SHOP}${qs ? `?${qs}` : ''}`
    }

    const handleCategoryFilter = (slug) => {
        const next = selectedCategory.includes(slug)
            ? selectedCategory.filter(c => c !== slug)
            : [...selectedCategory, slug]
        router.push(buildUrl(next, selectedOptions, null))
    }

    const handleOptionFilter = (optionName, value) => {
        const current = selectedOptions[optionName] || []
        const next = current.includes(value)
            ? current.filter(v => v !== value)
            : [...current, value]
        const newOptions = { ...selectedOptions, [optionName]: next }
        router.push(buildUrl(selectedCategory, newOptions, null))
    }

    const handlePriceFilter = () => {
        router.push(buildUrl(selectedCategory, selectedOptions, priceFilter))
    }

    const hasFilters = searchParams.size > 0

    // Keep all sections open by default; re-key when option groups load so new sections open automatically
    const accordionKey = optionGroups.map(o => o.name).join(',')
    const defaultOpen = ['category', ...optionGroups.map(o => o.name), 'price']

    return (
        <div>
            {hasFilters && (
                <Link
                    href={WEBSITE_SHOP}
                    className='flex items-center justify-center gap-2 w-full text-[10px] tracking-[0.25em] uppercase font-semibold text-black bg-gradient-to-r from-[#C9A24B] to-[#F0D77C] py-2.5 hover:from-[#F0D77C] hover:to-[#C9A24B] transition mb-4'
                >
                    <X size={12} /> Clear Filters
                </Link>
            )}

            <Accordion key={accordionKey} type="multiple" defaultValue={defaultOpen}>

                {/* Category — always shown */}
                <AccordionItem value="category" className="border-[#C9A24B]/20">
                    <AccordionTrigger className="text-[11px] tracking-[0.3em] uppercase font-semibold hover:no-underline text-white/90 hover:text-[#F0D77C]">
                        Category
                    </AccordionTrigger>
                    <AccordionContent>
                        <div className='max-h-48 overflow-auto'>
                            <ul>
                                {categoryData?.success && categoryData.data.map((cat) => (
                                    <li key={cat._id} className='mb-3'>
                                        <label className="flex items-center space-x-3 cursor-pointer group">
                                            <Checkbox
                                                onCheckedChange={() => handleCategoryFilter(cat.slug)}
                                                checked={selectedCategory.includes(cat.slug)}
                                                className="border-[#C9A24B]/50 data-[state=checked]:bg-[#C9A24B] data-[state=checked]:border-[#C9A24B]"
                                            />
                                            <span className='text-white/70 text-sm group-hover:text-[#F0D77C] transition-colors'>{cat.name}</span>
                                        </label>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {/* Dynamic option sections — one per option group from published products */}
                {optionGroups.map((group) => (
                    <AccordionItem key={group.name} value={group.name} className="border-[#C9A24B]/20">
                        <AccordionTrigger className="text-[11px] tracking-[0.3em] uppercase font-semibold hover:no-underline text-white/90 hover:text-[#F0D77C]">
                            {group.name}
                        </AccordionTrigger>
                        <AccordionContent>
                            <div className='max-h-48 overflow-auto'>
                                <ul>
                                    {group.values.map((value) => (
                                        <li key={value} className='mb-3'>
                                            <label className="flex items-center space-x-3 cursor-pointer group">
                                                <Checkbox
                                                    onCheckedChange={() => handleOptionFilter(group.name, value)}
                                                    checked={(selectedOptions[group.name] || []).includes(value)}
                                                    className="border-[#C9A24B]/50 data-[state=checked]:bg-[#C9A24B] data-[state=checked]:border-[#C9A24B]"
                                                />
                                                <span className='text-white/70 text-sm group-hover:text-[#F0D77C] transition-colors'>{value}</span>
                                            </label>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                ))}

                {/* Price — always shown */}
                <AccordionItem value="price" className="border-[#C9A24B]/20">
                    <AccordionTrigger className="text-[11px] tracking-[0.3em] uppercase font-semibold hover:no-underline text-white/90 hover:text-[#F0D77C]">
                        Price
                    </AccordionTrigger>
                    <AccordionContent>
                        <div className='py-2'>
                            <Slider
                                defaultValue={[0, 3000]}
                                max={3000}
                                step={1}
                                onValueChange={(v) => setPriceFilter({ minPrice: v[0], maxPrice: v[1] })}
                                className="[&_[data-slot=slider-range]]:bg-[#C9A24B] [&_[data-slot=slider-track]]:bg-white/20 [&_[data-slot=slider-thumb]]:bg-[#C9A24B] [&_[data-slot=slider-thumb]]:border-[#F0D77C] [&_[data-slot=slider-thumb]]:ring-[#C9A24B]/30"
                            />
                        </div>
                        <div className='flex justify-between items-center pt-3'>
                            <span className='text-xs text-[#F0D77C]/80'>
                                {priceFilter.minPrice.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                            </span>
                            <span className='text-xs text-[#F0D77C]/80'>
                                {priceFilter.maxPrice.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                            </span>
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
