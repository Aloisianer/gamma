"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { Track } from "@/components/track";
import {
    Command,
    CommandDialog,
    CommandInput,
    CommandList,
    CommandEmpty,
    CommandSeparator,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button"
import { containsUsefulInfo } from "@/lib/utils"

export function Search() {
    let [open, setOpen] = useState(false);
    let [results, setResults] = useState([]);
    let [query, setQuery] = useState('');
    let [loading, setLoading] = useState(false);
    let [page, setPage] = useState(1);
    let timerRef = useRef(null);
    let abortControllerRef = useRef(null);
    let linkRef = useRef(null);

    let resetState = useCallback(() => {
        setQuery('');
        setResults([]);
        setPage(1);
    }, []);

    // Keyboard shortcut handler
    useEffect(() => {
        let handler = (e) => {
            if (e.key === "s" && e.ctrlKey) {
                e.preventDefault();
                setOpen(prev => !prev);
            }
        };

        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, []);

    useEffect(() => {
        if (!open) resetState();
    }, [open, resetState]);

    useEffect(() => {
        setLoading(true);
        setPage(1);
    }, [query]);

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
            fetch(`/api/search?page=${page}&amount=8&query=${encodeURIComponent(query)}`, {
                signal
            })
                .then(res => {
                    if (!res.ok) throw new Error('Failed to fetch');
                    return res.json();
                })
                .then(data => {
                    if (!signal.aborted) {
                        setResults(data.tracks || []);
                        setLoading(false);
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

    let handleEnter = useCallback((e) => {
        if (e.key === "Enter" && containsUsefulInfo(query)) {
            if (linkRef.current) {
                linkRef.current.click();
            }
            setOpen(false);
        }
    }, [query]);

    let loadNextPage = useCallback(() => {
        setPage(prev => prev + 1);
    }, []);

    let loadPreviousPage = useCallback(() => {
        setPage(prev => Math.max(1, prev - 1));
    }, []);

    return (
        <CommandDialog open={open} onOpenChange={setOpen}>
            <CommandInput
                placeholder="Search for a song..."
                value={query}
                onValueChange={setQuery}
                onKeyDown={handleEnter}
            />
            {containsUsefulInfo(query) ? (
                <Link
                    prefetch={true}
                    href={`/search?query=${encodeURIComponent(query)}`}
                    ref={linkRef}
                    aria-hidden
                    tabIndex={-1}
                    style={{ display: 'none' }}
                >
                    go
                </Link>
            ) : null}
            <CommandList>
                {results.length > 0 ? (
                    <div>
                        <div className="grid grid-cols-4 gap-3 p-3">
                            {results.map((item) => (
                                <Track
                                    key={item.id}
                                    id={item.id}
                                    artwork={item.artwork}
                                    title={item.title}
                                    creator={item.creator}
                                    link={item.link}
                                    type={item.type}
                                    variant="searchBox"
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
                ) : containsUsefulInfo(query) && !loading ? (
                    <CommandEmpty>No results found.</CommandEmpty>
                ) : null}
            </CommandList>
        </CommandDialog>
    );
}