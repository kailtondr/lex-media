export type ResourceType = 'youtube' | 'drive' | 'nextcloud' | 'podcast' | 'unknown';

export interface ParsedLink {
    originalUrl: string;
    processedUrl: string;
    type: ResourceType;
    id?: string;
}

export const parseLink = (url: string): ParsedLink => {
    let type: ResourceType = 'unknown';
    let processedUrl = url;
    let id: string | undefined;

    if (url.includes('youtube.com') || url.includes('youtu.be')) {
        type = 'youtube';
        // react-player handles youtube URLs directly, no complex parsing needed usually,
        // but we might want to extract ID for thumbnails later.
    } else if (url.includes('drive.google.com')) {
        type = 'drive';
        // Extract ID. Patterns: /file/d/ID/view or id=ID
        const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);
        if (match && match[1]) {
            id = match[1];
            // Convert to direct download/stream link if possible,
            // or use the proxy url format: https://drive.google.com/uc?export=download&id=ID
            // Note: large files might hit quotas on 'uc' export.
            // For now, let's try the 'uc' method as a default per the prompt.
            processedUrl = `https://drive.google.com/uc?export=download&id=${id}`;
        }
    } else if (url.includes('/s/') && !url.includes('drive.google.com')) {
        // Rudimentary check for Nextcloud shared links which often have /s/
        // User said: "Ajouter /download à la fin du lien de partage public"
        type = 'nextcloud';
        if (!url.endsWith('/download')) {
            processedUrl = url.replace(/\/+$/, '') + '/download';
        }
    }

    return {
        originalUrl: url,
        processedUrl,
        type,
        id
    };
};
