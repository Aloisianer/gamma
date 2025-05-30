"use client"

import Image from "next/image";
import { useEffect, useState, useRef, useMemo } from "react"; // Import useMemo
import { Track } from "@/components/track"
import { socket } from "@/socket";
import * as Icon from "react-feather";
import { toast } from "sonner";
import AudioPlayer from "@/components/player";

let color_connected = "bg-sidebar-primary"
let color_disconnected = "bg-sidebar-secondary"

export default function Home() {
  let [ConnectionColor, setIsConnected] = useState(color_disconnected);
  let [items, setItems] = useState([]);
  let audioPlayerRef = useRef(null);
  let [currentTrackId, setCurrentTrackId] = useState(null);

  const songSrc = useMemo(() => {
    if (currentTrackId) {
      return `/api/track?id=${currentTrackId}`;
    }
    return null;
  }, [currentTrackId]);

  useEffect(() => {
    if (socket.connected) {
      onConnect();
    }

    function onConnect() {
      setIsConnected(color_connected);
    }

    function onDisconnect() {
      setIsConnected(color_disconnected);
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    socket.on("search", (data) => {
      setItems(data)
    })

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("search");
    };
  }, []);

  useEffect(() => {
    let handlePlayNow = async (trackId, trackTitle) => {
      if (!audioPlayerRef.current) {
        return;
      }

      setCurrentTrackId(trackId);
      toast(`Now playing ${trackTitle}`);
    };

    socket.on("playNow", handlePlayNow);

    return () => {
      socket.off("playNow", handlePlayNow);
    };
  }, []);

  return (
    <div>
      <div className="sticky top-0 w-full p-3">
        <div className="bg-background">
          <AudioPlayer
            ref={audioPlayerRef}
            src={songSrc}
          />
        </div>
      </div>
      <div className="pt-2 pb-8">
        <div className={`fixed top-0 right-0 transition-all m-3 w-1 h-1 rounded ${ConnectionColor}`}>
        </div>
        <div className="flex justify-center place-items-center">
          <div className="grid grid-cols-7 gap-5">
            {items.map((item) => (
              <Track
                key={item.id}
                id={item.id}
                artwork={item.artwork}
                title={item.title}
                creator={item.creator}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
