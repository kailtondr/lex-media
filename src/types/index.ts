import { Timestamp } from 'firebase/firestore';

export type ResourceType = 'youtube' | 'drive' | 'nextcloud' | 'podcast' | 'unknown';
export type ResourceStatus = 'new' | 'in_progress' | 'watched';

export interface Resource {
    id: string;
    userId: string;
    title: string;
    originalUrl: string;
    processedUrl: string;
    sourceType: ResourceType;
    status: ResourceStatus;
    progress: {
        playedSeconds: number;
        totalSeconds: number;
        lastUpdated: Timestamp;
    };
    tags: string[];
    dateAdded: Timestamp;
}

export interface Note {
    id: string;
    userId: string;
    resourceId?: string; // Optional, can be global or tied to resource
    title: string;
    content: string; // Markdown
    linkedResourceIds: string[]; // For Graph: IDs of resources mentioned
    tags: string[];
    isTranscript: boolean;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface GraphNode {
    id: string;
    name: string;
    type: 'resource' | 'note';
    val: number; // For visualization size
    group: number; // For coloration
}

export interface GraphLink {
    source: string;
    target: string;
}

export interface GraphData {
    nodes: GraphNode[];
    links: GraphLink[];
}
