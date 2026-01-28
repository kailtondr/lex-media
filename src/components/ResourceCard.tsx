import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Clock, Trash2, ChevronDown } from 'lucide-react';
import type { Resource } from '../types';

interface ResourceCardProps {
    resource: Resource;
    onDelete: (id: string, e: React.MouseEvent) => void;
}

export const ResourceCard: React.FC<ResourceCardProps> = ({ resource, onDelete }) => {
    const navigate = useNavigate();

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
                    <button className="bg-purple-600 p-3 rounded-full text-white hover:scale-110 transition-transform">
                        <Play size={20} fill="currentColor" />
                    </button>
                    <button
                        onClick={(e) => onDelete(resource.id, e)}
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
    );
};

interface PlaylistSectionProps {
    playlistTitle: string;
    resources: Resource[];
    onDelete: (id: string, e: React.MouseEvent) => void;
}

export const PlaylistSection: React.FC<PlaylistSectionProps> = ({ playlistTitle, resources, onDelete }) => {
    const [isExpanded, setIsExpanded] = useState(true);

    return (
        <div className="space-y-4">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-3 w-full text-left group"
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

            {isExpanded && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pl-8">
                    {resources.map((resource) => (
                        <ResourceCard key={resource.id} resource={resource} onDelete={onDelete} />
                    ))}
                </div>
            )}
        </div>
    );
};
