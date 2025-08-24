"use client"

import { useEffect, useState } from "react";
import { socket } from "@/socket";
import { usePageContext } from "@/components/context/page";

import { Main as SearchMain } from "@/components/page/search/main";
import { Main as TrackMain } from "@/components/page/track/main";
import { Main as UserMain } from "@/components/page/user/main";
import { Main as UserLikesMain } from "@/components/page/user/likes/main";
import { Main as UserPlaylistsMain } from "@/components/page/user/playlists/main";
import { Main as UserTracksMain } from "@/components/page/user/tracks/main";

let color_connected = "bg-sidebar-primary"
let color_disconnected = "bg-sidebar-secondary"

export default function Home() {
  let [ConnectionColor, setIsConnected] = useState(color_disconnected);
  let { page, setPage } = usePageContext();

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
      {page.name === "home" && (
        <div className="pt-3 pb-8">
          <div className={`fixed top-0 right-0 transition-all m-3 w-1 h-1 rounded ${ConnectionColor}`}>
          </div>
          <h1>This is the homepage, nothing is here {page.data}</h1>
        </div>
      )}
      {page.name === "search" && (
        <SearchMain data={page.data} />
      )}
      {page.name === "track" && (
        <TrackMain data={page.data} />
      )}
      {page.name === "user" && (
        <UserMain data={page.data} />
      )}
      {page.name === "user-likes" && (
        <UserLikesMain data={page.data} />
      )}
      {page.name === "user-playlists" && (
        <UserPlaylistsMain data={page.data} />
      )}
      {page.name === "user-tracks" && (
        <UserTracksMain data={page.data} />
      )}
    </div>
  );
}
