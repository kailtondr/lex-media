// @ts-nocheck
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactPlayer from 'react-player';
import { useAuth } from '../contexts/AuthContext';
import { resourceService } from '../services/resourceService';
import type { Resource } from '../types';
import { ArrowLeft, Loader2 } from 'lucide-react';
import NoteEditor from '../components/NoteEditor';
import { useTranslation } from 'react-i18next';

const PlayerPage: React.FC = () => {
    const { t } = useTranslation();
    const { id } = useParams<{ id: string }>();
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    const [resource, setResource] = useState<Resource | null>(null);
    const [loading, setLoading] = useState(true);
    const playerRef = useRef<any>(null);

    // Sync state
    const lastSavedSeconds = useRef<number>(0);
    const isReadyRef = useRef(false);

    useEffect(() => {
        if (!id || !currentUser) return;

        const fetchData = async () => {
            try {
                const res = await resourceService.getResource(currentUser.uid, id);
                if (res) {
                    setResource(res);
                    lastSavedSeconds.current = res.progress.playedSeconds;
                } else {
                    navigate('/media');
                }
            } catch (error) {
                console.error("Failed to load resource", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id, currentUser, navigate]);

    const saveProgress = useCallback(async (playedSeconds: number, totalSeconds: number) => {
        if (!currentUser || !id) return;
        try {
            await resourceService.updateProgress(currentUser.uid, id, playedSeconds, totalSeconds);
            lastSavedSeconds.current = playedSeconds;
            console.log("Progress saved:", playedSeconds);
        } catch (error) {
            console.error("Failed to save progress", error);
        }
    }, [currentUser, id]);

    const handleReady = () => {
        if (!isReadyRef.current && resource && playerRef.current) {
            if (resource.progress.playedSeconds > 0) {
                playerRef.current.seekTo(resource.progress.playedSeconds, 'seconds');
                console.log("Resuming at:", resource.progress.playedSeconds);
            }
            isReadyRef.current = true;
        }
    };

    const handleProgress = (state: any) => {
        const { playedSeconds, loadedSeconds } = state;
        const totalDuration = playerRef.current?.getDuration() || 0;

        // Auto-save every 10 seconds (approx)
        if (Math.abs(playedSeconds - lastSavedSeconds.current) > 10) {
            saveProgress(playedSeconds, totalDuration);
        }
    };

    const handlePause = () => {
        if (playerRef.current) {
            const currentTime = playerRef.current.getCurrentTime();
            const totalDuration = playerRef.current.getDuration();
            saveProgress(currentTime, totalDuration);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="animate-spin text-purple-600" size={48} />
            </div>
        );
    }

    if (!resource) return null;

    return (
        <div className="h-[calc(100vh-6rem)] flex flex-col">
            <div className="mb-4">
                <button
                    onClick={() => navigate('/media')}
                    className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
                >
                    <ArrowLeft size={20} />
                    {t('player.back')}
                </button>
                <h1 className="text-2xl font-bold text-white">{resource.title}</h1>
            </div>

            <div className="flex-1 bg-black rounded-2xl overflow-hidden border border-white/10 relative shadow-2xl shadow-black/50">
                <div className="absolute inset-0">
                    <ReactPlayer
                        ref={playerRef}
                        url={resource.processedUrl}
                        width="100%"
                        height="100%"
                        controls
                        playing
                        onReady={handleReady}
                        onProgress={handleProgress}
                        onPause={handlePause}
                        config={{
                            youtube: {
                                playerVars: { showinfo: 1 }
                            }
                        }}
                    />
                </div>
            </div>

            <div className="mt-4 h-96"> {/* Fixed height for editor area */}
                <NoteEditor resourceId={resource.id} />
            </div>
        </div>
    );
};

export default PlayerPage;
