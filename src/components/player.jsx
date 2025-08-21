"use client";

import {
  useRef,
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useCallback,
  useMemo,
} from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  PlayIcon,
  PauseIcon,
  Volume2Icon,
  Volume1Icon,
  VolumeXIcon,
  Repeat,
  Repeat1,
  SkipBack,
  SkipForward,
} from "lucide-react";
import { toast } from "sonner";
import { socket } from "@/socket";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Ring } from "ldrs/react";
import "ldrs/react/Ring.css";
import { getStoredValue, formatTime } from "@/lib/utils";
import { SmallTrack } from "@/components/track";

// constants
const INITIAL_VOLUME = 0.5;
const MODES = {
  NORMAL: 1,
  LOOP: 2,
  SINGLE: 3,
};

// SSR-safe guard
const useMounted = () => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
};

export let AudioPlayer = forwardRef((props, ref) => {
  const mounted = useMounted();

  // Track info
  const [currentTrackId, setCurrentTrackId] = useState(null);
  const [currentTrackTitle, setCurrentTrackTitle] = useState(null);
  const [currentArtwork, setCurrentArtwork] = useState(null);
  const [pause, setPause] = useState(true);

  // Refs
  const waveformRef = useRef(null);
  const wavesurferRef = useRef(null);
  const volumeButtonRef = useRef(null);
  const prevVolumeRef = useRef(INITIAL_VOLUME);
  const stateRef = useRef();
  const playerContainerRef = useRef(null);
  const lastTimeUpdateRef = useRef(0);

  // Memo
  const songSrc = useMemo(
    () => (currentTrackId ? `/api/track?id=${currentTrackId}` : null),
    [currentTrackId]
  );

  // State
  const [playerState, setPlayerState] = useState(() => ({
    // IMPORTANT: safe SSR defaults to avoid hydration mismatch
    volume: INITIAL_VOLUME,
    isSongLoaded: false,
    currentTime: 0,
    duration: 0,
    mode: MODES.NORMAL,
    isLoading: false,
  }));

  const { volume, isSongLoaded, currentTime, duration, mode, isLoading } =
    playerState;

  // Hydrate persisted state after mount (no SSR reads of localStorage)
  useEffect(() => {
    if (!mounted) return;
    setPlayerState((prev) => ({
      ...prev,
      volume: getStoredValue("audioPlayerVolume", INITIAL_VOLUME),
      mode: getStoredValue("audioPlayerMode", MODES.NORMAL),
    }));
  }, [mounted]);

  // Update state ref
  useEffect(() => {
    stateRef.current = { ...playerState, pause };
  }, [playerState, pause]);

  const setState = useCallback((update) => {
    setPlayerState((prev) => {
      const newState = typeof update === "function" ? update(prev) : update;
      return { ...prev, ...newState };
    });
  }, []);

  // Create WaveSurfer on client only via dynamic import
  useEffect(() => {
    if (!mounted || !waveformRef.current) return;

    let ws;
    let cancelled = false;

    (async () => {
      const WaveSurfer = (await import("wavesurfer.js")).default;

      ws = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: "oklch(.208 .042 265.755)",
        progressColor: "#fff",
        height: 40,
        interact: true,
        cursorWidth: 1,
        cursorColor: "#fff",
        barWidth: 2,
        barGap: -1,
        barRadius: 2,
        volume: 0, // set to 0 then apply stored volume
      });

      wavesurferRef.current = ws;

      ws.setVolume(getStoredValue("audioPlayerVolume", INITIAL_VOLUME));

      const handleReady = () => {
        if (cancelled) return;
        setState({
          isSongLoaded: true,
          isLoading: false,
          duration: ws.getDuration(),
          currentTime: 0,
        });
        ws.play();
      };

      const handlePlay = () => setPause(false);
      const handlePause = () => setPause(true);

      const handleTimeUpdate = (ct) => {
        const now = performance.now();
        // Throttle UI updates to ~10fps to reduce re-renders
        if (now - lastTimeUpdateRef.current > 100) {
          lastTimeUpdateRef.current = now;
          setState({ currentTime: ct });
        }
      };

      const handleFinish = () => {
        const currentMode = stateRef.current.mode;

        if (currentMode === MODES.SINGLE) {
          ws.seekTo(0);
          ws.play();
        } else if (currentMode === MODES.LOOP) {
          setPause(true);
          setState((prev) => ({ ...prev, currentTime: 0 }));
          ws.seekTo(0);
          socket.emit("playlistNext");
        } else {
          setPause(true);
          setState((prev) => ({ ...prev, currentTime: 0 }));
          ws.seekTo(0);
        }
      };

      ws.on("ready", handleReady);
      ws.on("play", handlePlay);
      ws.on("pause", handlePause);
      ws.on("timeupdate", handleTimeUpdate);
      ws.on("finish", handleFinish);
    })();

    return () => {
      cancelled = true;
      try {
        wavesurferRef.current?.destroy();
      } catch {}
      wavesurferRef.current = null;
    };
  }, [mounted, setState]);

  // Load a new song when songSrc changes
  useEffect(() => {
    if (!mounted || !wavesurferRef.current || !songSrc) return;

    setState({
      isSongLoaded: false,
      isLoading: true,
      currentTime: 0,
      duration: 0,
    });

    wavesurferRef.current.load(songSrc);
  }, [mounted, songSrc, setState]);

  // Socket events
  useEffect(() => {
    const handlePlayNow = (trackId, trackTitle) => {
      setCurrentTrackId(null);
      setCurrentTrackTitle(null);
      setCurrentArtwork(null);

      // schedule to let WS cleanup first
      setTimeout(() => {
        setCurrentTrackId(trackId);
        setCurrentTrackTitle(trackTitle);
        toast(`Now playing ${trackTitle}`);
      }, 0);
    };

    socket.on("playNow", handlePlayNow);
    return () => socket.off("playNow", handlePlayNow);
  }, []);

  // Fetch artwork
  useEffect(() => {
    if (!currentTrackId) return;
    let cancelled = false;

    fetch(`/api/track-info?id=${currentTrackId}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const artwork = data.artwork_url || data.user?.avatar_url || null;
        setCurrentArtwork(artwork || null);
      })
      .catch(() => setCurrentArtwork(null));

    return () => {
      cancelled = true;
    };
  }, [currentTrackId]);

  // Document title
  useEffect(() => {
    if (!currentTrackTitle) return;
    const originalTitle = document.title;
    document.title = currentTrackTitle;
    return () => {
      document.title = originalTitle;
    };
  }, [currentTrackTitle]);

  // Play/Pause toggle
  const handlePlayPause = useCallback(() => {
    if (!wavesurferRef.current || !isSongLoaded) return;
    wavesurferRef.current.playPause();
  }, [isSongLoaded]);

  // Exposed API
  useImperativeHandle(ref, () => ({
    play: () => wavesurferRef.current?.play(),
    pause: () => wavesurferRef.current?.pause(),
    togglePlayPause: handlePlayPause,
    setVolume: (newVolume) =>
      setState({
        volume: Math.max(0, Math.min(1, newVolume)),
      }),
    setMuted: (muted) =>
      setState({ volume: muted ? 0 : prevVolumeRef.current }),
    setCurrentTime: (time) => {
      if (!wavesurferRef.current || !isSongLoaded) return;
      const progress = duration > 0 ? time / duration : 0;
      wavesurferRef.current.seekTo(progress);
      setState({ currentTime: time });
    },
  }));

  // Global key capture
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        !wavesurferRef.current ||
        !stateRef.current?.isSongLoaded ||
        ["INPUT", "TEXTAREA"].includes(e.target?.tagName)
      )
        return;

      switch (e.key) {
        case " ":
          e.preventDefault();
          handlePlayPause();
          break;
        case "ArrowLeft":
          e.preventDefault();
          wavesurferRef.current.skip(-5);
          break;
        case "ArrowRight":
          e.preventDefault();
          wavesurferRef.current.skip(5);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handlePlayPause]);

  // Volume apply to WS
  useEffect(() => {
    if (wavesurferRef.current) {
      wavesurferRef.current.setVolume(volume);
      if (volume > 0) prevVolumeRef.current = volume;
    }
  }, [volume]);

  // Volume wheel on button
  useEffect(() => {
    const volumeButton = volumeButtonRef.current;
    if (!volumeButton || !isSongLoaded) return;

    const handleWheel = (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.05 : 0.05;
      setState((prev) => ({
        volume: Math.max(0, Math.min(1, prev.volume + delta)),
      }));
    };

    volumeButton.addEventListener("wheel", handleWheel, { passive: false });
    return () => volumeButton.removeEventListener("wheel", handleWheel);
  }, [isSongLoaded, setState]);

  // Persist volume (debounced)
  useEffect(() => {
    if (!mounted) return;
    const id = setTimeout(() => {
      try {
        localStorage.setItem("audioPlayerVolume", volume.toString());
      } catch {}
    }, 150);
    return () => clearTimeout(id);
  }, [mounted, volume]);

  // Toggle mute
  const handleToggleMute = useCallback(() => {
    if (!isSongLoaded) return;
    setState((prev) => ({
      volume: prev.volume > 0 ? 0 : prevVolumeRef.current || INITIAL_VOLUME,
    }));
  }, [isSongLoaded, setState]);

  // Slider rounding
  const handleVolumeChange = useCallback(
    ([newVolume]) => {
      if (Math.abs(newVolume - 0.5) <= 0.05) {
        setState({ volume: 0.5 });
      } else {
        setState({ volume: Math.round(newVolume * 20) / 20 });
      }
    },
    [setState]
  );

  // Loop button memo
  const { modeButtonProps, modeIcon } = useMemo(() => {
    const isSpecialMode = mode === MODES.LOOP || mode === MODES.SINGLE;

    return {
      modeButtonProps: {
        variant: isSpecialMode ? "highlighted" : "outline",
        className: "w-9 h-9",
      },
      modeIcon:
        mode === MODES.LOOP ? (
          <Repeat size={16} />
        ) : mode === MODES.SINGLE ? (
          <Repeat1 size={16} />
        ) : (
          <Repeat size={16} />
        ),
    };
  }, [mode]);

  // Persist mode
  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem("audioPlayerMode", mode.toString());
    } catch {}
  }, [mounted, mode]);

  // UI render
  return (
    <div className="sticky top-0 w-full p-3 z-50">
      <div
        ref={playerContainerRef}
        className="bg-background pt-2 flex items-center space-x-2 p-2 border border-input rounded-2xl w-full flex-col"
      >
        <div className="relative flex items-center w-full space-x-2">
          {/* Back */}
          <Button
            className="w-9 h-9 rounded-lg"
            variant="outline"
            disabled={!isSongLoaded || isLoading}
            onClick={() => socket.emit("playlistPrevious")}
            aria-label="Previous"
          >
            <SkipBack />
          </Button>

          {/* Play / Pause */}
          <Button
            className="w-9 h-9 rounded-lg"
            variant="outline"
            onClick={handlePlayPause}
            disabled={!isSongLoaded || isLoading}
            aria-label={pause ? "Play" : "Pause"}
          >
            {isLoading ? (
              <Ring size="16" stroke="2" bgOpacity="0" speed="2" color="white" />
            ) : pause ? (
              <PlayIcon size={16} />
            ) : (
              <PauseIcon size={16} />
            )}
          </Button>

          {/* Next */}
          <Button
            className="w-9 h-9 rounded-lg"
            variant="outline"
            disabled={!isSongLoaded || isLoading}
            onClick={() => socket.emit("playlistNext")}
            aria-label="Next"
          >
            <SkipForward />
          </Button>

          {/* Loop Button */}
          <Button
            {...modeButtonProps}
            onClick={() =>
              setState((prev) => ({
                mode: (prev.mode % 3) + 1,
              }))
            }
            className="w-9 h-9"
            aria-label="Loop mode"
          >
            {modeIcon}
          </Button>

          {/* Timestamps & Visualizer */}
          <div
            className={`w-full flex items-center space-x-2 flex-grow ${
              !isSongLoaded || duration === 0
                ? "pointer-events-none opacity-50"
                : ""
            }`}
          >
            {currentTrackId ? (
              <span
                className="text-xs text-foreground/70 w-10 text-right"
                suppressHydrationWarning
              >
                {formatTime(currentTime)}
              </span>
            ) : null}

            <div ref={waveformRef} className="w-full cursor-pointer" />

            {currentTrackId ? (
              <span
                className="text-xs text-foreground/70 w-10 text-left"
                suppressHydrationWarning
              >
                {formatTime(duration)}
              </span>
            ) : null}
          </div>

          {/* Volume */}
          <HoverCard>
            <HoverCardTrigger asChild>
              <Button
                className="w-9 h-9 md:flex hidden"
                ref={volumeButtonRef}
                variant="outline"
                onClick={handleToggleMute}
                aria-label="Toggle mute"
              >
                {volume === 0 ? (
                  <VolumeXIcon size={16} />
                ) : volume > 0.49 ? (
                  <Volume2Icon size={16} />
                ) : (
                  <Volume1Icon size={16} />
                )}
              </Button>
            </HoverCardTrigger>
            <HoverCardContent className="w-30">
              <Slider
                value={[volume]}
                onValueChange={handleVolumeChange}
                max={1}
                step={0.05}
                onValueCommit={(value) => {
                  if (Math.abs(value[0] - 0.5) <= 0.05) {
                    setState({ volume: 0.5 });
                  }
                }}
                aria-label="Volume"
              />
            </HoverCardContent>
          </HoverCard>

          {/* Song Indicator */}
          {currentTrackId ? (
            <SmallTrack
              id={currentTrackId}
              artwork={currentArtwork}
              title={currentTrackTitle}
              link={`/track?id=${currentTrackId}`}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
});