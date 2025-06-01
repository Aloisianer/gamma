"use client"

import { useEffect, useState } from "react";
import { socket } from "@/socket";

let color_connected = "bg-sidebar-primary"
let color_disconnected = "bg-sidebar-secondary"

export default function Home() {
  let [ConnectionColor, setIsConnected] = useState(color_disconnected);

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
      <div className="pt-3 pb-8">
        <div className={`fixed top-0 right-0 transition-all m-3 w-1 h-1 rounded ${ConnectionColor}`}>
        </div>
      </div>
    </div>
  );
}
