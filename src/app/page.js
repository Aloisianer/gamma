"use client"

import Image from "next/image";
import { useEffect, useState, useRef, useMemo } from "react"; // Import useMemo
import { Track } from "@/components/track"
import { socket } from "@/socket";

let color_connected = "bg-sidebar-primary"
let color_disconnected = "bg-sidebar-secondary"

export default function Home() {
  let [ConnectionColor, setIsConnected] = useState(color_disconnected);
  let [items, setItems] = useState([]);

  useEffect(() => {
    socket.on("search", (data) => {
      setItems(data)
    })

    return () => {
      socket.off("search");
    };
  }, []);

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

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, []);

  return (
    <div>
      <div className="pt-2 pb-8">
        <div className={`fixed top-0 right-0 transition-all m-3 w-1 h-1 rounded ${ConnectionColor}`}>
        </div>
        <div className="flex justify-center place-items-center ml-5 mr-5">
          <div className="grid lg:grid-cols-7 md:grid-cols-5 grid-cols-2 gap-5">
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
