import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    Play, Pause, SkipForward, SkipBack, X, Volume2, VolumeX,
    Maximize2, Settings, Repeat, Shuffle, List
} from 'lucide-react';
import { usePlayer } from '../contexts/PlayerContext';

// Declare YouTube API types
declare global {
    interface Window {
        YT: any;
        onYouTubeIframeAPIReady: () => void;
    }
}

const extractYouTubeId = (url: string): string | null => {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match?.[1]) return match[1];
    }
    return null;
};

const GlobalPlayer: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const {
        currentResource,
        isPlaying,
        isRepeat,
        isShuffle,
        queue,
        currentTime,
        duration,
        togglePlay,
        playNext,
        playPrev,
        stopPlayback,
        seekTo,
        setIsRepeat,
        setIsShuffle,
        playerRef,
        onPlayerReady,
        onPlayerStateChange,
        playerSlotRect,
    } = usePlayer();

    const [apiLoaded, setApiLoaded] = useState(false);
    const [playerInitialized, setPlayerInitialized] = useState(false);
    const [volume, setVolume] = useState(100);
    const [isMuted, setIsMuted] = useState(false);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [showSpeedMenu, setShowSpeedMenu] = useState(false);
    const [showVolumeSlider, setShowVolumeSlider] = useState(false);
    const [showQueuePanel, setShowQueuePanel] = useState(false);
    const lastLoadedVideoIdRef = useRef<string | null>(null);
    const isPlayerPage = location.pathname === '/player' || location.pathname.startsWith('/resource/');

    // Load YouTube IFrame API
    useEffect(() => {
        if (window.YT && window.YT.Player) {
            setApiLoaded(true);
            return;
        }

        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        if (firstScriptTag && firstScriptTag.parentNode) {
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        } else {
            document.head.appendChild(tag);
        }

        window.onYouTubeIframeAPIReady = () => {
            setApiLoaded(true);
        };
    }, []);

    // Initialize YouTube Player ONLY when we have a resource to play and API is ready
    useEffect(() => {
        if (!apiLoaded || playerInitialized || !currentResource) return;

        // Wait for the DOM element to be ready
        const targetElement = document.getElementById('global-youtube-player');
        if (!targetElement) {
            console.log('YouTube player target element not found, retrying...');
            const retryTimeout = setTimeout(() => {
                setPlayerInitialized(false); // Force re-check
            }, 100);
            return () => clearTimeout(retryTimeout);
        }

        try {
            const videoId = extractYouTubeId(currentResource.processedUrl);
            console.log('Initializing YouTube player with video:', videoId);

            playerRef.current = new window.YT.Player('global-youtube-player', {
                height: '100%',
                width: '100%',
                videoId: videoId || undefined, // Load the video immediately on init
                playerVars: {
                    playsinline: 1,
                    autoplay: 1,
                    rel: 0,
                    controls: 1,
                    modestbranding: 1,
                },
                events: {
                    onReady: (event: any) => {
                        console.log('YouTube player ready!');
                        onPlayerReady(event);
                        if (videoId) {
                            lastLoadedVideoIdRef.current = videoId;
                        }
                    },
                    onStateChange: onPlayerStateChange,
                    onError: (event: any) => {
                        console.error('YouTube player error:', event.data);
                    },
                },
            });
            setPlayerInitialized(true);
        } catch (error) {
            console.error('Failed to initialize YouTube player:', error);
        }
    }, [apiLoaded, playerInitialized, currentResource, playerRef, onPlayerReady, onPlayerStateChange]);

    // Load NEW video when current resource changes (after player is initialized)
    useEffect(() => {
        if (!currentResource || !playerRef.current || !playerInitialized) return;

        const videoId = extractYouTubeId(currentResource.processedUrl);

        if (videoId && videoId !== lastLoadedVideoIdRef.current) {
            console.log('Loading new video:', videoId);
            try {
                if (playerRef.current.loadVideoById) {
                    playerRef.current.loadVideoById(videoId);
                    lastLoadedVideoIdRef.current = videoId;
                }
            } catch (error) {
                console.error('Failed to load video:', error);
            }
        }
    }, [currentResource, playerRef, playerInitialized]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }

            switch (e.key.toLowerCase()) {
                case ' ':
                    e.preventDefault();
                    togglePlay();
                    break;
                case 'arrowleft':
                    e.preventDefault();
                    seekTo(Math.max(0, currentTime - 5));
                    break;
                case 'arrowright':
                    e.preventDefault();
                    seekTo(Math.min(duration, currentTime + 5));
                    break;
                case 'm':
                    e.preventDefault();
                    handleMuteToggle();
                    break;
                case 'f':
                    e.preventDefault();
                    handleFullscreen();
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [currentTime, duration, togglePlay, seekTo]);

    // Volume control
    const handleVolumeChange = (newVolume: number) => {
        setVolume(newVolume);
        setIsMuted(newVolume === 0);
        if (playerRef.current && playerRef.current.setVolume) {
            playerRef.current.setVolume(newVolume);
        }
    };

    const handleMuteToggle = () => {
        const newMutedState = !isMuted;
        setIsMuted(newMutedState);
        if (playerRef.current) {
            if (newMutedState) {
                playerRef.current.mute();
            } else {
                playerRef.current.unMute();
            }
        }
    };

    // Playback speed
    const handlePlaybackRateChange = (rate: number) => {
        setPlaybackRate(rate);
        setShowSpeedMenu(false);
        if (playerRef.current && playerRef.current.setPlaybackRate) {
            playerRef.current.setPlaybackRate(rate);
        }
    };

    // Fullscreen
    const handleFullscreen = () => {
        const playerElement = document.getElementById('global-youtube-player');
        if (playerElement) {
            if (document.fullscreenElement) {
                document.exitFullscreen();
            } else {
                playerElement.requestFullscreen();
            }
        }
    };

    // Format time helper
    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const showMiniPlayer = currentResource && !isPlayerPage;
    const playbackRates = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

    // Container is always visible now (but can be positioned off-screen if no resource)
    // The key fix: ALWAYS render the container in a valid spot so YouTube can mount
    let containerStyle: React.CSSProperties = {
        position: 'fixed',
        zIndex: 100,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden',
    };

    if (playerSlotRect && isPlayerPage && currentResource) {
        // Match the slot position exactly on player page
        containerStyle = {
            ...containerStyle,
            top: playerSlotRect.top,
            left: playerSlotRect.left,
            width: playerSlotRect.width,
            height: playerSlotRect.height,
            borderRadius: '1rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            opacity: 1,
            visibility: 'visible',
            pointerEvents: 'auto',
        };
    } else if (showMiniPlayer) {
        // Mini player position - above bottom nav on mobile
        containerStyle = {
            ...containerStyle,
            bottom: '8rem', // Higher to clear bottom nav
            left: '1rem',
            width: '240px',
            height: '135px',
            borderRadius: '0.75rem',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
            opacity: 1,
            visibility: 'visible',
            pointerEvents: 'auto',
        };
    } else if (currentResource) {
        // Resource exists but not on player page yet - keep player ready but hidden
        containerStyle = {
            ...containerStyle,
            bottom: '5.5rem',
            left: '1.5rem',
            width: '280px',
            height: '158px',
            opacity: 0,
            visibility: 'hidden',
            pointerEvents: 'none',
        };
    } else {
        // No resource - truly hidden
        containerStyle = {
            ...containerStyle,
            bottom: '5.5rem',
            left: '1.5rem',
            width: '280px',
            height: '158px',
            opacity: 0,
            visibility: 'hidden',
            pointerEvents: 'none',
        };
    }

    return (
        <>
            {/* The Player Container - Always rendered for YouTube API stability */}
            <div style={containerStyle} className="bg-black border border-white/10 group">
                <div id="global-youtube-player" className="w-full h-full"></div>
                {showMiniPlayer && (
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                        <button onClick={togglePlay} className="p-3 bg-purple-600 rounded-full text-white">
                            {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
                        </button>
                        <button onClick={() => navigate('/player')} className="p-2 bg-white/10 rounded-full text-white">
                            <Maximize2 size={16} />
                        </button>
                    </div>
                )}
            </div>

            {/* Mini-Player Control Bar */}
            {showMiniPlayer && (
                <div className="fixed bottom-20 left-0 right-0 z-40 bg-slate-900/98 backdrop-blur-xl border-t border-white/10 shadow-2xl">
                    <input
                        type="range" min="0" max={duration || 100} value={currentTime}
                        onChange={(e) => seekTo(parseFloat(e.target.value))}
                        className="w-full h-1 bg-slate-700 appearance-none cursor-pointer range-slider"
                        style={{
                            background: `linear-gradient(to right, #a855f7 0%, #a855f7 ${(currentTime / (duration || 1)) * 100}%, #334155 ${(currentTime / (duration || 1)) * 100}%, #334155 100%)`
                        }}
                    />

                    <div className="flex items-center justify-between px-4 py-3 gap-4">
                        <div className="flex items-center gap-3 flex-1 min-w-0 ml-[300px]">
                            <div className="flex-1 min-w-0">
                                <h4 className="text-white font-medium text-sm truncate">{currentResource.title}</h4>
                                <p className="text-slate-400 text-xs truncate">
                                    {currentResource.sourceType.toUpperCase()} · {formatTime(currentTime)} / {formatTime(duration)}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setIsShuffle(!isShuffle)}
                                className={`p-2 rounded transition-colors ${isShuffle ? 'text-purple-400 bg-purple-400/10' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                                title="Shuffle"
                            >
                                <Shuffle size={18} />
                            </button>
                            <button onClick={playPrev} className="p-2 text-slate-300 hover:text-white rounded transition-colors" title="Previous">
                                <SkipBack size={20} />
                            </button>
                            <button onClick={togglePlay} className="p-3 bg-purple-600 hover:bg-purple-500 rounded-full text-white transition-colors mx-1" title={isPlaying ? 'Pause' : 'Play'}>
                                {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
                            </button>
                            <button onClick={playNext} className="p-2 text-slate-300 hover:text-white rounded transition-colors" title="Next">
                                <SkipForward size={20} />
                            </button>
                            <button
                                onClick={() => setIsRepeat(!isRepeat)}
                                className={`p-2 rounded transition-colors ${isRepeat ? 'text-purple-400 bg-purple-400/10' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                                title="Repeat"
                            >
                                <Repeat size={18} />
                            </button>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <button
                                    onClick={() => setShowQueuePanel(!showQueuePanel)}
                                    className={`flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors ${showQueuePanel ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                                    title="Queue"
                                >
                                    <List size={18} />
                                    <span className="hidden sm:inline">{queue.length}</span>
                                </button>
                            </div>

                            <div className="relative" onMouseEnter={() => setShowVolumeSlider(true)} onMouseLeave={() => setShowVolumeSlider(false)}>
                                <button onClick={handleMuteToggle} className="p-2 text-slate-300 hover:text-white rounded transition-colors">
                                    {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                                </button>
                                {showVolumeSlider && (
                                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-800 p-3 rounded-lg shadow-xl border border-white/10">
                                        <input
                                            type="range" min="0" max="100" value={volume}
                                            onChange={(e) => handleVolumeChange(parseInt(e.target.value))}
                                            className="w-24 h-1 bg-slate-600 appearance-none cursor-pointer range-slider"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="relative">
                                <button onClick={() => setShowSpeedMenu(!showSpeedMenu)} className="p-2 text-slate-300 hover:text-white rounded transition-colors flex items-center gap-1">
                                    <Settings size={18} />
                                    <span className="text-xs hidden sm:inline">{playbackRate}x</span>
                                </button>
                                {showSpeedMenu && (
                                    <div className="absolute bottom-full mb-2 right-0 bg-slate-800 rounded-lg shadow-xl border border-white/10 py-2 min-w-[100px]">
                                        {playbackRates.map((rate) => (
                                            <button key={rate} onClick={() => handlePlaybackRateChange(rate)} className={`w-full px-4 py-2 text-sm text-left transition-colors ${playbackRate === rate ? 'bg-purple-600 text-white' : 'text-slate-300 hover:bg-white/5'}`}>
                                                {rate}x
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <button onClick={stopPlayback} className="p-2 text-slate-300 hover:text-red-400 rounded transition-colors ml-2" title="Stop">
                                <X size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`.range-slider::-webkit-slider-thumb { appearance: none; width: 12px; height: 12px; border-radius: 50%; background: #a855f7; cursor: pointer; } .range-slider::-moz-range-thumb { width: 12px; height: 12px; border-radius: 50%; background: #a855f7; cursor: pointer; border: none; }`}</style>
        </>
    );
};

export default GlobalPlayer;
