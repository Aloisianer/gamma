"use client"

import { useEffect, useState, useCallback } from 'react';
import { Track } from "@/components/track"
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button"

export default function Home() {
    let [results, setResults] = useState([]);
    let [page, setPage] = useState(1);
    let searchParams = useSearchParams();
    let id = searchParams.get("id");

    let loadNextPage = useCallback(() => {
        setPage(prev => prev + 1);
    }, []);

    let loadPreviousPage = useCallback(() => {
        setPage(prev => Math.max(1, prev - 1));
    }, []);

    useEffect(() => {
        fetch(`/api/user-playlists?page=${page}&amount=49&id=${id}`, {})
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch');
                return res.json();
            })
            .then(data => {
                setResults(data.tracks || []);
            })
            .catch(() => {
                setResults([]);
            });

        return () => { };
    }, [id, page]);


    return (
        <div className="pb-8 w-full">
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
                                    link={item.link}
                                    type={item.type}
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
                ) : (
                    <p>Nothing found</p>
                )}
            </div>
        </div>
    )
}