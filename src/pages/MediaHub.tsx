import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Clock, Trash2, Plus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { resourceService } from '../services/resourceService';
import type { Resource, ResourceStatus } from '../types';
import { useTranslation } from 'react-i18next';

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
        } catch (error) {
            console.error("Failed to load resources", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddResource = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser || !newUrl) return;

        try {
            await resourceService.addResource(currentUser.uid, newUrl, newTitle || undefined);
            setNewUrl('');
            setNewTitle('');
            setIsAddModalOpen(false);
            loadResources(); // Refresh
        } catch (error) {
            console.error("Failed to add resource", error);
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent card click
        if (!currentUser || !confirm('Are you sure you want to delete this resource?')) return;
        try {
            await resourceService.deleteResource(currentUser.uid, id);
            setResources(prev => prev.filter(r => r.id !== id));
        } catch (error) {
            console.error("Failed to delete", error);
        }
    };

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

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {resources.map((resource) => (
                    <div
                        key={resource.id}
                        onClick={() => navigate(`/resource/${resource.id}`)}
                        className="group bg-slate-900/50 border border-white/5 rounded-2xl overflow-hidden hover:border-purple-500/30 transition-all hover:shadow-2xl hover:shadow-purple-900/10 cursor-pointer flex flex-col"
                    >
                        {/* Thumbnail / Placeholder */}
                        <div className="aspect-video bg-slate-800 relative group-hover:scale-105 transition-transform duration-500">
                            {/* If we had real thumbnails, they'd go here. For now, Source Icon or Gradient */}
                            <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                                <span className="text-slate-600 uppercase font-black text-2xl tracking-widest opacity-20">
                                    {resource.sourceType}
                                </span>
                            </div>

                            {/* Status Badge */}
                            <div className="absolute top-3 left-3">
                                <Badge status={resource.status} />
                            </div>

                            {/* Action Overlay */}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                <button className="bg-purple-600 p-3 rounded-full text-white hover:scale-110 transition-transform">
                                    <Play size={20} fill="currentColor" />
                                </button>
                                <button
                                    onClick={(e) => handleDelete(resource.id, e)}
                                    className="bg-red-500/80 p-3 rounded-full text-white hover:scale-110 transition-transform"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>

                        <div className="p-4 flex-1 flex flex-col">
                            <h3 className="font-semibold text-slate-200 mb-2 line-clamp-2" title={resource.title}>
                                {resource.title}
                            </h3>
                            <div className="mt-auto flex items-center justify-between text-xs text-slate-500">
                                <span className="flex items-center gap-1">
                                    <Clock size={12} />
                                    {Math.round((resource.progress.playedSeconds / 60))}m / {Math.round((resource.progress.totalSeconds / 60))}m
                                </span>
                                <span>{new Date(resource.dateAdded.seconds * 1000).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                ))}

                {resources.length === 0 && !loading && (
                    <div className="col-span-full py-20 text-center text-slate-500">
                        <div className="inline-block p-4 rounded-full bg-slate-900/50 mb-4">
                            <Play size={32} className="opacity-50" />
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
                                    disabled={!newUrl}
                                    className="flex-1 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                                >
                                    {t('mediaHub.modal.add')}
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
