"use client";

import { usePageContext } from "@/components/context/page";
import { useEffect } from "react";
import { useRouter } from 'next/navigation';

export default function Home({ params }) {
    let { setPage } = usePageContext();
    let router = useRouter();
    useEffect(() => {
        async function doStuff() {
            let { id } = await params;
            setPage({ name: "track", data: id });
            router.push('/');
        }; doStuff();
    }, []);
};