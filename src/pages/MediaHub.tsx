import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { resourceService } from '../services/resourceService';
import type { Resource, ResourceStatus } from '../types';
import { useTranslation } from 'react-i18next';
import { ResourceCard, PlaylistSection } from '../components/ResourceCard';

const MediaHub = () => {
    const { t } = useTranslation();
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [resources, setResources] = useState<Resource[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<ResourceStatus | 'all'>('all');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // Form State
    const [newUrl, setNewUrl] = useState('');
    const [newTitle, setNewTitle] = useState('');
    const [addLoading, setAddLoading] = useState(false);

    useEffect(() => {
        loadResources();
    }, [currentUser, filter]);

    const loadResources = async () => {
        if (!currentUser) return;
        setLoading(true);
        try {
            const data = await resourceService.getUserResources(
                currentUser.uid,
                filter === 'all' ? undefined : filter
            );
            setResources(data);
        } catch (error: any) {
            console.error("Failed to load resources", error);
            alert("Error loading resources: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAddResource = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser || !newUrl || addLoading) return;

        setAddLoading(true);
        try {
            await resourceService.addResource(currentUser.uid, newUrl, newTitle || undefined);
            setNewUrl('');
            setNewTitle('');
            setIsAddModalOpen(false);
            loadResources(); // Refresh
        } catch (error: any) {
            console.error("Failed to add resource", error);
            alert("Failed to add resource: " + (error.message || "Unknown error"));
        } finally {
            setAddLoading(false);
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!currentUser || !confirm(t('mediaHub.deleteConfirm') || 'Delete?')) return;
        try {
            await resourceService.deleteResource(currentUser.uid, id);
            setResources(prev => prev.filter(r => r.id !== id));
        } catch (error) {
            console.error("Failed to delete", error);
        }
    };

    // Group resources by playlist
    const groupedResources = React.useMemo(() => {
        const playlists: Record<string, Resource[]> = {};
        const standalone: Resource[] = [];

        resources.forEach(resource => {
            if (resource.playlistId) {
                if (!playlists[resource.playlistId]) {
                    playlists[resource.playlistId] = [];
                }
                playlists[resource.playlistId].push(resource);
            } else {
                standalone.push(resource);
            }
        });

        // Sort playlists by position
        Object.values(playlists).forEach(playlist => {
            playlist.sort((a, b) => (a.playlistPosition || 0) - (b.playlistPosition || 0));
        });

        return { playlists, standalone };
    }, [resources]);

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-white mb-2">{t('mediaHub.title')}</h2>
                    <p className="text-slate-400">{t('mediaHub.subtitle')}</p>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-lg shadow-purple-900/20"
                >
                    <Plus size={18} />
                    {t('mediaHub.addBtn')}
                </button>
            </div>

            {/* Filters */}
            <div className="flex bg-slate-900/50 p-1 rounded-xl w-fit border border-white/5">
                {(['all', 'new', 'in_progress', 'watched'] as const).map((s) => (
                    <button
                        key={s}
                        onClick={() => setFilter(s)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === s
                            ? 'bg-purple-600 text-white shadow-lg'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                            }`}
                    >
                        {t(`mediaHub.filters.${s}`)}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="space-y-8">
                {/* Playlists */}
                {Object.entries(groupedResources.playlists).map(([playlistId, playlistResources]) => (
                    <PlaylistSection
                        key={playlistId}
                        playlistTitle={playlistResources[0]?.playlistTitle || 'Playlist'}
                        resources={playlistResources}
                        onDelete={handleDelete}
                    />
                ))}

                {/* Standalone videos */}
                {groupedResources.standalone.length > 0 && (
                    <div className="space-y-4">
                        {Object.keys(groupedResources.playlists).length > 0 && (
                            <h3 className="text-lg font-semibold text-white">{t('mediaHub.standalone') || 'Videos'}</h3>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {groupedResources.standalone.map((resource) => (
                                <ResourceCard key={resource.id} resource={resource} onDelete={handleDelete} />
                            ))}
                        </div>
                    </div>
                )}

                {/* Empty state */}
                {resources.length === 0 && !loading && (
                    <div className="col-span-full py-20 text-center text-slate-500">
                        <div className="inline-block p-4 rounded-full bg-slate-900/50 mb-4">
                            {/* Empty icon placeholder */}
                        </div>
                        <p className="mb-4">{t('mediaHub.empty')}</p>
                        <button
                            onClick={async () => {
                                if (currentUser && confirm("Create sample data?")) {
                                    setLoading(true);
                                    await import('../utils/seedDatabase').then(m => m.seedDatabase(currentUser.uid));
                                    loadResources();
                                    setLoading(false);
                                }
                            }}
                            className="text-xs text-purple-400 hover:text-purple-300 underline"
                        >
                            {t('mediaHub.initSample')}
                        </button>
                    </div>
                )}
            </div>

            {/* Add Resource Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-slate-900 border border-white/10 p-6 rounded-2xl w-full max-w-md shadow-2xl">
                        <h3 className="text-xl font-bold text-white mb-4">{t('mediaHub.modal.title')}</h3>
                        <form onSubmit={handleAddResource} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">{t('mediaHub.modal.urlLabel')}</label>
                                <input
                                    type="text"
                                    value={newUrl}
                                    onChange={(e) => setNewUrl(e.target.value)}
                                    placeholder="https://..."
                                    className="w-full bg-slate-800 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">{t('mediaHub.modal.titleLabel')}</label>
                                <input
                                    type="text"
                                    value={newTitle}
                                    onChange={(e) => setNewTitle(e.target.value)}
                                    placeholder="My Great Lecture"
                                    className="w-full bg-slate-800 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="flex-1 px-4 py-2 rounded-lg text-slate-300 hover:bg-white/5 transition-colors"
                                >
                                    {t('mediaHub.modal.cancel')}
                                </button>
                                <button
                                    type="submit"
                                    disabled={!newUrl || addLoading}
                                    className="flex-1 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {addLoading ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" />
                                            {t('mediaHub.modal.add')}...
                                        </>
                                    ) : (
                                        t('mediaHub.modal.add')
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const Badge = ({ status }: { status: ResourceStatus }) => {
    const { t } = useTranslation();
    switch (status) {
        case 'new': return <span className="bg-blue-500/20 text-blue-400 text-[10px] font-bold px-2 py-1 rounded border border-blue-500/20">{t('mediaHub.filters.new').toUpperCase()}</span>;
        case 'in_progress': return <span className="bg-yellow-500/20 text-yellow-400 text-[10px] font-bold px-2 py-1 rounded border border-yellow-500/20">{t('mediaHub.filters.in_progress').toUpperCase()}</span>;
        case 'watched': return <span className="bg-green-500/20 text-green-400 text-[10px] font-bold px-2 py-1 rounded border border-green-500/20">{t('mediaHub.filters.watched').toUpperCase()}</span>;
        default: return null;
    }
};

export default MediaHub;
