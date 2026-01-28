import React, { createContext, useContext, useState, useEffect, useRef, useCallback, type ReactNode } from 'react';
import type { Resource } from '../types';
import { resourceService } from '../services/resourceService';

interface PlayerContextType {
    // State
    currentResource: Resource | null;
    isPlaying: boolean;
    isRepeat: boolean;
    isShuffle: boolean;
    queue: Resource[];
    currentTime: number;
    duration: number;

    // Actions
    playResource: (resource: Resource, newQueue?: Resource[]) => void;
    togglePlay: () => void;
    playNext: () => void;
    playPrev: () => void;
    setQueue: (queue: Resource[]) => void;
    setIsRepeat: (repeat: boolean) => void;
    setIsShuffle: (shuffle: boolean) => void;
    stopPlayback: () => void;
    seekTo: (seconds: number) => void;

    // YouTube Player Reference
    playerRef: React.MutableRefObject<any>;
    onPlayerReady: (event: any) => void;
    onPlayerStateChange: (event: any) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

// localStorage keys
const STORAGE_KEYS = {
    CURRENT: 'lex_player_current',
    QUEUE: 'lex_player_queue',
    REPEAT: 'lex_player_repeat',
    SHUFFLE: 'lex_player_shuffle',
};

export const PlayerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // State
    const [currentResource, setCurrentResource] = useState<Resource | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isRepeat, setIsRepeat] = useState(false);
    const [isShuffle, setIsShuffle] = useState(false);
    const [queue, setQueue] = useState<Resource[]>([]);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    // Refs for callbacks (avoid closure issues)
    const currentResourceRef = useRef<Resource | null>(null);
    const isRepeatRef = useRef(false);
    const isShuffleRef = useRef(false);
    const queueRef = useRef<Resource[]>([]);
    const playerRef = useRef<any>(null);

    // Sync state with refs
    useEffect(() => { currentResourceRef.current = currentResource; }, [currentResource]);
    useEffect(() => { isRepeatRef.current = isRepeat; }, [isRepeat]);
    useEffect(() => { isShuffleRef.current = isShuffle; }, [isShuffle]);
    useEffect(() => { queueRef.current = queue; }, [queue]);

    // Restore state from localStorage on mount
    useEffect(() => {
        try {
            const savedResource = localStorage.getItem(STORAGE_KEYS.CURRENT);
            if (savedResource) setCurrentResource(JSON.parse(savedResource));

            const savedQueue = localStorage.getItem(STORAGE_KEYS.QUEUE);
            if (savedQueue) setQueue(JSON.parse(savedQueue));

            const savedRepeat = localStorage.getItem(STORAGE_KEYS.REPEAT);
            if (savedRepeat) setIsRepeat(savedRepeat === 'true');

            const savedShuffle = localStorage.getItem(STORAGE_KEYS.SHUFFLE);
            if (savedShuffle) setIsShuffle(savedShuffle === 'true');
        } catch (error) {
            console.error('Failed to restore player state:', error);
        }
    }, []);

    // Save state to localStorage
    useEffect(() => {
        if (currentResource) {
            localStorage.setItem(STORAGE_KEYS.CURRENT, JSON.stringify(currentResource));
        }
    }, [currentResource]);

    useEffect(() => {
        if (queue.length > 0) {
            localStorage.setItem(STORAGE_KEYS.QUEUE, JSON.stringify(queue));
        }
    }, [queue]);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEYS.REPEAT, String(isRepeat));
    }, [isRepeat]);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEYS.SHUFFLE, String(isShuffle));
    }, [isShuffle]);

    // Track playback time
    useEffect(() => {
        if (!isPlaying || !playerRef.current) return;

        const interval = setInterval(() => {
            try {
                const time = playerRef.current.getCurrentTime();
                const dur = playerRef.current.getDuration();
                if (time !== undefined) setCurrentTime(time);
                if (dur !== undefined) setDuration(dur);
            } catch (error) {
                // Player not ready yet
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [isPlaying]);

    // Save progress to Firestore periodically
    useEffect(() => {
        if (!currentResource || !isPlaying) return;

        const saveInterval = setInterval(async () => {
            try {
                const time = playerRef.current?.getCurrentTime();
                const dur = playerRef.current?.getDuration();

                if (time !== undefined && dur !== undefined && currentResource.userId) {
                    await resourceService.updateProgress(
                        currentResource.userId,
                        currentResource.id,
                        time,
                        dur
                    );
                }
            } catch (error) {
                console.error('Failed to save progress:', error);
            }
        }, 10000); // Save every 10 seconds

        return () => clearInterval(saveInterval);
    }, [currentResource, isPlaying]);

    // Play next video
    const playNext = useCallback(() => {
        const current = currentResourceRef.current;
        const list = queueRef.current;

        if (!current || list.length === 0) return;

        if (isShuffleRef.current) {
            // Random next (avoid replaying current)
            let nextIdx;
            do {
                nextIdx = Math.floor(Math.random() * list.length);
            } while (list.length > 1 && list[nextIdx].id === current.id);

            setCurrentResource(list[nextIdx]);
        } else {
            // Sequential next
            const currentIndex = list.findIndex(r => r.id === current.id);

            if (currentIndex !== -1 && currentIndex < list.length - 1) {
                setCurrentResource(list[currentIndex + 1]);
            } else if (isRepeatRef.current && list.length > 0) {
                setCurrentResource(list[0]); // Loop back
            } else {
                setIsPlaying(false); // End of queue
            }
        }
    }, []);

    // Play previous video
    const playPrev = useCallback(() => {
        const current = currentResourceRef.current;
        const list = queueRef.current;

        if (!current || list.length === 0) return;

        const currentIndex = list.findIndex(r => r.id === current.id);

        if (currentIndex > 0) {
            setCurrentResource(list[currentIndex - 1]);
        } else if (isRepeatRef.current) {
            setCurrentResource(list[list.length - 1]); // Wrap to end
        }
    }, []);

    // YouTube Player callbacks
    const onPlayerReady = useCallback((event: any) => {
        console.log('YouTube Player Ready');
        if (currentResourceRef.current) {
            // Resume from saved position
            const savedPosition = currentResourceRef.current.progress?.playedSeconds || 0;
            if (savedPosition > 0) {
                event.target.seekTo(savedPosition);
            }
        }
    }, []);

    const onPlayerStateChange = useCallback((event: any) => {
        const playerState = event.data;

        // YouTube Player States:
        // -1 = unstarted
        // 0 = ended
        // 1 = playing
        // 2 = paused
        // 3 = buffering
        // 5 = video cued

        if (playerState === 1) {
            setIsPlaying(true);
            try {
                const dur = event.target.getDuration();
                if (dur) setDuration(dur);
            } catch (e) {
                // Ignore
            }
        }

        if (playerState === 2) {
            setIsPlaying(false);
        }

        if (playerState === 0) {
            // Video ended - play next
            playNext();
        }
    }, [playNext]);

    // Actions
    const playResource = useCallback((resource: Resource, newQueue?: Resource[]) => {
        setCurrentResource(resource);
        setIsPlaying(true);

        if (newQueue) {
            setQueue(newQueue);
        } else if (queue.length === 0) {
            setQueue([resource]);
        }
    }, [queue]);

    const togglePlay = useCallback(() => {
        if (!playerRef.current) return;

        if (isPlaying) {
            playerRef.current.pauseVideo();
        } else {
            playerRef.current.playVideo();
        }
    }, [isPlaying]);

    const stopPlayback = useCallback(() => {
        setCurrentResource(null);
        setIsPlaying(false);
        setCurrentTime(0);
        if (playerRef.current) {
            playerRef.current.stopVideo();
        }
    }, []);

    const seekTo = useCallback((seconds: number) => {
        if (playerRef.current) {
            playerRef.current.seekTo(seconds);
            setCurrentTime(seconds);
        }
    }, []);

    const value: PlayerContextType = {
        currentResource,
        isPlaying,
        isRepeat,
        isShuffle,
        queue,
        currentTime,
        duration,
        playResource,
        togglePlay,
        playNext,
        playPrev,
        setQueue,
        setIsRepeat,
        setIsShuffle,
        stopPlayback,
        seekTo,
        playerRef,
        onPlayerReady,
        onPlayerStateChange,
    };

    return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
};

export const usePlayer = () => {
    const context = useContext(PlayerContext);
    if (!context) {
        throw new Error('usePlayer must be used within PlayerProvider');
    }
    return context;
};
