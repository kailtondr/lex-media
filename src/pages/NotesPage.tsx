import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { noteService } from '../services/noteService';
import type { Note } from '../types';
import {
    Plus, Search, Grid, List as ListIcon, Trash2,
    FileText, Calendar, Tag, ArrowLeft
} from 'lucide-react';
import NoteEditor from '../components/NoteEditor';

const NotesPage: React.FC = () => {
    const { id } = useParams<{ id?: string }>();
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [notes, setNotes] = useState<Note[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [selectedNote, setSelectedNote] = useState<Note | null>(null);
    const [creatingNew, setCreatingNew] = useState(false);

    useEffect(() => {
        loadNotes();
    }, [currentUser]);

    // Load specific note if ID is provided
    useEffect(() => {
        if (id && currentUser) {
            loadSpecificNote(id);
        }
    }, [id, currentUser]);

    const loadNotes = async () => {
        if (!currentUser) return;
        setLoading(true);
        try {
            const allNotes = await noteService.getNotes(currentUser.uid);
            setNotes(allNotes);
        } catch (error) {
            console.error('Failed to load notes:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadSpecificNote = async (noteId: string) => {
        if (!currentUser) return;
        try {
            const note = await noteService.getNote(currentUser.uid, noteId);
            if (note) {
                setSelectedNote(note);
            }
        } catch (error) {
            console.error('Failed to load note:', error);
        }
    };

    const handleDeleteNote = async (noteId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!currentUser || !confirm('Delete this note?')) return;

        try {
            await noteService.deleteNote(currentUser.uid, noteId);
            setNotes(prev => prev.filter(n => n.id !== noteId));
            if (selectedNote?.id === noteId) {
                setSelectedNote(null);
                navigate('/notes');
            }
        } catch (error) {
            console.error('Failed to delete note:', error);
        }
    };

    const handleCreateNew = () => {
        setSelectedNote(null);
        setCreatingNew(true);
        navigate('/notes/new');
    };

    const handleNoteClick = (note: Note) => {
        setSelectedNote(note);
        setCreatingNew(false);
        navigate(`/notes/${note.id}`);
    };

    const handleBackToList = () => {
        setSelectedNote(null);
        setCreatingNew(false);
        navigate('/notes');
        loadNotes(); // Refresh list
    };

    const filteredNotes = notes.filter(note => {
        const searchLower = searchQuery.toLowerCase();
        return (
            note.title.toLowerCase().includes(searchLower) ||
            note.content.toLowerCase().includes(searchLower)
        );
    });

    // If we're viewing/editing a specific note
    if (selectedNote || creatingNew || id) {
        return (
            <div className="h-full flex flex-col">
                <div className="mb-4">
                    <button
                        onClick={handleBackToList}
                        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft size={20} />
                        Back to Notes
                    </button>
                </div>
                <div className="flex-1 min-h-0">
                    <NoteEditor
                        initialNoteId={selectedNote?.id || (id !== 'new' ? id : undefined)}
                        resourceId={selectedNote?.resourceId}
                    />
                </div>
            </div>
        );
    }

    // Notes list view
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-white mb-2">Notes</h2>
                    <p className="text-slate-400">Your thoughts, ideas, and insights</p>
                </div>
                <button
                    onClick={handleCreateNew}
                    className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-lg shadow-purple-900/20"
                >
                    <Plus size={18} />
                    New Note
                </button>
            </div>

            {/* Search and View Controls */}
            <div className="flex items-center gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search notes..."
                        className="w-full bg-slate-900/50 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-purple-500 transition-colors"
                    />
                </div>
                <div className="flex bg-slate-900/50 border border-white/10 rounded-lg p-1">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded transition-colors ${viewMode === 'grid' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}
                        title="Grid View"
                    >
                        <Grid size={18} />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded transition-colors ${viewMode === 'list' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}
                        title="List View"
                    >
                        <ListIcon size={18} />
                    </button>
                </div>
            </div>

            {/* Notes Display */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin text-purple-600">Loading...</div>
                </div>
            ) : filteredNotes.length === 0 ? (
                <div className="text-center py-20">
                    <FileText className="mx-auto mb-4 text-slate-600" size={48} />
                    <p className="text-slate-400 mb-4">
                        {searchQuery ? 'No notes found matching your search' : 'No notes yet'}
                    </p>
                    {!searchQuery && (
                        <button
                            onClick={handleCreateNew}
                            className="text-purple-400 hover:text-purple-300 underline"
                        >
                            Create your first note
                        </button>
                    )}
                </div>
            ) : (
                <div className={viewMode === 'grid'
                    ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                    : 'space-y-4'
                }>
                    {filteredNotes.map((note) => (
                        <div
                            key={note.id}
                            onClick={() => handleNoteClick(note)}
                            className={`group bg-slate-900/50 border border-white/5 rounded-xl overflow-hidden hover:border-purple-500/30 transition-all hover:shadow-xl hover:shadow-purple-900/10 cursor-pointer ${viewMode === 'list' ? 'flex items-center gap-4 p-4' : 'flex flex-col'
                                }`}
                        >
                            {viewMode === 'grid' ? (
                                <>
                                    <div className="p-5 flex-1">
                                        <div className="flex items-start justify-between mb-3">
                                            <h3 className="font-semibold text-slate-200 line-clamp-2 flex-1">
                                                {note.title || 'Untitled Note'}
                                            </h3>
                                            <button
                                                onClick={(e) => handleDeleteNote(note.id, e)}
                                                className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400 transition-all"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                        <p className="text-slate-400 text-sm line-clamp-3 mb-4">
                                            {note.content || 'No content'}
                                        </p>
                                        <div className="flex items-center gap-3 text-xs text-slate-500">
                                            <span className="flex items-center gap-1">
                                                <Calendar size={12} />
                                                {new Date(note.updatedAt.seconds * 1000).toLocaleDateString()}
                                            </span>
                                            {note.resourceId && (
                                                <span className="flex items-center gap-1 text-purple-400">
                                                    <Tag size={12} />
                                                    Video Note
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-slate-200 mb-1">
                                            {note.title || 'Untitled Note'}
                                        </h3>
                                        <p className="text-slate-400 text-sm line-clamp-1">
                                            {note.content || 'No content'}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-slate-500">
                                        <span className="flex items-center gap-1">
                                            <Calendar size={12} />
                                            {new Date(note.updatedAt.seconds * 1000).toLocaleDateString()}
                                        </span>
                                        {note.resourceId && (
                                            <span className="flex items-center gap-1 text-purple-400">
                                                <Tag size={12} />
                                                Video
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        onClick={(e) => handleDeleteNote(note.id, e)}
                                        className="opacity-0 group-hover:opacity-100 p-2 text-slate-500 hover:text-red-400 transition-all"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default NotesPage;
