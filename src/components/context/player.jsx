"use client";

import React, {
    createContext,
    useContext,
    useEffect,
    useRef,
    useState,
} from "react";

let PlayerContext = createContext();

export function usePlayerContext() {
    let context = useContext(PlayerContext);
    if (context === undefined) {
        throw new Error(
            "usePlayerContext must be used within a PlayerProvider",
        );
    }
    return context;
};

export function PlayerProvider({ children }) {
    let [queue, setQueue] = useState([]);
    let [currentSong, setCurrentSong] = useState(new Song(0, "Nothing playing", false, false, 0))

    return (
        <PlayerContext.Provider value={{ queue, currentSong }}>
            {children}
        </PlayerContext.Provider>
    );
};