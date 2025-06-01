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
                    artwork={`/api/image-big?id=${trackData.id}`}
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
