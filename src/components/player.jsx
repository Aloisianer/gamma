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
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { PlayIcon, PauseIcon, Volume2Icon, Volume1Icon, VolumeXIcon, Repeat, Repeat1 } from "lucide-react";
import { toast } from "sonner";
import { socket } from "@/socket"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"

const formatTime = (time) => {
  if (isNaN(time) || !isFinite(time)) return "0:00";
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

// Get initial volume from localStorage or default to 0.5
const getInitialVolume = () => {
  if (typeof window === 'undefined') return 0.5;
  const savedVolume = localStorage.getItem('audioPlayerVolume');
  return savedVolume ? parseFloat(savedVolume) : 0.5;
};

// Get initial mode from localStorage or default to 1
const getInitialMode = () => {
  if (typeof window === 'undefined') return 1;
  const savedMode = localStorage.getItem('audioPlayerMode');
  return savedMode ? parseInt(savedMode) : 1;
};

const AudioPlayer = forwardRef((props, ref) => {
  const audioRef = useRef(null);
  const volumeButtonRef = useRef(null);
  let [currentTrackId, setCurrentTrackId] = useState(null);
  
  const songSrc = useMemo(() => {
    if (currentTrackId) {
      return `/api/track?id=${currentTrackId}`;
    }
    return null;
  }, [currentTrackId]);

  useEffect(() => {
    let handlePlayNow = async (trackId, trackTitle) => {
      if (!audioRef.current) {
        return;
      }

      setCurrentTrackId(trackId);
      toast(`Now playing ${trackTitle} (${trackId})`);
    };

    socket.on("playNow", handlePlayNow);

    return () => {
      socket.off("playNow", handlePlayNow);
    };
  }, []);
  
  const [playerState, setPlayerState] = useState({
    isPlaying: false,
    volume: getInitialVolume(), // Initialize from localStorage
    isMuted: false,
    isSongLoaded: false,
    currentTime: 0,
    duration: 0,
    mode: getInitialMode(), // Initialize mode from localStorage
  });

  const { 
    isPlaying, 
    volume, 
    isMuted, 
    isSongLoaded, 
    currentTime, 
    duration,
    mode 
  } = playerState;

  // Save volume to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('audioPlayerVolume', volume.toString());
  }, [volume]);

  // Save mode to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('audioPlayerMode', mode.toString());
  }, [mode]);

  const stateRef = useRef(playerState);
  useEffect(() => {
    stateRef.current = playerState;
  }, [playerState]);

  const setState = useCallback((update) => {
    setPlayerState(prev => {
      const newState = typeof update === 'function' ? update(prev) : update;
      return { ...prev, ...newState };
    });
  }, []);

  const toggleMode = useCallback(() => {
    setState(prev => {
      const nextMode = prev.mode % 3 + 1;
      return { mode: nextMode };
    });
  }, [setState]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.loop = mode === 2;
    }
  }, [mode]);

  // Volume update effect
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Mute update effect
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  const handlePlayPause = useCallback(() => {
    const player = audioRef.current;
    if (!player || !isSongLoaded) return;

    const newPlaying = !isPlaying;
    
    const playbackPromise = newPlaying 
      ? player.play().then(() => {
          if (audioRef.current) {
            setState({ isPlaying: true });
          }
        })
      : Promise.resolve(player.pause()).then(() => {
          if (audioRef.current) {
            setState({ isPlaying: false });
          }
        });

    playbackPromise.catch(console.error);
  }, [isSongLoaded, isPlaying, setState]);

  const handleToggleMute = useCallback(() => {
    if (!isSongLoaded) return;

    setState(prev => {
      const newMuted = !prev.isMuted;
      if (!newMuted && prev.volume === 0) {
        return { isMuted: newMuted, volume: 0.5 };
      }
      return { isMuted: newMuted };
    });
  }, [isSongLoaded, setState]);

  // Volume change handler with snap-to-center
  const handleVolumeChange = useCallback(([newVolume]) => {
    // Snap to 50% if within 5% of center
    if (newVolume > 0.45 && newVolume < 0.55) {
      newVolume = 0.5;
    }
    
    setState({
      volume: newVolume,
      isMuted: newVolume === 0
    });
  }, [setState]);

  const handleTimelineChange = useCallback(([value]) => {
    if (isSongLoaded && audioRef.current) {
      audioRef.current.currentTime = value;
      setState({ currentTime: value });
    }
  }, [isSongLoaded, setState]);

  // Fixed useImperativeHandle to use forwarded ref
  useImperativeHandle(ref, () => ({
    play: () => {
      audioRef.current?.play()?.then(() => {
        if (audioRef.current) {
          setState({ isPlaying: true });
        }
      });
    },
    pause: () => {
      audioRef.current?.pause();
      setState({ isPlaying: false });
    },
    togglePlayPause: handlePlayPause,
    setVolume: (newVolume) => {
      const clamped = Math.max(0, Math.min(1, newVolume));
      setState({ 
        volume: clamped,
        isMuted: clamped === 0
      });
    },
    setMuted: (muted) => setState({ isMuted: muted }),
    setCurrentTime: (time) => {
      if (audioRef.current && isSongLoaded) {
        audioRef.current.currentTime = time;
        setState({ currentTime: time });
      }
    }
  }));

  // Main audio effect
  useEffect(() => {
    const player = audioRef.current;
    if (!player || !songSrc) {
      setState({ isSongLoaded: false, isPlaying: false });
      return;
    }

    const handleCanPlay = () => {
      if (!audioRef.current) return;
      setState({
        isSongLoaded: true,
        duration: player.duration,
        currentTime: player.currentTime
      });
      player.play().then(() => {
        if (audioRef.current) {
          setState({ isPlaying: true });
        }
      }).catch(console.error);
    };

    const handleTimeUpdate = () => {
      if (audioRef.current) {
        setState({ currentTime: player.currentTime });
      }
    };
    
    const handleMetadata = () => {
      if (audioRef.current) {
        setState({ duration: player.duration });
      }
    };
    
    const handleError = () => {
      if (audioRef.current) {
        setState({ isPlaying: false, isSongLoaded: false });
      }
    };
    
    const handleEnded = () => {
      if (audioRef.current) {
        setState({ isPlaying: false, currentTime: 0 });
      }
    };

    const events = [
      ['canplaythrough', handleCanPlay],
      ['timeupdate', handleTimeUpdate],
      ['loadedmetadata', handleMetadata],
      ['error', handleError],
      ['ended', handleEnded]
    ];

    events.forEach(([event, handler]) => 
      player.addEventListener(event, handler)
    );

    if (player.src !== songSrc) {
      player.src = songSrc;
      player.load();
    }

    // Set initial volume/mute state
    player.volume = volume;
    player.muted = isMuted;

    return () => {
      events.forEach(([event, handler]) => 
        player.removeEventListener(event, handler)
      );
      player.pause();
    };
  }, [songSrc, setState]);

  // Volume wheel handler
  useEffect(() => {
    const volumeButton = volumeButtonRef.current;
    if (!volumeButton || !isSongLoaded) return;

    const handleWheel = (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.05 : 0.05;
      const newVolume = Math.max(0, Math.min(1, volume + delta));
      
      setState({ 
        volume: newVolume,
        isMuted: newVolume === 0
      });
    };

    volumeButton.addEventListener('wheel', handleWheel);
    return () => volumeButton.removeEventListener('wheel', handleWheel);
  }, [isSongLoaded, volume]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      const player = audioRef.current;
      const currentState = stateRef.current;
      
      if (!player || !currentState.isSongLoaded || 
          ['INPUT', 'TEXTAREA'].includes(e.target?.tagName)) return;

      switch (e.key) {
        case ' ':
          e.preventDefault();
          handlePlayPause();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          player.currentTime = Math.max(0, player.currentTime - 5);
          break;
        case 'ArrowRight':
          e.preventDefault();
          player.currentTime = Math.min(currentState.duration, player.currentTime + 5);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePlayPause]);

  const displayVolume = useMemo(() => 
    isMuted ? 0 : Math.round(volume * 100), 
  [isMuted, volume]);

  const modeButtonProps = useMemo(() => {
    switch(mode) {
      case 2:
        return {
          variant: "highlighted",
          className: "w-9 h-9"
        };
      case 3:
        return {
          variant: "highlighted",
          className: "w-9 h-9"
        };
      default:
        return {
          variant: "outline",
          className: "w-9 h-9"
        };
    }
  }, [mode]);

  const modeIcon = useMemo(() => 
    mode === 2 ? <Repeat1 size={16} /> : <Repeat size={16} />, 
  [mode]);

  return (
    <div className="sticky top-0 w-full p-3">
      <div className="bg-background">
        <div
          className="flex items-center space-x-2 p-2 border border-input rounded-2xl"
        >
          <audio ref={audioRef} preload="auto" />

          <Button
            className="w-9 h-9"
            variant="outline"
            onClick={handlePlayPause}
            disabled={!isSongLoaded}
          >
            {isPlaying ? <PauseIcon size={16} /> : <PlayIcon size={16} />}
          </Button>

          <HoverCard>
            <HoverCardTrigger asChild>
              <Button
                className="w-9 h-9"
                ref={volumeButtonRef}
                variant="outline"
                onClick={handleToggleMute}
                disabled={!isSongLoaded}
              >
                {isMuted || volume === 0 ? (
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
                step={0.01}
              ></Slider>
            </HoverCardContent>
          </HoverCard>

          <Button
            {...modeButtonProps}
            onClick={toggleMode}
            disabled={!isSongLoaded}
          >
            {modeIcon}
          </Button>

          <div className={`flex items-center space-x-2 flex-grow ${!isSongLoaded || duration === 0 ? 'pointer-events-none opacity-50' : ''
            }`}>
            <span className="text-xs text-gray-600 w-10 text-right">
              {formatTime(currentTime)}
            </span>
            <Slider
              value={[currentTime]}
              max={duration}
              step={1}
              onValueChange={handleTimelineChange}
              disabled={!isSongLoaded || duration === 0}
            />
            <span className="text-xs text-gray-600 w-10 text-left">
              {formatTime(duration)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});

AudioPlayer.displayName = "AudioPlayer";
export default AudioPlayer;