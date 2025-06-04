"use client"

import { useEffect, useState, useCallback } from 'react';
import { Track, MediumTrack } from "@/components/track"
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button"
import { useRouter } from 'next/navigation';

export default function Home() {
    let [likes, setLikes] = useState([]);
    let [tracks, setTracks] = useState([]);
    let searchParams = useSearchParams();
    let id = searchParams.get("id");
    let router = useRouter()

    useEffect(() => {
        fetch(`/api/user-likes?page=1&amount=5&id=${id}`, {})
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch');
                return res.json();
            })
            .then(data => {
                setLikes(data.tracks || []);
            })
            .catch(() => {
                setLikes([]);
            });

        return () => { };
    }, [id]);

    useEffect(() => {
        fetch(`/api/user-tracks?page=1&id=${id}`, {})
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch');
                return res.json();
            })
            .then(data => {
                setTracks(data.tracks || []);
            })
            .catch(() => {
                setTracks([]);
            });

        return () => { };
    }, [id]);

    return (
        <div className="pb-8 p-3 w-full">
            <p className="text-red-300">THIS IS UNDER CONSTRUCTION!</p>
            <Button
                onClick={() => router.push(`/user-likes?id=${id}`)}
            >Likes</Button>
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

            <Button
                onClick={() => router.push(`/user-tracks?id=${id}`)}
            >Top Tracks</Button>
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