"use client"

import { useEffect, useState, useRef, useCallback } from 'react';
import { Track } from "@/components/track"
import { useSearchParams } from "next/navigation";
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CommandInput, Command } from "@/components/ui/command"
import { containsUsefulInfo } from "@/lib/utils"

export default function Home() {
    let [query, setQuery] = useState("")
    let [results, setResults] = useState([]);
    let [page, setPage] = useState(1);
    let timerRef = useRef(null);
    let abortControllerRef = useRef(null);
    let searchParams = useSearchParams();
    let rawQuery = searchParams.get("query");

    let loadNextPage = useCallback(() => {
        setPage(prev => prev + 1);
    }, []);

    let loadPreviousPage = useCallback(() => {
        setPage(prev => Math.max(1, prev - 1));
    }, []);

    useEffect(() => {
        if (query) {
            window.history.replaceState(null, '', `/search?query=${encodeURIComponent(query)}`);
        } else {
            window.history.replaceState(null, '', `/search`);
        }
        setPage(1);
    }, [query]);

    useEffect(() => {
        if (rawQuery) {
            setQuery(rawQuery);
        }
    }, [rawQuery]);

    useEffect(() => {
        if (!containsUsefulInfo(query)) {
            setResults([]);
            return;
        }

        // Clear previous timer and abort ongoing requests
        if (timerRef.current) clearTimeout(timerRef.current);
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        abortControllerRef.current = new AbortController();
        let signal = abortControllerRef.current.signal;

        timerRef.current = setTimeout(() => {
            fetch(`/api/search?page=${page}&amount=49&query=${encodeURIComponent(query)}`, {
                signal
            })
                .then(res => {
                    if (!res.ok) throw new Error('Failed to fetch');
                    return res.json();
                })
                .then(data => {
                    if (!signal.aborted) {
                        setResults(data.tracks || []);
                    }
                })
                .catch(() => {
                    if (!signal.aborted) {
                        setResults([]);
                    }
                });
        }, 150);

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [query, page]);


    return (
        <div className="pb-8 w-full">
            <Command className="w-1/3 sticky top-0 left-1/2 transform -translate-x-1/2 m-3">
                <CommandInput
                    placeholder="Search for a song..."
                    value={query}
                    onValueChange={setQuery}
                />
            </Command>
            <div className="flex justify-center place-items-center ml-5 mr-5">
                    {results.length > 0 ? (
                        <div>
                <div className="grid lg:grid-cols-7 md:grid-cols-5 grid-cols-2 gap-5">
                                {results.map((item) => (
                                    <Track
                                        key={item.id}
                                        id={item.id}
                                        artwork={item.artwork}
                                        title={item.title}
                                        creator={item.creator}
                                    />
                                ))}
                            </div>
                            <div className="flex justify-center place-items-center gap-5 mb-6 mt-3">
                                {page > 1 ? (
                                    <Button onClick={loadPreviousPage}>
                                        Back
                                    </Button>
                                ) : (
                                    <Button disabled>
                                        Back
                                    </Button>
                                )}
                                <div className="px-4 py-2 bg-muted rounded-md">
                                    Page {page}
                                </div>
                                <Button onClick={loadNextPage}>
                                    Next
                                </Button>
                            </div>
                        </div>
                    ) : containsUsefulInfo(query) ? (
                        <p>Nothing found</p>
                    ) : null}
                </div>
        </div>
    )
}