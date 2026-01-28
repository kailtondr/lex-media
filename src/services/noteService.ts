import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    getDocs,
    getDoc,
    query,
    where,
    orderBy,
    Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import type { Note } from '../types';
import { extractWikiLinks } from '../utils/wikiParser';

const USERS_COLLECTION = 'users';

export const noteService = {
    // Add Note
    addNote: async (userId: string, title: string, content: string, resourceId?: string) => {
        const noteData: Omit<Note, 'id'> = {
            userId,
            title: title || 'Untitled Note',
            content,
            resourceId,
            linkedResourceIds: extractWikiLinks(content), // Parse links
            tags: [],
            isTranscript: false,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        };

        const notesRef = collection(db, USERS_COLLECTION, userId, 'notes');
        const docRef = await addDoc(notesRef, noteData);
        return { id: docRef.id, ...noteData };
    },

    // Get Notes (All or by Resource)
    getNotes: async (userId: string, resourceId?: string) => {
        const notesRef = collection(db, USERS_COLLECTION, userId, 'notes');
        let q = query(notesRef, orderBy('updatedAt', 'desc'));

        if (resourceId) {
            q = query(notesRef, where('resourceId', '==', resourceId), orderBy('updatedAt', 'desc'));
        }

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Note));
    },

    // Get Single Note
    getNote: async (userId: string, noteId: string) => {
        const noteRef = doc(db, USERS_COLLECTION, userId, 'notes', noteId);
        const snapshot = await getDoc(noteRef);
        return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } as Note : null;
    },

    // Update Note
    updateNote: async (userId: string, noteId: string, content: string, title?: string) => {
        const noteRef = doc(db, USERS_COLLECTION, userId, 'notes', noteId);
        const updates: any = {
            content,
            updatedAt: Timestamp.now()
        };
        if (title) updates.title = title;

        updates.linkedResourceIds = extractWikiLinks(content);

        await updateDoc(noteRef, updates);
    },

    // Delete Note
    deleteNote: async (userId: string, noteId: string) => {
        const noteRef = doc(db, USERS_COLLECTION, userId, 'notes', noteId);
        await deleteDoc(noteRef);
    }
};
