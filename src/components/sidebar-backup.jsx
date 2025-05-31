"use client"

import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarHeader,
    SidebarFooter
} from "@/components/ui/sidebar";

import Link from "next/link";
import * as Icon from "react-feather";
import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { socket } from "@/socket";

let items = [
    { title: "Home", url: "#", icon: Icon.Home },
    { title: "Inbox", url: "#", icon: Icon.Inbox },
    { title: "Calendar", url: "#", icon: Icon.Calendar },
    { title: "Search", url: "#", icon: Icon.Search },
    { title: "Settings", url: "#", icon: Icon.Settings }
];

export function AppSidebar() {
    const playerRef = useRef(null);
    const [song, setSong] = useState(null);
    const [playerLoading, setLoading] = useState(false);

    useEffect(() => {
        console.log("[INIT] Player initialized.");

        const handlePlayNow = async (trackId, trackTitle) => {
            console.log(`[EVENT] playNow received: trackId=${trackId}, trackTitle=${trackTitle}`);

            if (!playerRef.current) {
                console.error("[ERROR] playerRef is null, audio element not found.");
                return;
            }
            const player = playerRef.current;

            console.log("[ACTION] Disabling player and preparing new song.");
            player.disabled = true;
            player.pause();
            player.currentTime = 0;
            setLoading(true);
            setSong(`/api/track?id=${trackId}`);
            toast(`Now playing ${trackTitle} (${trackId})`);

            player.addEventListener("canplaythrough", () => {
                console.log("[EVENT] Entire MP3 file downloaded.");
                player.disabled = false;
                player.play();
                setLoading(false);
            });

            player.addEventListener("error", (e) => {
                console.error("[ERROR] Audio playback failed:", e);
            });
        };

        socket.on("playNow", handlePlayNow);

        return () => {
            console.log("[CLEANUP] Removing playNow event listener.");
            socket.off("playNow", handlePlayNow);
        };
    }, []);

    useEffect(() => {
        if (!playerRef.current || !song) return;

        console.log(`[LOAD] Attempting to load audio: ${song}`);
        const player = playerRef.current;

        player.src = song; // Explicitly set the source
        player.load();

        player.play()
            .then(() => console.log("[SUCCESS] Audio playback started successfully!"))
            .catch(err => console.error("[ERROR] Playback issue:", err));

        // Stable buffering updates
        const trackBuffering = setInterval(() => {
            if (player.buffered.length > 0 && player.readyState >= 2) { // Ensure data is actually buffered
                const bufferedEnd = player.buffered.end(0);
                const duration = player.duration || 1;
                const percentBuffered = Math.min((bufferedEnd / duration) * 100, 100);
                console.log(`[BUFFER] Buffered: ${percentBuffered.toFixed(2)}%`);
            }
        }, 1000); // Updates less frequently for stability

        player.addEventListener("canplaythrough", () => {
            console.log("[EVENT] Buffering complete.");
            clearInterval(trackBuffering);
        });

        player.addEventListener("error", (e) => {
            console.error("[ERROR] Playback error detected:", e);
        });

        return () => {
            console.log("[CLEANUP] Removing buffering tracker.");
            clearInterval(trackBuffering);
        };
    }, [song]);

    return (
        <Sidebar collapsible="icon">
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>HackrPlayer</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu className="ml-[0.49]">
                            {items.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild>
                                        <Link href={item.url}>
                                            <item.icon />
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>
                <SidebarGroup>
                    <SidebarGroupContent>
                        <audio disabled autoPlay controls ref={playerRef} preload="auto" loop />
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarFooter>
        </Sidebar>
    );
}
