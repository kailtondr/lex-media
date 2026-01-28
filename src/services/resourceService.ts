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

        let finalTitle = title || parsed.originalUrl;
        let finalTags = [...tags];

        // If it's a YouTube video, fetch metadata
        if (parsed.type === 'youtube' && parsed.id) {
            try {
                const { fetchYouTubeVideoInfo, generateAutoTags } = await import('../utils/youtubeMetadata');
                const videoInfo = await fetchYouTubeVideoInfo(parsed.id);

                if (videoInfo) {
                    // Use fetched title if user didn't provide one
                    if (!title) {
                        finalTitle = videoInfo.title;
                    }

                    // Generate auto-tags
                    const autoTags = generateAutoTags(videoInfo.title, videoInfo.channelTitle);
                    finalTags = [...new Set([...finalTags, ...autoTags])]; // Merge and dedupe
                }
            } catch (error) {
                console.error('Failed to fetch YouTube metadata:', error);
                // Continue with original URL as fallback
            }
        }

        const resourceData: Omit<Resource, 'id'> = {
            userId,
            title: finalTitle,
            originalUrl: parsed.originalUrl,
            processedUrl: parsed.processedUrl,
            sourceType: parsed.type,
            status: 'new',
            progress: {
                playedSeconds: 0,
                totalSeconds: 0,
                lastUpdated: Timestamp.now()
            },
            tags: finalTags,
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
