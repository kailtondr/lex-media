import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePlayer } from '../contexts/PlayerContext';
import { resourceService } from '../services/resourceService';
import type { Resource } from '../types';
import { ArrowLeft, Loader2, Play, Pause, SkipForward, SkipBack, Repeat, Shuffle, Clock } from 'lucide-react';
import NoteEditor from '../components/NoteEditor';
import { useTranslation } from 'react-i18next';

const PlayerPage: React.FC = () => {
    const { t } = useTranslation();
    const { id } = useParams<{ id?: string }>();
    const { currentUser } = useAuth();
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
        setIsRepeat,
        setIsShuffle,
        playResource,
    } = usePlayer();

    const [loading, setLoading] = useState(false);

    // If accessed via /resource/:id, load that resource and play it
    useEffect(() => {
        if (!id || !currentUser) return;

        const loadResource = async () => {
            setLoading(true);
            try {
                const res = await resourceService.getResource(currentUser.uid, id);
                if (res) {
                    // Play this resource (will add to queue if not already playing)
                    if (!currentResource || currentResource.id !== res.id) {
                        playResource(res, [res]);
                    }
                } else {
                    navigate('/media');
                }
            } catch (error) {
                console.error('Failed to load resource', error);
            } finally {
                setLoading(false);
            }
        };

        loadResource();
    }, [id, currentUser]); // Intentionally minimal deps

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="animate-spin text-purple-600" size={48} />
            </div>
        );
    }

    if (!currentResource) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <p className="text-lg mb-4">No video playing</p>
                <button
                    onClick={() => navigate('/media')}
                    className="text-purple-400 hover:text-purple-300"
                >
                    Go to Media Hub
                </button>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="mb-4">
                <button
                    onClick={() => navigate('/media')}
                    className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-3"
                >
                    <ArrowLeft size={20} />
                    {t('player.back')}
                </button>
                <h1 className="text-2xl font-bold text-white">{currentResource.title}</h1>

                {/* Tags */}
                {currentResource.tags && currentResource.tags.length > 0 && (
                    <div className="flex gap-2 mt-2 flex-wrap">
                        {currentResource.tags.map((tag, i) => (
                            <span key={i} className="text-xs bg-purple-600/20 text-purple-300 px-2 py-1 rounded border border-purple-500/30">
                                #{tag}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* Main Content: Video (top, handled by GlobalPlayer) + Controls + Queue/Notes (bottom) */}
            <div className="flex-1 flex flex-col gap-6 overflow-hidden">
                {/* Video Placeholder (actual player rendered by GlobalPlayer component) */}
                <div className="h-[60vh] bg-black rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/50">
                    <div id="player-container" className="w-full h-full flex items-center justify-center text-white">
                        {/* YouTube player is rendered here by GlobalPlayer */}
                        <div className="text-slate-500 text-sm">
                            Video player displayed above
                        </div>
                    </div>
                </div>

                {/* Playback Controls */}
                <div className="bg-slate-900/50 rounded-xl border border-white/5 p-4">
                    <div className="flex items-center justify-between">
                        {/* Time */}
                        <div className="flex items-center gap-2 text-sm text-slate-400">
                            <Clock size={14} />
                            <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
                        </div>

                        {/* Control Buttons */}
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setIsShuffle(!isShuffle)}
                                className={`p-2 rounded transition-colors ${isShuffle ? 'text-purple-400 bg-purple-400/10' : 'text-slate-400 hover:text-white'
                                    }`}
                                title="Shuffle"
                            >
                                <Shuffle size={18} />
                            </button>

                            <button
                                onClick={playPrev}
                                className="p-2 text-slate-300 hover:text-white transition-colors"
                                title="Previous"
                            >
                                <SkipBack size={20} />
                            </button>

                            <button
                                onClick={togglePlay}
                                className="p-4 bg-purple-600 hover:bg-purple-500 rounded-full text-white transition-colors"
                                title={isPlaying ? 'Pause' : 'Play'}
                            >
                                {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
                            </button>

                            <button
                                onClick={playNext}
                                className="p-2 text-slate-300 hover:text-white transition-colors"
                                title="Next"
                            >
                                <SkipForward size={20} />
                            </button>

                            <button
                                onClick={() => setIsRepeat(!isRepeat)}
                                className={`p-2 rounded transition-colors ${isRepeat ? 'text-purple-400 bg-purple-400/10' : 'text-slate-400 hover:text-white'
                                    }`}
                                title="Repeat"
                            >
                                <Repeat size={18} />
                            </button>
                        </div>

                        {/* Queue info */}
                        <div className="text-sm text-slate-400">
                            {queue.findIndex(r => r.id === currentResource.id) + 1} / {queue.length} in queue
                        </div>
                    </div>
                </div>

                {/* Bottom Section: Queue List (left) + Notes Editor (right) */}
                <div className="flex-1 flex gap-6 overflow-hidden min-h-0">
                    {/* Queue List */}
                    <div className="flex-1 bg-slate-900/30 rounded-xl border border-white/5 overflow-hidden flex flex-col">
                        <div className="p-4 border-b border-white/5">
                            <h3 className="text-white font-semibold">Queue ({queue.length})</h3>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {queue.map((resource, index) => (
                                <button
                                    key={resource.id}
                                    onClick={() => playResource(resource, queue)}
                                    className={`w-full text-left p-3 rounded-lg transition-colors flex items-center gap-3 ${resource.id === currentResource.id
                                            ? 'bg-purple-600/20 border border-purple-500/30'
                                            : 'bg-slate-800/30 hover:bg-slate-800/50 border border-transparent'
                                        }`}
                                >
                                    <div className="text-slate-500 text-xs font-bold w-6">
                                        {index + 1}
                                    </div>
                                    {resource.thumbnail && (
                                        <img src={resource.thumbnail} alt="" className="w-12 h-12 object-cover rounded" />
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className={`text-sm font-medium truncate ${resource.id === currentResource.id ? 'text-white' : 'text-slate-300'
                                            }`}>
                                            {resource.title}
                                        </div>
                                        <div className="text-xs text-slate-500 truncate">
                                            {Math.round(resource.progress.playedSeconds / 60)}m / {Math.round(resource.progress.totalSeconds / 60)}m
                                        </div>
                                    </div>
                                    {resource.id === currentResource.id && (
                                        <div className="text-purple-400">
                                            <Play size={16} fill="currentColor" />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Notes Editor */}
                    <div className="flex-1 bg-slate-900/30 rounded-xl border border-white/5 overflow-hidden">
                        <NoteEditor resourceId={currentResource.id} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlayerPage;
