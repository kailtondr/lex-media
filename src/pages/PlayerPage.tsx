import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePlayer } from '../contexts/PlayerContext';
import { resourceService } from '../services/resourceService';
import type { Resource } from '../types';
import {
    ArrowLeft, Loader2, Play, Pause, SkipForward, SkipBack,
    Repeat, Shuffle, Clock, ExternalLink, Plus, X, Tag as TagIcon
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

    // Update the slot position for GlobalPlayer
    useEffect(() => {
        const updateRect = () => {
            if (slotRef.current) {
                setPlayerSlotRect(slotRef.current.getBoundingClientRect());
            }
        };

        updateRect();

        // Use ResizeObserver for responsive layout changes
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
        <div className="h-full flex overflow-hidden">
            {/* Left Side: Video + Metadata */}
            <div className="w-[55%] flex flex-col pr-6 overflow-y-auto">
                {/* Header */}
                <div className="mb-6">
                    <button
                        onClick={() => navigate('/media')}
                        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft size={20} />
                        {t('player.back')}
                    </button>
                </div>

                {/* Video Slot - Compact, Rounded */}
                <div className="bg-black/40 rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/30 mb-6"
                    style={{ aspectRatio: '16/9' }}>
                    <div ref={slotRef} className="w-full h-full">
                        {/* The GlobalPlayer will overlay itself here matching slotRef's position */}
                    </div>
                </div>

                {/* Video Title */}
                <h1 className="text-2xl font-bold text-white mb-6">{currentResource.title}</h1>

                {/* Playback Controls */}
                <div className="bg-slate-900/50 rounded-xl border border-white/5 p-4 mb-6">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 text-sm text-slate-400">
                            <Clock size={14} />
                            <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
                        </div>
                        <div className="text-sm text-slate-400">
                            {queue.findIndex(r => r.id === currentResource.id) + 1} / {queue.length}
                        </div>
                    </div>

                    <div className="flex items-center justify-center gap-4">
                        <button
                            onClick={() => setIsShuffle(!isShuffle)}
                            className={`p-2 rounded transition-colors ${isShuffle ? 'text-purple-400 bg-purple-400/10' : 'text-slate-400 hover:text-white'
                                }`}
                            title="Shuffle"
                        >
                            <Shuffle size={18} />
                        </button>

                        <button onClick={playPrev} className="p-2 text-slate-300 hover:text-white transition-colors" title="Previous">
                            <SkipBack size={22} />
                        </button>

                        <button onClick={togglePlay} className="p-4 bg-purple-600 hover:bg-purple-500 rounded-full text-white transition-colors shadow-lg shadow-purple-900/30" title={isPlaying ? 'Pause' : 'Play'}>
                            {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
                        </button>

                        <button onClick={playNext} className="p-2 text-slate-300 hover:text-white transition-colors" title="Next">
                            <SkipForward size={22} />
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
                </div>

                {/* Metadata Card */}
                <div className="bg-slate-900/30 rounded-xl border border-white/5 p-6 mb-6">
                    <h3 className="text-white font-semibold mb-4">Métadonnées de la source</h3>
                    <div className="mb-4">
                        <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Source Originale</p>
                        <a
                            href={currentResource.originalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors"
                        >
                            <span className="truncate">{currentResource.originalUrl}</span>
                            <ExternalLink size={14} className="flex-shrink-0" />
                        </a>
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">TAGS</p>
                        <div className="flex flex-wrap gap-2">
                            {tags.map((tag, index) => (
                                <span key={index} className="inline-flex items-center gap-1.5 bg-purple-600/20 text-purple-300 px-3 py-1.5 rounded-full text-sm border border-purple-500/30 group">
                                    #{tag}
                                    <button onClick={() => handleRemoveTag(tag)} className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all">
                                        <X size={14} />
                                    </button>
                                </span>
                            ))}
                            {editingTags ? (
                                <div className="inline-flex items-center gap-2">
                                    <input
                                        type="text" value={newTag} onChange={(e) => setNewTag(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleAddTag();
                                            else if (e.key === 'Escape') { setEditingTags(false); setNewTag(''); }
                                        }}
                                        placeholder="tag" className="bg-slate-800 border border-white/10 rounded-full px-3 py-1.5 text-sm w-24"
                                        autoFocus
                                    />
                                </div>
                            ) : (
                                <button onClick={() => setEditingTags(true)} className="text-purple-400 hover:text-purple-300 text-sm flex items-center gap-1">
                                    <Plus size={16} /> Add
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Queue */}
                <div className="bg-slate-900/30 rounded-xl border border-white/5 overflow-hidden flex-1 flex flex-col">
                    <div className="p-4 border-b border-white/5 flex items-center gap-2">
                        <TagIcon size={18} className="text-purple-400" />
                        <h3 className="text-white font-semibold">À suivre ({queue.length})</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {queue.map((resource, index) => (
                            <button
                                key={resource.id} onClick={() => playResource(resource, queue)}
                                className={`w-full text-left p-3 rounded-lg flex items-center gap-3 ${resource.id === currentResource.id ? 'bg-purple-600/20 border border-purple-500/30' : 'hover:bg-white/5'}`}
                            >
                                <span className="text-slate-500 text-xs w-6">{index + 1}</span>
                                {resource.thumbnail && <img src={resource.thumbnail} alt="" className="w-16 h-10 object-cover rounded" />}
                                <div className="flex-1 min-w-0">
                                    <div className={`text-sm font-medium truncate ${resource.id === currentResource.id ? 'text-white' : 'text-slate-300'}`}>{resource.title}</div>
                                </div>
                                {resource.id === currentResource.id && <Play size={16} className="text-purple-400" fill="currentColor" />}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Side: Notes Editor */}
            <div className="flex-1 bg-slate-900/30 rounded-xl border border-white/5 overflow-hidden">
                <NoteEditor resourceId={currentResource.id} />
            </div>
        </div>
    );
};

export default PlayerPage;
