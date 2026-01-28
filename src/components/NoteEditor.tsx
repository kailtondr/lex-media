import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Save } from 'lucide-react';
import { noteService } from '../services/noteService';
import { useAuth } from '../contexts/AuthContext';
// import type { Note } from '../types';

interface NoteEditorProps {
    resourceId?: string; // If tied to a video
    initialNoteId?: string; // If editing existing
}

const NoteEditor: React.FC<NoteEditorProps> = ({ resourceId, initialNoteId }) => {
    const { currentUser } = useAuth();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [isPreview, setIsPreview] = useState(false);
    const [noteId, setNoteId] = useState<string | undefined>(initialNoteId);
    const [saving, setSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);

    // Load existing note if provided or if we want to auto-load the "main" note for this resource
    useEffect(() => {
        if (!currentUser) return;

        const loadNote = async () => {
            if (initialNoteId) {
                const note = await noteService.getNote(currentUser.uid, initialNoteId);
                if (note) {
                    setTitle(note.title);
                    setContent(note.content);
                }
            } else if (resourceId) {
                // Try to find an existing note for this resource or start blank
                const notes = await noteService.getNotes(currentUser.uid, resourceId);
                if (notes.length > 0) {
                    const note = notes[0]; // Just take first for now
                    setNoteId(note.id);
                    setTitle(note.title);
                    setContent(note.content);
                }
            }
        };
        loadNote();
    }, [currentUser, initialNoteId, resourceId]);

    const handleSave = async () => {
        if (!currentUser) return;
        setSaving(true);
        try {
            if (noteId) {
                await noteService.updateNote(currentUser.uid, noteId, content, title);
            } else {
                const newNote = await noteService.addNote(currentUser.uid, title, content, resourceId);
                setNoteId(newNote.id);
            }
            setLastSaved(new Date());
        } catch (error) {
            console.error("Failed to save note", error);
        } finally {
            setSaving(false);
        }
    };

    // Auto-save logic could go here (debounce)

    return (
        <div className="flex flex-col h-full bg-slate-900/50 border border-white/10 rounded-xl overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center justify-between p-3 border-b border-white/5 bg-slate-900">
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Note Title..."
                    className="bg-transparent text-slate-200 font-bold focus:outline-none placeholder-slate-600 w-full"
                />
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsPreview(!isPreview)}
                        className={`text-xs px-2 py-1 rounded transition-colors ${isPreview ? 'bg-purple-600 text-white' : 'text-slate-400 hover:bg-white/5'}`}
                    >
                        {isPreview ? 'Edit' : 'Preview'}
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded transition-all"
                    >
                        <Save size={14} />
                        {saving ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </div>

            {/* Editor Area */}
            <div className="flex-1 overflow-hidden relative">
                {isPreview ? (
                    <div className="h-full overflow-auto p-4 prose prose-invert prose-sm max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {content || '*No content yet*'}
                        </ReactMarkdown>
                    </div>
                ) : (
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Write your thoughts here... Use [[WikiLinks]] to connect ideas."
                        className="w-full h-full bg-transparent p-4 text-slate-300 resize-none focus:outline-none font-mono text-sm leading-relaxed"
                    />
                )}
            </div>

            <div className="px-3 py-1 bg-slate-950/50 text-[10px] text-slate-600 flex justify-between">
                <span>Markdown Supported</span>
                <span>{lastSaved ? `Saved ${lastSaved.toLocaleTimeString()}` : 'Unsaved'}</span>
            </div>
        </div>
    );
};

export default NoteEditor;
