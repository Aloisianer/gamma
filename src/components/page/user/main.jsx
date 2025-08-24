"use client"

import { useEffect, useState, useCallback } from 'react';
import { Track, MediumTrack } from "@/components/track"
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button"
import { usePageContext } from '@/components/context/page';

export function Main({ data }) {
    let [likes, setLikes] = useState([]);
    let [tracks, setTracks] = useState([]);
    let { setPage } = usePageContext();

    useEffect(() => {
        const ac = new AbortController();
        fetch(`/api/user-likes?page=1&amount=5&id=${data}`, { signal: ac.signal })
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch');
                return res.json();
            })
            .then(data => {
                if (ac.signal.aborted) return;
                setLikes(data.tracks || []);
            })
            .catch(() => {
                if (ac.signal.aborted) return;
                setLikes([]);
            });

        return () => { ac.abort(); };
    }, [data]);

    useEffect(() => {
        const ac = new AbortController();
        fetch(`/api/user-tracks?page=1&id=${data}`, { signal: ac.signal })
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch');
                return res.json();
            })
            .then(data => {
                if (ac.signal.aborted) return;
                setTracks(data.tracks || []);
            })
            .catch(() => {
                if (ac.signal.aborted) return;
                setTracks([]);
            });

        return () => { ac.abort(); };
    }, [data]);

    return (
        <div className="pb-8 p-3 w-full">
            <p className="text-red-300">THIS IS UNDER CONSTRUCTION!</p>
            <Button onClick={() => {
                setPage({ name: "user-likes", data: data })
            }}>
                Likes
            </Button>
            <div>
                {likes.length > 0 ? (
                    <div>
                        <div className="grid grid-cols-1 gap-5">
                            {likes.map((item) => (
                                <MediumTrack
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
                    </div>
                ) : (
                    <p>Nothing found</p>
                )}
            </div>

            <Button onClick={() => {
                setPage({ name: "user-tracks", data: data })
            }}>
                Tracks
            </Button>
            <div className="flex justify-center place-items-center ml-5 mr-5">
                {tracks.length > 0 ? (
                    <div>
                        <div className="grid lg:grid-cols-7 md:grid-cols-5 grid-cols-2 gap-5">
                            {tracks.map((item) => (
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
                    </div>
                ) : (
                    <p>Nothing found</p>
                )}
            </div>
        </div>
    )
}