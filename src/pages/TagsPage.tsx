import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { resourceService } from '../services/resourceService';
import type { Resource } from '../types';
import { Tag as TagIcon, Search, TrendingUp, Hash, Play } from 'lucide-react';

interface TagData {
    name: string;
    count: number;
    resources: Resource[];
}

const TagsPage: React.FC = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [tags, setTags] = useState<TagData[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTag, setSelectedTag] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState<'name' | 'count'>('count');

    useEffect(() => {
        loadTags();
    }, [currentUser]);

    const loadTags = async () => {
        if (!currentUser) return;
        setLoading(true);
        try {
            const resources = await resourceService.getResources(currentUser.uid);

            // Aggregate tags
            const tagMap = new Map<string, Resource[]>();

            resources.forEach(resource => {
                if (resource.tags && resource.tags.length > 0) {
                    resource.tags.forEach(tag => {
                        if (!tagMap.has(tag)) {
                            tagMap.set(tag, []);
                        }
                        tagMap.get(tag)!.push(resource);
                    });
                }
            });

            // Convert to array
            const tagsData: TagData[] = Array.from(tagMap.entries()).map(([name, resources]) => ({
                name,
                count: resources.length,
                resources
            }));

            setTags(tagsData);
        } catch (error) {
            console.error('Failed to load tags:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredTags = tags.filter(tag =>
        tag.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const sortedTags = [...filteredTags].sort((a, b) => {
        if (sortBy === 'count') {
            return b.count - a.count;
        }
        return a.name.localeCompare(b.name);
    });

    const selectedTagData = selectedTag ? tags.find(t => t.name === selectedTag) : null;

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="mb-6">
                <h2 className="text-3xl font-bold text-white mb-2">Tags</h2>
                <p className="text-slate-400">Explorez vos ressources par tags</p>
            </div>

            {/* Search and Sort */}
            <div className="flex items-center gap-4 mb-6">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Rechercher un tag..."
                        className="w-full bg-slate-900/50 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-purple-500 transition-colors"
                    />
                </div>
                <div className="flex bg-slate-900/50 border border-white/10 rounded-lg p-1">
                    <button
                        onClick={() => setSortBy('count')}
                        className={`px-3 py-1.5 text-sm rounded transition-colors flex items-center gap-2 ${sortBy === 'count' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        <TrendingUp size={14} />
                        Populaire
                    </button>
                    <button
                        onClick={() => setSortBy('name')}
                        className={`px-3 py-1.5 text-sm rounded transition-colors flex items-center gap-2 ${sortBy === 'name' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        <Hash size={14} />
                        Nom
                    </button>
                </div>
            </div>

            {/* Main Content */}
            {loading ? (
                <div className="flex items-center justify-center flex-1">
                    <div className="animate-spin text-purple-600">Chargement...</div>
                </div>
            ) : (
                <div className="flex-1 flex gap-6 overflow-hidden">
                    {/* Tags List */}
                    <div className={`${selectedTag ? 'w-1/3' : 'w-full'} transition-all duration-300`}>
                        {sortedTags.length === 0 ? (
                            <div className="text-center py-20">
                                <TagIcon className="mx-auto mb-4 text-slate-600" size={48} />
                                <p className="text-slate-400 mb-2">
                                    {searchQuery ? 'Aucun tag trouvé' : 'Aucun tag encore'}
                                </p>
                                <p className="text-slate-500 text-sm">
                                    Ajoutez des tags à vos ressources pour mieux les organiser
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2 overflow-y-auto h-full pr-2">
                                {sortedTags.map((tag) => (
                                    <button
                                        key={tag.name}
                                        onClick={() => setSelectedTag(tag.name === selectedTag ? null : tag.name)}
                                        className={`w-full text-left p-4 rounded-xl transition-all flex items-center justify-between group ${selectedTag === tag.name
                                                ? 'bg-purple-600/20 border border-purple-500/30 shadow-lg'
                                                : 'bg-slate-900/50 border border-white/5 hover:border-purple-500/30'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <div className={`p-2 rounded-lg ${selectedTag === tag.name ? 'bg-purple-600/30' : 'bg-slate-800'
                                                }`}>
                                                <TagIcon size={18} className={
                                                    selectedTag === tag.name ? 'text-purple-300' : 'text-slate-400'
                                                } />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className={`font-semibold truncate ${selectedTag === tag.name ? 'text-white' : 'text-slate-200'
                                                    }`}>
                                                    #{tag.name}
                                                </div>
                                                <div className="text-xs text-slate-500">
                                                    {tag.count} {tag.count === 1 ? 'ressource' : 'ressources'}
                                                </div>
                                            </div>
                                        </div>
                                        <div className={`text-sm font-bold ${selectedTag === tag.name ? 'text-purple-400' : 'text-slate-500'
                                            }`}>
                                            {tag.count}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Resources for Selected Tag */}
                    {selectedTag && selectedTagData && (
                        <div className="flex-1 bg-slate-900/30 rounded-xl border border-white/5 overflow-hidden flex flex-col">
                            <div className="p-4 border-b border-white/5">
                                <h3 className="text-white font-semibold flex items-center gap-2">
                                    <TagIcon size={18} className="text-purple-400" />
                                    #{selectedTag}
                                    <span className="text-slate-500 text-sm font-normal">
                                        ({selectedTagData.count} {selectedTagData.count === 1 ? 'ressource' : 'ressources'})
                                    </span>
                                </h3>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                {selectedTagData.resources.map((resource) => (
                                    <div
                                        key={resource.id}
                                        onClick={() => navigate(`/resource/${resource.id}`)}
                                        className="bg-slate-800/30 hover:bg-slate-800/50 border border-white/5 hover:border-purple-500/30 rounded-lg p-4 cursor-pointer transition-all group"
                                    >
                                        <div className="flex gap-4">
                                            {resource.thumbnail && (
                                                <img
                                                    src={resource.thumbnail}
                                                    alt={resource.title}
                                                    className="w-32 h-20 object-cover rounded"
                                                />
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-semibold text-white mb-1 line-clamp-2 group-hover:text-purple-300 transition-colors">
                                                    {resource.title}
                                                </h4>
                                                <div className="flex items-center gap-3 text-xs text-slate-500">
                                                    <span>{resource.sourceType.toUpperCase()}</span>
                                                    <span>•</span>
                                                    <span>{new Date(resource.dateAdded.seconds * 1000).toLocaleDateString()}</span>
                                                    {resource.progress.totalSeconds > 0 && (
                                                        <>
                                                            <span>•</span>
                                                            <span>{Math.round(resource.progress.totalSeconds / 60)}m</span>
                                                        </>
                                                    )}
                                                </div>
                                                {resource.tags && resource.tags.length > 0 && (
                                                    <div className="flex gap-2 mt-2 flex-wrap">
                                                        {resource.tags.slice(0, 3).map((tag, i) => (
                                                            <span
                                                                key={i}
                                                                className="text-xs bg-purple-600/10 text-purple-400 px-2 py-0.5 rounded border border-purple-500/20"
                                                            >
                                                                #{tag}
                                                            </span>
                                                        ))}
                                                        {resource.tags.length > 3 && (
                                                            <span className="text-xs text-slate-500">
                                                                +{resource.tags.length - 3}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(`/resource/${resource.id}`);
                                                }}
                                                className="opacity-0 group-hover:opacity-100 self-center p-2 text-purple-400 hover:text-purple-300 transition-all"
                                                title="Play"
                                            >
                                                <Play size={20} fill="currentColor" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default TagsPage;
