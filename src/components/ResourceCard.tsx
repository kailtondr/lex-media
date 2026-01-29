import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Clock, Trash2, ChevronDown, ArrowUpDown } from 'lucide-react';
import type { Resource } from '../types';
import { usePlayer } from '../contexts/PlayerContext';

interface ResourceCardProps {
    resource: Resource;
    onDelete: (id: string, e: React.MouseEvent) => void;
    queue?: Resource[]; // Full queue for playback
}

export const ResourceCard: React.FC<ResourceCardProps> = ({ resource, onDelete, queue }) => {
    const navigate = useNavigate();
    const { playResource } = usePlayer();

    const handlePlayClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        playResource(resource, queue);
    };

    return (
        <div
            onClick={() => navigate(`/resource/${resource.id}`)}
            className="group bg-slate-900/50 border border-white/5 rounded-2xl overflow-hidden hover:border-purple-500/30 transition-all hover:shadow-2xl hover:shadow-purple-900/10 cursor-pointer flex flex-col"
        >
            {/* Thumbnail */}
            <div className="aspect-video bg-slate-800 relative group-hover:scale-105 transition-transform duration-500">
                {resource.thumbnail ? (
                    <img src={resource.thumbnail} alt={resource.title} className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                        <span className="text-slate-600 uppercase font-black text-2xl tracking-widest opacity-20">
                            {resource.sourceType}
                        </span>
                    </div>
                )}

                {/* Playlist position badge */}
                {resource.playlistPosition && (
                    <div className="absolute top-3 right-3 bg-black/60 text-white px-2 py-1 rounded text-xs font-bold">
                        #{resource.playlistPosition}
                    </div>
                )}

                {/* Action Overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button
                        onClick={handlePlayClick}
                        className="bg-purple-600 p-3 rounded-full text-white hover:scale-110 transition-transform"
                        title="Play video"
                    >
                        <Play size={20} fill="currentColor" />
                    </button>
                    <button
                        onClick={(e) => onDelete(resource.id, e)}
                        className="bg-red-500/80 p-3 rounded-full text-white hover:scale-110 transition-transform"
                        title="Delete"
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
    );
};


interface PlaylistSectionProps {
    playlistTitle: string;
    resources: Resource[];
    onDelete: (id: string, e: React.MouseEvent) => void;
}

type SortOption = 'position' | 'dateOldest' | 'dateNewest';

export const PlaylistSection: React.FC<PlaylistSectionProps> = ({ playlistTitle, resources, onDelete }) => {
    const [isExpanded, setIsExpanded] = React.useState(true);
    const [sortBy, setSortBy] = React.useState<SortOption>('position');
    const [showSortMenu, setShowSortMenu] = React.useState(false);
    const { playResource } = usePlayer();

    // Sort resources based on selected option
    const sortedResources = React.useMemo(() => {
        const sorted = [...resources];

        switch (sortBy) {
            case 'position':
                // Original playlist order
                return sorted.sort((a, b) => (a.playlistPosition || 0) - (b.playlistPosition || 0));
            case 'dateOldest':
                // Oldest first
                return sorted.sort((a, b) => a.dateAdded.seconds - b.dateAdded.seconds);
            case 'dateNewest':
                // Newest first
                return sorted.sort((a, b) => b.dateAdded.seconds - a.dateAdded.seconds);
            default:
                return sorted;
        }
    }, [resources, sortBy]);

    const handlePlayAll = () => {
        if (sortedResources.length > 0) {
            playResource(sortedResources[0], sortedResources);
        }
    };

    const sortOptions: { value: SortOption; label: string }[] = [
        { value: 'position', label: 'Position originale' },
        { value: 'dateOldest', label: 'Plus ancien → Récent' },
        { value: 'dateNewest', label: 'Plus récent → Ancien' },
    ];

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3 w-full">
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex items-center gap-3 flex-1 text-left group"
                >
                    <ChevronDown
                        size={20}
                        className={`text-purple-400 transition-transform ${isExpanded ? '' : '-rotate-90'}`}
                    />
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white group-hover:text-purple-300 transition-colors">
                            {playlistTitle}
                        </h3>
                        <p className="text-xs text-slate-500">{resources.length} videos</p>
                    </div>
                </button>

                {/* Sort Dropdown */}
                <div className="relative">
                    <button
                        onClick={() => setShowSortMenu(!showSortMenu)}
                        className="flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors text-sm"
                        title="Trier"
                    >
                        <ArrowUpDown size={16} />
                        <span className="hidden sm:inline">Trier</span>
                    </button>
                    {showSortMenu && (
                        <div className="absolute right-0 top-full mt-2 bg-slate-800 rounded-lg shadow-xl border border-white/10 py-2 min-w-[200px] z-10">
                            {sortOptions.map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => {
                                        setSortBy(option.value);
                                        setShowSortMenu(false);
                                    }}
                                    className={`w-full px-4 py-2 text-sm text-left transition-colors ${sortBy === option.value
                                            ? 'bg-purple-600 text-white'
                                            : 'text-slate-300 hover:bg-white/5'
                                        }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <button
                    onClick={handlePlayAll}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-lg transition-colors"
                >
                    <Play size={16} fill="currentColor" />
                    Play All
                </button>
            </div>

            {isExpanded && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pl-8">
                    {sortedResources.map((resource) => (
                        <ResourceCard key={resource.id} resource={resource} onDelete={onDelete} queue={sortedResources} />
                    ))}
                </div>
            )}
        </div>
    );
};
