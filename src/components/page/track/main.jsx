"use client"

import { BigTrack } from "@/components/track"

export function Main({ data }) {
    return (
        <div className='p-5'>
            <BigTrack id={data} />
        </div>
    );
}