"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Track } from "@/components/track"
import {
    CommandDialog,
    CommandInput,
    CommandList,
    CommandEmpty,
} from "@/components/ui/command";

function containsUsefulInfo(str) {
    return /[a-zA-Z0-9]/.test(str);
}

export function Search() {
    const [open, setOpen] = useState(false);
    const [results, setResults] = useState([]);
    const [query, setQuery] = useState('');
    const router = useRouter();

    useEffect(() => {
        const down = (e) => {
            if (e.key === "s" && e.ctrlKey) {
                e.preventDefault();
                setOpen((prevOpen) => !prevOpen);
            }
        };

        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    // Reset state when closing dialog
    useEffect(() => {
        if (!open) {
            setQuery('');
            setResults([]);
        }
    }, [open]);

    // Debounced search
    useEffect(() => {
        if (!containsUsefulInfo(query)) {
            setResults([]);
            return;
        }

        const handler = setTimeout(() => {
            fetch(`/api/search?query=${encodeURIComponent(query)}`)
                .then((res) => res.json())
                .then(setResults)
                .catch(() => setResults([]));
        }, 150);

        return () => clearTimeout(handler);
    }, [query]);

    const handleEnter = (e) => {
        if (e.key === "Enter" && containsUsefulInfo(query)) {
            router.push(`/search?query=${encodeURIComponent(query)}`);
            setOpen(false);
        }
    };

    return (
        <CommandDialog open={open} onOpenChange={setOpen}>
            <CommandInput
                placeholder="Search for a song..."
                value={query}
                onValueChange={setQuery}
                onKeyDown={handleEnter}
            />
            <CommandList>
                {results.length > 0 ? (
                    <div className="grid grid-cols-4 gap-3 p-3">
                        {results.map((item) => (
                            <Track
                                key={item.id}
                                id={item.id}
                                artwork={item.artwork}
                                title={item.title}
                                creator={item.creator}
                                variant="searchBox"
                            />
                        ))}
                    </div>
                ) : containsUsefulInfo(query) ? (
                    <CommandEmpty>No results found.</CommandEmpty>
                ) : null}
            </CommandList>
        </CommandDialog>
    );
}