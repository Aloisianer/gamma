"use client"

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Ring } from 'ldrs/react'
import 'ldrs/react/Ring.css'
import { BigTrack } from "@/components/track"

export default function TrackPage() {
    const searchParams = useSearchParams();
    const id = searchParams.get('id');

    return (
        <div className='p-5'>
            <BigTrack id={id} />
        </div>
    );
}
