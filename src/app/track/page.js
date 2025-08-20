"use client"

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Ring } from 'ldrs/react'
import 'ldrs/react/Ring.css'
import { BigTrack } from "@/components/track"

export default function TrackPage() {
    const searchParams = useSearchParams();
    const id = searchParams.get('id');
    const [trackData, setTrackData] = useState(null);

    useEffect(() => {
        if (id) {
            fetch(`/api/track-info?id=${id}`)
                .then(response => response.json())
                .then(data => {
                    setTrackData(data)
                    console.log(data)
                })
                .catch(error => console.error('Error fetching data:', error));
        }
    }, [id]);

    return (
        <div>
            {trackData ? (
                <BigTrack
                    id={trackData.id}
                    artwork={(function(){
                        const art = trackData.artwork_url || trackData.user?.avatar_url || null;
                        if (!art) return null;
                        try { return art.replaceAll('large', 't500x500') } catch(e) { return art }
                    })()}
                    title={trackData.title}
                    creator={trackData.user.username}
                />
            ) : (
                <Ring
                    size="40"
                    stroke="5"
                    bgOpacity="0"
                    speed="2"
                    color="white"
                />
            )}
        </div>
    );
}
