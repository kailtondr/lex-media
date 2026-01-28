import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Play, Pause, SkipForward, SkipBack, X } from 'lucide-react';
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
        currentTime,
        duration,
        togglePlay,
        playNext,
        playPrev,
        stopPlayback,
        seekTo,
        playerRef,
        onPlayerReady,
        onPlayerStateChange,
    } = usePlayer();

    const [apiLoaded, setApiLoaded] = useState(false);
    const lastLoadedVideoIdRef = useRef<string | null>(null);
    const isPlayerPage = location.pathname === '/player';

    // Load YouTube IFrame API
    useEffect(() => {
        if (!window.YT) {
            const tag = document.createElement('script');
            tag.src = 'https://www.youtube.com/iframe_api';
            document.head.appendChild(tag);
        } else {
            setApiLoaded(true);
        }

        window.onYouTubeIframeAPIReady = () => {
            setApiLoaded(true);
        };
    }, []);

    // Initialize YouTube Player once API is loaded
    useEffect(() => {
        if (!apiLoaded || playerRef.current) return;

        try {
            playerRef.current = new window.YT.Player('global-youtube-player', {
                height: '100%',
                width: '100%',
                playerVars: {
                    playsinline: 1,
                    autoplay: 1,
                    rel: 0,
                    controls: 1,
                    modestbranding: 1,
                },
                events: {
                    onReady: onPlayerReady,
                    onStateChange: onPlayerStateChange,
                },
            });
        } catch (error) {
            console.error('Failed to initialize YouTube player:', error);
        }
    }, [apiLoaded, playerRef, onPlayerReady, onPlayerStateChange]);

    // Load video when current resource changes
    useEffect(() => {
        if (!currentResource || !playerRef.current) return;

        const videoId = extractYouTubeId(currentResource.processedUrl);

        if (videoId && videoId !== lastLoadedVideoIdRef.current) {
            try {
                playerRef.current.loadVideoById(videoId);
                lastLoadedVideoIdRef.current = videoId;
            } catch (error) {
                console.error('Failed to load video:', error);
            }
        }
    }, [currentResource, playerRef]);

    // Format time helper
    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const showMiniPlayer = currentResource && !isPlayerPage;

    return (
        <>
            {/* Full-Screen Player (only visible on /player page) */}
            <div
                className={`fixed top-0 left-0 w-full transition-opacity duration-300 ${isPlayerPage ? 'opacity-100 z-30' : 'opacity-0 pointer-events-none -z-10'
                    }`}
                style={{ height: isPlayerPage ? '60vh' : '0' }}
            >
                <div id="global-youtube-player" className="w-full h-full bg-black"></div>
            </div>

            {/* Mini-Player (visible on all other pages when playing) */}
            {showMiniPlayer && (
                <div className="fixed bottom-20 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-white/10 shadow-2xl">
                    {/* Progress Bar */}
                    <input
                        type="range"
                        min="0"
                        max={duration || 100}
                        value={currentTime}
                        onChange={(e) => seekTo(parseFloat(e.target.value))}
                        className="w-full h-1 bg-slate-700 appearance-none cursor-pointer range-slider"
                        style={{
                            background: `linear-gradient(to right, #a855f7 0%, #a855f7 ${(currentTime / duration) * 100}%, #334155 ${(currentTime / duration) * 100}%, #334155 100%)`
                        }}
                    />

                    {/* Controls */}
                    <div className="flex items-center justify-between px-4 py-3">
                        {/* Video Info (clickable to open full player) */}
                        <button
                            onClick={() => navigate('/player')}
                            className="flex items-center gap-3 flex-1 min-w-0 text-left hover:opacity-80 transition-opacity"
                        >
                            {currentResource.thumbnail && (
                                <img
                                    src={currentResource.thumbnail}
                                    alt={currentResource.title}
                                    className="w-12 h-12 object-cover rounded"
                                />
                            )}
                            <div className="flex-1 min-w-0">
                                <h4 className="text-white font-medium text-sm truncate">
                                    {currentResource.title}
                                </h4>
                                <p className="text-slate-400 text-xs truncate">
                                    {currentResource.sourceType.toUpperCase()} · {formatTime(currentTime)} / {formatTime(duration)}
                                </p>
                            </div>
                        </button>

                        {/* Playback Controls */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={playPrev}
                                className="p-2 text-slate-300 hover:text-white transition-colors"
                                title="Previous"
                            >
                                <SkipBack size={20} />
                            </button>

                            <button
                                onClick={togglePlay}
                                className="p-3 bg-purple-600 hover:bg-purple-500 rounded-full text-white transition-colors"
                                title={isPlaying ? 'Pause' : 'Play'}
                            >
                                {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
                            </button>

                            <button
                                onClick={playNext}
                                className="p-2 text-slate-300 hover:text-white transition-colors"
                                title="Next"
                            >
                                <SkipForward size={20} />
                            </button>

                            <button
                                onClick={stopPlayback}
                                className="p-2 text-slate-300 hover:text-red-400 transition-colors ml-2"
                                title="Stop"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* CSS for range slider */}
            <style>{`
                .range-slider::-webkit-slider-thumb {
                    appearance: none;
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                    background: #a855f7;
                    cursor: pointer;
                }
                
                .range-slider::-moz-range-thumb {
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                    background: #a855f7;
                    cursor: pointer;
                    border: none;
                }
            `}</style>
        </>
    );
};

export default GlobalPlayer;
