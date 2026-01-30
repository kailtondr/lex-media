import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePlayer } from '../contexts/PlayerContext';
import { resourceService } from '../services/resourceService';
import {
    ArrowLeft, Loader2, Play, Pause, SkipForward, SkipBack,
    Repeat, Shuffle, Clock, ExternalLink, Plus, X, Tag as TagIcon, ChevronDown, ChevronUp, List
} from 'lucide-react';
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
        setPlayerSlotRect,
    } = usePlayer();

    const slotRef = useRef<HTMLDivElement>(null);
    const [loading, setLoading] = useState(false);
    const [editingTags, setEditingTags] = useState(false);
    const [newTag, setNewTag] = useState('');
    const [tags, setTags] = useState<string[]>([]);
    const [showMobileQueue, setShowMobileQueue] = useState(false);

    // Update the slot position for GlobalPlayer
    useEffect(() => {
        const updateRect = () => {
            if (slotRef.current) {
                setPlayerSlotRect(slotRef.current.getBoundingClientRect());
            }
        };

        updateRect();

        const observer = new ResizeObserver(updateRect);
        if (slotRef.current) observer.observe(slotRef.current);

        window.addEventListener('resize', updateRect);
        window.addEventListener('scroll', updateRect, true);

        return () => {
            setPlayerSlotRect(null);
            observer.disconnect();
            window.removeEventListener('resize', updateRect);
            window.removeEventListener('scroll', updateRect, true);
        };
    }, [setPlayerSlotRect]);

    // If accessed via /resource/:id, load that resource and play it
    useEffect(() => {
        if (!id || !currentUser) return;

        const loadResource = async () => {
            setLoading(true);
            try {
                const res = await resourceService.getResource(currentUser.uid, id);
                if (res) {
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
    }, [id, currentUser, playResource, navigate, currentResource]);

    // Update tags when currentResource changes
    useEffect(() => {
        if (currentResource) {
            setTags(currentResource.tags || []);
        }
    }, [currentResource?.id]);

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleAddTag = async () => {
        if (!newTag.trim() || !currentUser || !currentResource) return;

        const trimmedTag = newTag.trim();
        if (tags.includes(trimmedTag)) {
            setNewTag('');
            return;
        }

        const updatedTags = [...tags, trimmedTag];
        setTags(updatedTags);
        setNewTag('');

        try {
            await resourceService.updateResource(currentUser.uid, currentResource.id, {
                tags: updatedTags
            });
        } catch (error) {
            console.error('Failed to update tags:', error);
        }
    };

    const handleRemoveTag = async (tagToRemove: string) => {
        if (!currentUser || !currentResource) return;

        const updatedTags = tags.filter(tag => tag !== tagToRemove);
        setTags(updatedTags);

        try {
            await resourceService.updateResource(currentUser.uid, currentResource.id, {
                tags: updatedTags
            });
        } catch (error) {
            console.error('Failed to update tags:', error);
        }
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
            <div className="flex flex-col items-center justify-center h-full text-slate-400 p-4">
                <p className="text-lg mb-4 text-center">No video playing</p>
                <button
                    onClick={() => navigate('/media')}
                    className="text-purple-400 hover:text-purple-300 px-6 py-3 bg-purple-600/10 rounded-xl"
                >
                    Go to Media Hub
                </button>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col xl:flex-row gap-0 xl:gap-6 overflow-hidden">
            {/* Main Content Area (Video + Metadata + Notes) */}
            <div className="flex-1 flex flex-col overflow-y-auto pb-24 xl:pb-8">
                {/* Back Button - Desktop only */}
                <div className="hidden md:flex items-center mb-4">
                    <button
                        onClick={() => navigate('/media')}
                        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft size={20} />
                        {t('player.back')}
                    </button>
                </div>

                {/* Video Player Slot */}
                <div
                    className="bg-black rounded-none xl:rounded-2xl overflow-hidden mb-3 xl:mb-4 border-0 xl:border xl:border-white/10 shadow-2xl"
                    style={{ aspectRatio: '16/9' }}
                >
                    <div ref={slotRef} className="w-full h-full">
                        {/* GlobalPlayer overlays here */}
                    </div>
                </div>

                {/* Video Title & Playback Controls */}
                <div className="px-4 xl:px-0">
                    <h1 className="text-xl xl:text-2xl font-bold text-white mb-3">{currentResource.title}</h1>

                    {/* Action Bar - YouTube style */}
                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/5">
                        <div className="flex items-center gap-2 text-sm text-slate-400">
                            <Clock size={16} />
                            <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setIsShuffle(!isShuffle)}
                                className={`p-2.5 rounded-lg transition-colors ${isShuffle ? 'text-purple-400 bg-purple-400/10' : 'text-slate-400 hover:bg-white/5'}`}
                                title="Shuffle"
                            >
                                <Shuffle size={18} />
                            </button>
                            <button
                                onClick={playPrev}
                                className="p-2.5 text-slate-300 hover:bg-white/5 rounded-lg transition-colors"
                                title="Previous"
                            >
                                <SkipBack size={20} />
                            </button>
                            <button
                                onClick={togglePlay}
                                className="p-3 bg-purple-600 hover:bg-purple-500 rounded-full text-white transition-colors shadow-lg shadow-purple-900/30"
                                title={isPlaying ? 'Pause' : 'Play'}
                            >
                                {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
                            </button>
                            <button
                                onClick={playNext}
                                className="p-2.5 text-slate-300 hover:bg-white/5 rounded-lg transition-colors"
                                title="Next"
                            >
                                <SkipForward size={20} />
                            </button>
                            <button
                                onClick={() => setIsRepeat(!isRepeat)}
                                className={`p-2.5 rounded-lg transition-colors ${isRepeat ? 'text-purple-400 bg-purple-400/10' : 'text-slate-400 hover:bg-white/5'}`}
                                title="Repeat"
                            >
                                <Repeat size={18} />
                            </button>
                            {/* Mobile Queue Toggle */}
                            <button
                                onClick={() => setShowMobileQueue(!showMobileQueue)}
                                className="xl:hidden p-2.5 text-slate-400 hover:bg-white/5 rounded-lg transition-colors"
                                title="Queue"
                            >
                                <List size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Tags Section */}
                    <div className="mb-6">
                        <div className="flex items-center gap-2 mb-3">
                            <TagIcon size={16} className="text-purple-400" />
                            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Tags</h3>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {tags.map((tag, index) => (
                                <span
                                    key={index}
                                    className="inline-flex items-center gap-1.5 bg-purple-600/20 text-purple-300 px-3 py-1.5 rounded-full text-sm border border-purple-500/30 hover:bg-purple-600/30 transition-colors group"
                                >
                                    #{tag}
                                    <button
                                        onClick={() => handleRemoveTag(tag)}
                                        className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all"
                                    >
                                        <X size={14} />
                                    </button>
                                </span>
                            ))}
                            {editingTags ? (
                                <input
                                    type="text"
                                    value={newTag}
                                    onChange={(e) => setNewTag(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleAddTag();
                                        else if (e.key === 'Escape') { setEditingTags(false); setNewTag(''); }
                                    }}
                                    onBlur={() => { setEditingTags(false); setNewTag(''); }}
                                    placeholder="New tag"
                                    className="bg-slate-800/50 border border-purple-500/30 rounded-full px-3 py-1.5 text-sm w-32 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                                    autoFocus
                                />
                            ) : (
                                <button
                                    onClick={() => setEditingTags(true)}
                                    className="text-purple-400 hover:text-purple-300 text-sm flex items-center gap-1 px-3 py-1.5 bg-purple-600/10 hover:bg-purple-600/20 rounded-full transition-colors"
                                >
                                    <Plus size={16} /> Add Tag
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Source Link */}
                    <div className="mb-6">
                        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-2">Source</h3>
                        <a
                            href={currentResource.originalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors text-sm group"
                        >
                            <span className="truncate">{currentResource.originalUrl}</span>
                            <ExternalLink size={14} className="flex-shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </a>
                    </div>

                    {/* Notes Section - Integrated below metadata */}
                    <div className="border-t border-white/5 pt-6">
                        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-4">Notes</h3>
                        <div className="bg-slate-900/30 rounded-xl border border-white/5 overflow-hidden" style={{ minHeight: '400px' }}>
                            <NoteEditor resourceId={currentResource.id} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Sidebar - Queue/Playlist (Desktop) */}
            <aside className="hidden xl:flex xl:flex-col w-[380px] bg-slate-900/30 rounded-xl border border-white/5 overflow-hidden flex-shrink-0">
                <div className="p-4 border-b border-white/5 bg-slate-900/50">
                    <div className="flex items-center gap-2">
                        <List size={18} className="text-purple-400" />
                        <h3 className="text-white font-semibold">Queue</h3>
                        <span className="text-xs text-slate-500 ml-auto">{queue.length} videos</span>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {queue.map((resource, index) => {
                        const isCurrentVideo = resource.id === currentResource.id;
                        return (
                            <button
                                key={resource.id}
                                onClick={() => playResource(resource, queue)}
                                className={`w-full text-left p-3 rounded-lg flex items-start gap-3 transition-all ${isCurrentVideo
                                        ? 'bg-purple-600/20 border border-purple-500/30 shadow-sm'
                                        : 'hover:bg-white/5 active:bg-white/10'
                                    }`}
                            >
                                <div className="relative flex-shrink-0">
                                    {resource.thumbnail && (
                                        <img
                                            src={resource.thumbnail}
                                            alt=""
                                            className="w-28 h-16 object-cover rounded"
                                        />
                                    )}
                                    {isCurrentVideo && (
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded">
                                            <Play size={20} className="text-white" fill="currentColor" />
                                        </div>
                                    )}
                                    <span className="absolute top-1 left-1 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">
                                        {index + 1}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className={`text-sm font-medium line-clamp-2 mb-1 ${isCurrentVideo ? 'text-white' : 'text-slate-300'
                                        }`}>
                                        {resource.title}
                                    </div>
                                    <div className="text-xs text-slate-500">
                                        {resource.sourceType.toUpperCase()}
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </aside>

            {/* Mobile Queue Modal */}
            {showMobileQueue && (
                <div className="xl:hidden fixed inset-0 z-50 flex items-end">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setShowMobileQueue(false)}
                    />
                    <div className="relative bg-slate-900 border-t border-white/10 rounded-t-2xl w-full max-h-[70vh] flex flex-col">
                        <div className="p-4 border-b border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <List size={20} className="text-purple-400" />
                                <h3 className="text-white font-semibold">Queue ({queue.length})</h3>
                            </div>
                            <button onClick={() => setShowMobileQueue(false)} className="p-2 text-slate-400 hover:text-white">
                                <ChevronDown size={24} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-3 space-y-2">
                            {queue.map((resource, index) => {
                                const isCurrentVideo = resource.id === currentResource.id;
                                return (
                                    <button
                                        key={resource.id}
                                        onClick={() => {
                                            playResource(resource, queue);
                                            setShowMobileQueue(false);
                                        }}
                                        className={`w-full text-left p-3 rounded-lg flex items-center gap-3 ${isCurrentVideo
                                                ? 'bg-purple-600/20 border border-purple-500/30'
                                                : 'active:bg-white/10'
                                            }`}
                                    >
                                        <span className="text-slate-500 text-sm w-6">{index + 1}</span>
                                        {resource.thumbnail && (
                                            <img src={resource.thumbnail} alt="" className="w-20 h-12 object-cover rounded" />
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <div className={`text-sm font-medium truncate ${isCurrentVideo ? 'text-white' : 'text-slate-300'
                                                }`}>
                                                {resource.title}
                                            </div>
                                        </div>
                                        {isCurrentVideo && <Play size={16} className="text-purple-400" fill="currentColor" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PlayerPage;
