"use client";
import { Input } from "@/components/ui/input";
import { WEBSITE_SHOP } from "@/routes/WebsiteRoute";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search as SearchIcon } from "lucide-react";

const Search = ({ isShow }) => {
    const router = useRouter()
    const [query, setQuery] = useState()
    const handleSearch = () => {
        router.push(`${WEBSITE_SHOP}?q=${query}`)
    }
    return (
        <div
            className={`absolute border-t border-[#C9A24B]/20 transition-all left-0 py-5 md:px-32 px-5 z-10 bg-[#0a0805]/95 backdrop-blur-md w-full ${isShow ? "top-full" : "-top-[200px] opacity-0 pointer-events-none"}`}
        >
            <div className="flex justify-between items-center relative max-w-[1500px] mx-auto">
                <input
                    type="text"
                    className="w-full h-12 ps-5 pe-12 bg-black/40 border border-[#C9A24B]/50 text-white placeholder:text-white/40 rounded-none focus:border-[#F0D77C] focus:outline-none transition-colors text-sm"
                    placeholder="Search fragrances..."
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <button type="button" onClick={handleSearch} className="absolute right-4 cursor-pointer text-[#C9A24B] hover:text-[#F0D77C] transition-colors">
                    <SearchIcon size={18} />
                </button>
            </div>
        </div>
    );
};

export default Search;
