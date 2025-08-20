"use client";

import {
  useRef,
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useCallback,
  useMemo
} from "react";
import WaveSurfer from "wavesurfer.js";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { PlayIcon, PauseIcon, Volume2Icon, Volume1Icon, VolumeXIcon, Repeat, Repeat1, SkipBack, SkipForward, X } from "lucide-react";
import { toast } from "sonner";
import { socket } from "@/socket"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import { Ring } from "ldrs/react";
import 'ldrs/react/Ring.css'
import { getStoredValue, formatTime } from "@/lib/utils"
import { SmallTrack } from "@/components/track"

// letants
let INITIAL_VOLUME = 0.5;
let MODES = {
  NORMAL: 1,
  LOOP: 2,
  SINGLE: 3
};

let AudioPlayer = forwardRef((props, ref) => {
  let [currentTrackId, setCurrentTrackId] = useState(null);
  let [currentTrackTitle, setCurrentTrackTitle] = useState(null);
  let [currentArtwork, setCurrentArtwork] = useState(null);
  let [pause, setPause] = useState(true);

  // Refs
  let waveformRef = useRef(null);
  let wavesurferRef = useRef(null);
  let volumeButtonRef = useRef(null);
  let prevVolumeRef = useRef(INITIAL_VOLUME);
  let stateRef = useRef();
  let playerContainerRef = useRef(null);

  // Memoized values
  let songSrc = useMemo(() =>
    currentTrackId ? `/api/track?id=${currentTrackId}` : null,
    [currentTrackId]
  );

  // State initialization
  let [playerState, setPlayerState] = useState(() => ({
    volume: getStoredValue('audioPlayerVolume', INITIAL_VOLUME),
    isSongLoaded: false,
    currentTime: 0,
    duration: 0,
    mode: getStoredValue('audioPlayerMode', MODES.NORMAL),
    isLoading: false,
  }));

  let {
    volume,
    isSongLoaded,
    currentTime,
    duration,
    mode,
    isLoading
  } = playerState;

  // Update state ref
  useEffect(() => {
    stateRef.current = { ...playerState, pause };
  }, [playerState, pause]);

  // Optimized state setter
  let setState = useCallback((update) => {
    setPlayerState(prev => {
      let newState = typeof update === 'function' ? update(prev) : update;
      return { ...prev, ...newState };
    });
  }, []);

  // WaveSurfer initialization
  useEffect(() => {
    if (!waveformRef.current) return;

    let wavesurfer = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: 'oklch(.208 .042 265.755)',
      progressColor: '#fff',
      height: 40,
      interact: true,
      cursorWidth: 1,
      cursorColor: '#fff',
      barWidth: 2,
      barGap: -1,
      barRadius: 2,
      volume: 0,
    });

    wavesurferRef.current = wavesurfer;
    wavesurferRef.current.setVolume(getStoredValue('audioPlayerVolume', INITIAL_VOLUME))

    // Event handlers
    let handleReady = () => {
      setState({
        isSongLoaded: true,
        isLoading: false,
        duration: wavesurfer.getDuration(),
        currentTime: 0
      });
      wavesurfer.play();
    };

    let handlePlay = () => setPause(false);
    let handlePause = () => setPause(true);

    let handleTimeUpdate = (ct) => {
      setState({ currentTime: ct });
    };

    let handleFinish = () => {
      let currentMode = stateRef.current.mode;

      if (currentMode === MODES.SINGLE) {
        wavesurfer.seekTo(0);
        wavesurfer.play();
      } else if (currentMode === MODES.LOOP) {
        setPause(true);
        setState(prev => ({ ...prev, currentTime: 0 }));
        wavesurfer.seekTo(0);
        socket.emit("playlistNext");
      } else {
        setPause(true);
        setState(prev => ({ ...prev, currentTime: 0 }));
        wavesurfer.seekTo(0);
      }
    };

    // Register events
    wavesurfer.on('ready', handleReady);
    wavesurfer.on('play', handlePlay);
    wavesurfer.on('pause', handlePause);
    wavesurfer.on('timeupdate', handleTimeUpdate);
    wavesurfer.on('finish', handleFinish);

    return () => wavesurfer.destroy();
  }, [setState]);

  // Load new song when songSrc changes
  useEffect(() => {
    if (!wavesurferRef.current || !songSrc) return;

    // Reset state for new track
    setState({
      isSongLoaded: false,
      isLoading: true,
      currentTime: 0,
      duration: 0
    });

    // Load the new track
    wavesurferRef.current.load(songSrc);
  }, [songSrc, setState]);

  // Socket events
  useEffect(() => {
    let handlePlayNow = (trackId, trackTitle) => {
      setCurrentTrackId(null);
      setCurrentTrackTitle(null);
  setCurrentArtwork(null);

      setTimeout(() => {
        setCurrentTrackId(trackId);
        setCurrentTrackTitle(trackTitle);
        toast(`Now playing ${trackTitle}`);
      }, 0);
    };

    socket.on("playNow", handlePlayNow);
    return () => socket.off("playNow", handlePlayNow);
  }, []);

  // Fetch artwork client-side for the current track
  useEffect(() => {
    if (!currentTrackId) return;

    let cancelled = false;
    fetch(`/api/track-info?id=${currentTrackId}`)
      .then(r => r.json())
      .then(data => {
        if (cancelled) return;
        // prefer artwork_url, else user avatar; keep original size for small images
        let artwork = data.artwork_url || data.user?.avatar_url || null;
        setCurrentArtwork(artwork || null);
      })
      .catch(() => setCurrentArtwork(null));

    return () => { cancelled = true };
  }, [currentTrackId]);

  // Document title updates
  useEffect(() => {
    if (!currentTrackTitle) return;
    let originalTitle = document.title;
    document.title = currentTrackTitle;
    return () => { document.title = originalTitle };
  }, [currentTrackTitle]);

  // Play/pause toggle
  let handlePlayPause = useCallback(() => {
    if (!wavesurferRef.current || !isSongLoaded) return;
    wavesurferRef.current.playPause();
  }, [isSongLoaded]);


  // Functions and stuff
  // --------------------------------
  useImperativeHandle(ref, () => ({
    play: () => wavesurferRef.current?.play(),
    pause: () => wavesurferRef.current?.pause(),
    togglePlayPause: handlePlayPause,
    setVolume: (newVolume) => setState({ volume: Math.max(0, Math.min(1, newVolume)) }),
    setMuted: (muted) => setState({ volume: muted ? 0 : prevVolumeRef.current }),
    setCurrentTime: (time) => {
      if (!wavesurferRef.current || !isSongLoaded) return;
      let progress = time / duration;
      wavesurferRef.current.seekTo(progress);
      setState({ currentTime: time });
    }
  }));
  // --------------------------------

  // Global key capture
  // --------------------------------
  useEffect(() => {
    let handleKeyDown = (e) => {
      if (
        !wavesurferRef.current ||
        !stateRef.current.isSongLoaded ||
        ['INPUT', 'TEXTAREA'].includes(e.target?.tagName)
      ) return;

      switch (e.key) {
        case ' ':
          e.preventDefault();
          handlePlayPause();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          wavesurferRef.current.skip(-5);
          break;
        case 'ArrowRight':
          e.preventDefault();
          wavesurferRef.current.skip(5);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePlayPause]);
  // --------------------------------


/// Volume Button
// --------------------------------
        // Visualizer
        // ---------------
        useEffect(() => {
          if (wavesurferRef.current) {
            wavesurferRef.current.setVolume(volume);
            if (volume > 0) prevVolumeRef.current = volume;
          }
        }, [volume]);
        // ---------------
      
        // Scrolling on button
        // ---------------
        useEffect(() => {
          let volumeButton = volumeButtonRef.current;
          if (!volumeButton || !isSongLoaded) return;
        
          let handleWheel = (e) => {
            e.preventDefault();
            let delta = e.deltaY > 0 ? -0.05 : 0.05;
            setState(prev => ({
              volume: Math.max(0, Math.min(1, prev.volume + delta))
            }));
          };
        
          volumeButton.addEventListener('wheel', handleWheel);
          return () => volumeButton.removeEventListener('wheel', handleWheel);
        }, [isSongLoaded, setState]);
        // ---------------

        // Get volume from localStorage
        // ---------------
        useEffect(() => {
          localStorage.setItem('audioPlayerVolume', volume.toString());
        }, [volume]);
        // ---------------
      
      
        // Clicking on button (Mute Toggle)
        // ---------------
        let handleToggleMute = useCallback(() => {
          if (!isSongLoaded) return;
          setState(prev => ({
            volume: prev.volume > 0 ? 0 : prevVolumeRef.current || INITIAL_VOLUME
          }));
        }, [isSongLoaded, setState]);
        // ---------------
      
        // Rounding (0.69 -> 0.70) ((nice.))
        // ---------------
        let handleVolumeChange = useCallback(([newVolume]) => {
          if (Math.abs(newVolume - 0.5) <= 0.05) {
            setState({ volume: 0.5 });
          } else {
            setState({ volume: Math.round(newVolume * 20) / 20 });
          }
        }, [setState]);
        // ---------------
// --------------------------------


/// Loop Button
// --------------------------------
        // Style for Button
        // ---------------
        let { modeButtonProps, modeIcon } = useMemo(() => {
          let isSpecialMode = mode === MODES.LOOP || mode === MODES.SINGLE;
        
          return {
            modeButtonProps: {
              variant: isSpecialMode ? "highlighted" : "outline",
              className: "w-9 h-9"
            },
            modeIcon: mode === MODES.LOOP ? <Repeat size={16} /> :
              mode === MODES.SINGLE ? <Repeat1 size={16} /> :
                <Repeat size={16} />
          };
        }, [mode]);
        
        // Get from localStorage
        // ---------------
        useEffect(() => {
          localStorage.setItem('audioPlayerMode', mode.toString());
        }, [mode]);
        // ---------------
// --------------------------------

  return (
    <div className="sticky top-0 w-full p-3 z-50">
      <div
        ref={playerContainerRef}
        className="bg-background pt-2 flex items-center space-x-2 p-2 border border-input rounded-2xl w-full flex-col"
      >
        <div className="relative flex items-center w-full space-x-2">
          {/* Back */}
          {/* -------------------------------- */}
          <Button
            className="w-9 h-9 rounded-lg"
            variant="outline"
            disabled={!isSongLoaded || isLoading}
            onClick={() => socket.emit('playlistPrevious')}
          ><SkipBack /></Button>
          {/* -------------------------------- */}

          {/* Play / Pause / Resume */}
          {/* -------------------------------- */}
          <Button
            className="w-9 h-9 rounded-lg"
            variant="outline"
            onClick={handlePlayPause}
            disabled={!isSongLoaded || isLoading}
          >
            {isLoading ? (
              <Ring
                size="16"
                stroke="2"
                bgOpacity="0"
                speed="2"
                color="white"
              />
            ) : pause ? (
              <PlayIcon size={16} />
            ) : (
              <PauseIcon size={16} />
            )}
          </Button>
          {/* -------------------------------- */}

          {/* Next */}
          {/* -------------------------------- */}
          <Button
            className="w-9 h-9 rounded-lg"
            variant="outline"
            disabled={!isSongLoaded || isLoading}
            onClick={() => socket.emit('playlistNext')}
          ><SkipForward /></Button>
          {/* -------------------------------- */}

          {/* Loop Button */}
          {/* -------------------------------- */}
          <Button
            {...modeButtonProps}
            onClick={() => setState(prev => ({
              mode: prev.mode % 3 + 1
            }))}
            className="w-9 h-9"
          >
            {modeIcon}
          </Button>
          {/* -------------------------------- */}

          {/* Timestaps & Visualizer*/}
          {/* -------------------------------- */}
          <div className={`w-full flex items-center space-x-2 flex-grow ${!isSongLoaded || duration === 0 ? 'pointer-events-none opacity-50' : ''}`}>
            {currentTrackId ? (
              <span className="text-xs text-foreground/70 w-10 text-right">
                {formatTime(currentTime)}
              </span>
            ) : null}

            <div
              ref={waveformRef}
              className="w-full cursor-pointer"
            />

            {currentTrackId ? (
              <span className="text-xs text-foreground/70 w-10 text-left">
                {formatTime(duration)}
              </span>
            ) : null}
          </div>
          {/* -------------------------------- */}

          {/* Volume Button */}
          {/* -------------------------------- */}
          <HoverCard className="md:flex hidden">
            <HoverCardTrigger asChild>
              <Button
                className="w-9 h-9 md:flex hidden"
                ref={volumeButtonRef}
                variant="outline"
                onClick={handleToggleMute}
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
                defaultValue={[volume]}
                value={[volume]}
                onValueChange={handleVolumeChange}
                max={1}
                step={0.05}
                onValueCommit={(value) => {
                  if (Math.abs(value[0] - 0.5) <= 0.05) {
                    setState({ volume: 0.5 });
                  }
                }}
              />
            </HoverCardContent>
          </HoverCard>
          {/* -------------------------------- */}

          {/* Song Indicator */}
          {/* -------------------------------- */}
          {currentTrackId ? (
            <SmallTrack id={currentTrackId} artwork={currentArtwork} title={currentTrackTitle} link={`/track?id=${currentTrackId}`} />
          ) : null}
          {/* -------------------------------- */}
        </div>
      </div>
    </div>
  );
});

AudioPlayer.displayName = "AudioPlayer";
export default AudioPlayer;