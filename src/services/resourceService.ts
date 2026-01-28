import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    query,
    orderBy,
    Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import type { Resource, ResourceStatus } from '../types';
import { parseLink } from '../utils/linkParser';

const USERS_COLLECTION = 'users'; // Root collection
// Sub-collection pattern: users/{userId}/resources

export const resourceService = {
    // Add a new resource
    addResource: async (userId: string, url: string, title?: string, tags: string[] = []) => {
        const parsed = parseLink(url);

        // Basic Metadata Fetching Simulation
        // In a real app, we might call an edge function to fetch YouTube titles, etc.
        const resourceData: Omit<Resource, 'id'> = {
            userId,
            title: title || parsed.originalUrl, // Fallback to URL if no title
            originalUrl: parsed.originalUrl,
            processedUrl: parsed.processedUrl,
            sourceType: parsed.type,
            status: 'new',
            progress: {
                playedSeconds: 0,
                totalSeconds: 0,
                lastUpdated: Timestamp.now()
            },
            tags,
            dateAdded: Timestamp.now()
        };

        const resourcesRef = collection(db, USERS_COLLECTION, userId, 'resources');
        const docRef = await addDoc(resourcesRef, resourceData);
        return { id: docRef.id, ...resourceData };
    },

    // Get all resources for a user
    getUserResources: async (userId: string, statusFilter?: ResourceStatus) => {
        const resourcesRef = collection(db, USERS_COLLECTION, userId, 'resources');
        // Fetch all and filter client-side to avoid composite index requirement
        const q = query(resourcesRef, orderBy('dateAdded', 'desc'));

        const snapshot = await getDocs(q);
        let resources = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Resource));

        // Client-side filter
        if (statusFilter) {
            resources = resources.filter(r => r.status === statusFilter);
        }

        return resources;
    },

    // Get single resource
    getResource: async (userId: string, resourceId: string) => {
        const resourceRef = doc(db, USERS_COLLECTION, userId, 'resources', resourceId);
        const snapshot = await getDoc(resourceRef);
        if (snapshot.exists()) {
            return { id: snapshot.id, ...snapshot.data() } as Resource;
        }
        return null;
    },

    // Update resource status or progress
    updateProgress: async (userId: string, resourceId: string, playedSeconds: number, totalSeconds: number) => {
        const resourceRef = doc(db, USERS_COLLECTION, userId, 'resources', resourceId);

        let status: ResourceStatus = 'in_progress';
        if (playedSeconds === 0) status = 'new';
        if (totalSeconds > 0 && playedSeconds >= totalSeconds * 0.95) status = 'watched'; // 95% threshold

        await updateDoc(resourceRef, {
            'progress.playedSeconds': playedSeconds,
            'progress.totalSeconds': totalSeconds,
            'progress.lastUpdated': Timestamp.now(),
            status
        });
    },

    // Delete resource
    deleteResource: async (userId: string, resourceId: string) => {
        const resourceRef = doc(db, USERS_COLLECTION, userId, 'resources', resourceId);
        await deleteDoc(resourceRef);
    }
};
