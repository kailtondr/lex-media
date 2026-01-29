import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
    Save, Eye, Edit3, Bold, Italic, Code, List, ListOrdered,
    Heading1, Heading2, Heading3, Quote, Link, Image, Minus,
    Maximize2, Minimize2, Clock
} from 'lucide-react';
import { noteService } from '../services/noteService';
import { useAuth } from '../contexts/AuthContext';
import { usePlayer } from '../contexts/PlayerContext';

interface NoteEditorProps {
    resourceId?: string; // If tied to a video
    initialNoteId?: string; // If editing existing
}

const NoteEditor: React.FC<NoteEditorProps> = ({ resourceId, initialNoteId }) => {
    const { currentUser } = useAuth();
    const { currentResource, currentTime } = usePlayer();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [isPreview, setIsPreview] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [noteId, setNoteId] = useState<string | undefined>(initialNoteId);
    const [saving, setSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [wordCount, setWordCount] = useState(0);
    const [charCount, setCharCount] = useState(0);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const saveTimeoutRef = useRef<number>();

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

    // Update word and character count
    useEffect(() => {
        const words = content.trim().split(/\s+/).filter(word => word.length > 0);
        setWordCount(words.length);
        setCharCount(content.length);
    }, [content]);

    // Auto-save with debounce
    useEffect(() => {
        if (!currentUser || (!content && !title)) return;

        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        saveTimeoutRef.current = setTimeout(() => {
            handleSave(true); // silent save
        }, 2000);

        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, [content, title]);

    const handleSave = async (silent = false) => {
        if (!currentUser) return;
        if (!silent) setSaving(true);
        try {
            if (noteId) {
                await noteService.updateNote(currentUser.uid, noteId, content, title);
            } else {
                const newNote = await noteService.addNote(currentUser.uid, title || 'Untitled Note', content, resourceId);
                setNoteId(newNote.id);
            }
            setLastSaved(new Date());
        } catch (error) {
            console.error("Failed to save note", error);
        } finally {
            if (!silent) setSaving(false);
        }
    };

    // Formatting helpers
    const insertFormatting = useCallback((before: string, after: string = '', placeholder: string = 'text') => {
        if (!textareaRef.current) return;

        const textarea = textareaRef.current;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = content.substring(start, end);
        const textToInsert = selectedText || placeholder;

        const newContent =
            content.substring(0, start) +
            before + textToInsert + after +
            content.substring(end);

        setContent(newContent);

        // Reset cursor position
        setTimeout(() => {
            textarea.focus();
            const newCursorPos = start + before.length + textToInsert.length;
            textarea.setSelectionRange(newCursorPos, newCursorPos);
        }, 0);
    }, [content]);

    const insertHeading = (level: number) => {
        const prefix = '#'.repeat(level) + ' ';
        insertFormatting(prefix, '', 'Heading');
    };

    const insertList = (ordered: boolean) => {
        const prefix = ordered ? '1. ' : '- ';
        insertFormatting(prefix, '', 'List item');
    };

    const insertTimestamp = () => {
        if (!currentResource) return;
        const timestamp = formatTime(currentTime);
        const timestampText = `[${timestamp}]`;
        insertFormatting(timestampText + ' ', '', 'note at this time');
    };

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Keyboard shortcuts for formatting
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!(e.ctrlKey || e.metaKey)) return;

            switch (e.key.toLowerCase()) {
                case 'b':
                    e.preventDefault();
                    insertFormatting('**', '**', 'bold text');
                    break;
                case 'i':
                    e.preventDefault();
                    insertFormatting('*', '*', 'italic text');
                    break;
                case 's':
                    e.preventDefault();
                    handleSave();
                    break;
            }
        };

        if (textareaRef.current && !isPreview) {
            textareaRef.current.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            if (textareaRef.current) {
                textareaRef.current.removeEventListener('keydown', handleKeyDown);
            }
        };
    }, [isPreview, insertFormatting]);

    return (
        <div className={`flex flex-col bg-slate-900/50 border border-white/10 rounded-xl overflow-hidden transition-all ${isFullscreen ? 'fixed inset-4 z-50' : 'h-full'}`}>
            {/* Toolbar */}
            <div className="flex items-center justify-between p-3 border-b border-white/5 bg-slate-900/80 backdrop-blur-sm">
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Note Title..."
                    className="bg-transparent text-slate-200 font-bold focus:outline-none placeholder-slate-600 w-full max-w-md text-lg"
                />
                <div className="flex items-center gap-2">
                    {/* Stats */}
                    <div className="text-xs text-slate-500 hidden sm:flex items-center gap-3 mr-2">
                        <span>{wordCount} words</span>
                        <span>{charCount} chars</span>
                    </div>

                    {/* View Toggle */}
                    <button
                        onClick={() => setIsPreview(!isPreview)}
                        className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded transition-colors ${isPreview ? 'bg-purple-600 text-white' : 'text-slate-400 hover:bg-white/5'}`}
                        title="Toggle Preview"
                    >
                        {isPreview ? <><Edit3 size={14} /> Edit</> : <><Eye size={14} /> Preview</>}
                    </button>

                    {/* Fullscreen Toggle */}
                    <button
                        onClick={() => setIsFullscreen(!isFullscreen)}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded transition-colors"
                        title="Toggle Fullscreen"
                    >
                        {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                    </button>

                    {/* Save Button */}
                    <button
                        onClick={() => handleSave()}
                        disabled={saving}
                        className="flex items-center gap-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded transition-all disabled:opacity-50"
                    >
                        <Save size={14} />
                        {saving ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </div>

            {/* Formatting Toolbar (only in edit mode) */}
            {!isPreview && (
                <div className="flex items-center gap-1 p-2 border-b border-white/5 bg-slate-900/50 overflow-x-auto">
                    <div className="flex items-center gap-0.5 border-r border-white/10 pr-2">
                        <button
                            onClick={() => insertFormatting('**', '**', 'bold')}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded transition-colors"
                            title="Bold (Ctrl+B)"
                        >
                            <Bold size={16} />
                        </button>
                        <button
                            onClick={() => insertFormatting('*', '*', 'italic')}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded transition-colors"
                            title="Italic (Ctrl+I)"
                        >
                            <Italic size={16} />
                        </button>
                        <button
                            onClick={() => insertFormatting('`', '`', 'code')}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded transition-colors"
                            title="Inline Code"
                        >
                            <Code size={16} />
                        </button>
                    </div>

                    <div className="flex items-center gap-0.5 border-r border-white/10 pr-2">
                        <button
                            onClick={() => insertHeading(1)}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded transition-colors"
                            title="Heading 1"
                        >
                            <Heading1 size={16} />
                        </button>
                        <button
                            onClick={() => insertHeading(2)}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded transition-colors"
                            title="Heading 2"
                        >
                            <Heading2 size={16} />
                        </button>
                        <button
                            onClick={() => insertHeading(3)}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded transition-colors"
                            title="Heading 3"
                        >
                            <Heading3 size={16} />
                        </button>
                    </div>

                    <div className="flex items-center gap-0.5 border-r border-white/10 pr-2">
                        <button
                            onClick={() => insertList(false)}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded transition-colors"
                            title="Bullet List"
                        >
                            <List size={16} />
                        </button>
                        <button
                            onClick={() => insertList(true)}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded transition-colors"
                            title="Numbered List"
                        >
                            <ListOrdered size={16} />
                        </button>
                        <button
                            onClick={() => insertFormatting('> ', '', 'quote')}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded transition-colors"
                            title="Quote"
                        >
                            <Quote size={16} />
                        </button>
                    </div>

                    <div className="flex items-center gap-0.5 border-r border-white/10 pr-2">
                        <button
                            onClick={() => insertFormatting('[', '](url)', 'link text')}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded transition-colors"
                            title="Link"
                        >
                            <Link size={16} />
                        </button>
                        <button
                            onClick={() => insertFormatting('![alt](', ')', 'image-url')}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded transition-colors"
                            title="Image"
                        >
                            <Image size={16} />
                        </button>
                        <button
                            onClick={() => insertFormatting('---\n', '', '')}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded transition-colors"
                            title="Horizontal Rule"
                        >
                            <Minus size={16} />
                        </button>
                    </div>

                    {/* Timestamp (only if associated with video) */}
                    {resourceId && currentResource && (
                        <div className="flex items-center gap-0.5">
                            <button
                                onClick={insertTimestamp}
                                className="flex items-center gap-1 px-2 py-1.5 text-xs text-purple-400 hover:text-purple-300 hover:bg-purple-400/10 rounded transition-colors"
                                title="Insert current timestamp"
                            >
                                <Clock size={14} />
                                <span className="hidden sm:inline">Timestamp</span>
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Editor Area */}
            <div className="flex-1 overflow-hidden relative">
                {isPreview ? (
                    <div className="h-full overflow-auto p-6 prose prose-invert prose-sm max-w-none
                        prose-headings:text-slate-200 prose-headings:font-bold
                        prose-h1:text-3xl prose-h1:mb-4 prose-h1:mt-6
                        prose-h2:text-2xl prose-h2:mb-3 prose-h2:mt-5
                        prose-h3:text-xl prose-h3:mb-2 prose-h3:mt-4
                        prose-h4:text-lg prose-h4:mb-2 prose-h4:mt-3
                        prose-h5:text-base prose-h5:mb-2 prose-h5:mt-3
                        prose-h6:text-sm prose-h6:mb-2 prose-h6:mt-3
                        prose-p:text-slate-300 prose-p:leading-relaxed
                        prose-a:text-purple-400 prose-a:no-underline hover:prose-a:underline
                        prose-strong:text-slate-100 prose-strong:font-bold
                        prose-em:text-slate-200 prose-em:italic
                        prose-code:text-purple-300 prose-code:bg-slate-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
                        prose-pre:bg-slate-800 prose-pre:border prose-pre:border-white/10 prose-pre:rounded-lg
                        prose-blockquote:border-l-4 prose-blockquote:border-l-purple-500 prose-blockquote:text-slate-400 prose-blockquote:italic prose-blockquote:pl-4
                        prose-ul:text-slate-300 prose-ol:text-slate-300
                        prose-li:text-slate-300 prose-li:my-1
                        prose-hr:border-slate-700 prose-hr:my-6
                        prose-table:text-slate-300">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {content || '*No content yet*'}
                        </ReactMarkdown>
                    </div>
                ) : (
                    <textarea
                        ref={textareaRef}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Write your thoughts here... Use markdown for formatting.

**Bold** or *italic* text
# Headings
- Lists
> Quotes
`code`

[[WikiLinks]] to connect ideas
"
                        className="w-full h-full bg-transparent p-6 text-slate-300 resize-none focus:outline-none font-mono text-sm leading-relaxed"
                        spellCheck="true"
                    />
                )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2 bg-slate-950/50 text-[10px] text-slate-600 flex justify-between items-center border-t border-white/5">
                <div className="flex items-center gap-4">
                    <span>Markdown Supported</span>
                    <span className="hidden sm:inline">Ctrl+B: Bold | Ctrl+I: Italic | Ctrl+S: Save</span>
                </div>
                <span className="flex items-center gap-1">
                    {lastSaved ? (
                        <>
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                            Saved {lastSaved.toLocaleTimeString()}
                        </>
                    ) : (
                        <>
                            <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse"></span>
                            Unsaved
                        </>
                    )}
                </span>
            </div>
        </div>
    );
};

export default NoteEditor;
