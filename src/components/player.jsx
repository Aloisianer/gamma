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
import { LuRepeat1, LuRepeat } from "react-icons/lu";
import { PlayIcon, PauseIcon, Volume2Icon, VolumeXIcon } from "lucide-react";

const formatTime = (time) => {
  if (isNaN(time) || !isFinite(time)) return "0:00";
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

const AudioPlayer = forwardRef(({ src }, ref) => {
  const audioRef = useRef(null);
  const volumeButtonRef = useRef(null);
  
  const [playerState, setPlayerState] = useState({
    isPlaying: false,
    volume: 0.5,
    isMuted: false,
    isSongLoaded: false,
    currentTime: 0,
    duration: 0,
    mode: 1,
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
      if (nextMode === 2) console.log("Mode 2 activated");
      if (nextMode === 3) console.log("Mode 3 activated");
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
      ? player.play().then(() => setState({ isPlaying: true }))
      : Promise.resolve(player.pause()).then(() => setState({ isPlaying: false }));

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

  const handleTimelineChange = useCallback(([value]) => {
    if (isSongLoaded && audioRef.current) {
      audioRef.current.currentTime = value;
      setState({ currentTime: value });
    }
  }, [isSongLoaded, setState]);

  useImperativeHandle(ref, () => ({
    play: () => {
      audioRef.current?.play()?.then(() => setState({ isPlaying: true }));
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

  // Main audio effect - fixed dependency array
  useEffect(() => {
    const player = audioRef.current;
    if (!player || !src) {
      setState({ isSongLoaded: false, isPlaying: false });
      return;
    }

    const handleCanPlay = () => {
      setState({
        isSongLoaded: true,
        duration: player.duration,
        currentTime: player.currentTime
      });
      player.play().then(() => setState({ isPlaying: true })).catch(console.error);
    };

    const handleTimeUpdate = () => setState({ currentTime: player.currentTime });
    const handleMetadata = () => setState({ duration: player.duration });
    const handleError = () => setState({ isPlaying: false, isSongLoaded: false });
    const handleEnded = () => setState({ isPlaying: false, currentTime: 0 });

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

    if (player.src !== src) {
      player.src = src;
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
  }, [src, setState]); // Removed volume/isMuted from dependencies

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
          className: ""
        };
      case 3:
        return {
          variant: "highlighted",
          className: ""
        };
      default:
        return {
          variant: "outline",
          className: ""
        };
    }
  }, [mode]);

  const modeIcon = useMemo(() => 
    mode === 2 ? <LuRepeat1 size={16} /> : <LuRepeat size={16} />, 
  [mode]);

  return (
    <div className="flex items-center space-x-2 p-2 border rounded-md">
      <audio ref={audioRef} preload="auto" />
      
      <Button
        variant="outline"
        size="icon"
        onClick={handlePlayPause}
        disabled={!isSongLoaded}
      >
        {isPlaying ? <PauseIcon size={16} /> : <PlayIcon size={16} />}
      </Button>

      <Button
        ref={volumeButtonRef}
        variant="outline"
        size="icon"
        onClick={handleToggleMute}
        disabled={!isSongLoaded}
        title={`Volume: ${displayVolume}%`}
      >
        {isMuted || volume === 0 ? (
          <VolumeXIcon size={16} className="text-gray-500" />
        ) : (
          <Volume2Icon size={16} className="text-gray-700" />
        )}
      </Button>

      <Button
        {...modeButtonProps}
        onClick={toggleMode}
        title={`Mode ${mode}`}
      >
        {modeIcon}
      </Button>

      <div className={`flex items-center space-x-2 flex-grow ${
        !isSongLoaded || duration === 0 ? 'pointer-events-none opacity-50' : ''
      }`}>
        <span className="text-xs text-gray-600 w-10 text-right">
          {formatTime(currentTime)}
        </span>
        <Slider
          value={[currentTime]}
          max={duration}
          step={1}
          onValueChange={handleTimelineChange}
          className="flex-grow h-[4px] [&>span]:h-full [&>span]:top-0 [&_span]:translate-y-0 [&_[role=slider]]:translate-y-[-50%]"
          disabled={!isSongLoaded || duration === 0}
        />
        <span className="text-xs text-gray-600 w-10 text-left">
          {formatTime(duration)}
        </span>
      </div>
    </div>
  );
});

AudioPlayer.displayName = "AudioPlayer";
export default AudioPlayer;