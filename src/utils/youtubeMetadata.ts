interface YouTubeVideoInfo {
    title: string;
    thumbnail?: string;
    channelTitle?: string;
    description?: string;
}

interface YouTubePlaylistInfo {
    title: string;
    videoIds: string[];
    videoCount: number;
}

/**
 * Extract YouTube video ID from various URL formats
 */
export const extractYouTubeVideoId = (url: string): string | null => {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
            return match[1];
        }
    }
    return null;
};

/**
 * Extract YouTube playlist ID from URL
 */
export const extractYouTubePlaylistId = (url: string): string | null => {
    const match = url.match(/[?&]list=([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
};

/**
 * Check if URL is a YouTube playlist
 */
export const isYouTubePlaylist = (url: string): boolean => {
    return url.includes('list=') && !url.includes('&index=');
};

/**
 * Fetch YouTube video metadata using oEmbed (no API key needed)
 */
export const fetchYouTubeVideoInfo = async (videoId: string): Promise<YouTubeVideoInfo | null> => {
    try {
        const response = await fetch(
            `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
        );

        if (!response.ok) return null;

        const data = await response.json();

        return {
            title: data.title || 'Unknown Video',
            thumbnail: data.thumbnail_url,
            channelTitle: data.author_name,
            description: ''
        };
    } catch (error) {
        console.error('Failed to fetch YouTube video info:', error);
        return null;
    }
};

/**
 * Fetch YouTube playlist info
 * Note: This requires YouTube API key. For MVP, we'll use a simpler approach.
 */
export const fetchYouTubePlaylistInfo = async (
    _playlistId: string,
    _apiKey?: string
): Promise<YouTubePlaylistInfo | null> => {
    // For now, return null. User can manually add videos from playlist.
    // In production, you'd use YouTube Data API v3
    console.warn('Playlist import requires YouTube API key. Please add videos individually for now.');
    return null;
};

/**
 * Generate auto-tags based on video title and channel
 */
export const generateAutoTags = (title: string, channelTitle?: string): string[] => {
    const tags: string[] = [];

    // Add channel as tag
    if (channelTitle) {
        tags.push(channelTitle.toLowerCase().replace(/\s+/g, '-'));
    }

    // Extract common academic keywords
    const keywords = [
        'tutorial', 'course', 'lecture', 'conference', 'presentation',
        'research', 'thesis', 'analysis', 'review', 'documentary',
        'introduction', 'beginner', 'advanced', 'fundamentals'
    ];

    const lowerTitle = title.toLowerCase();
    keywords.forEach(keyword => {
        if (lowerTitle.includes(keyword)) {
            tags.push(keyword);
        }
    });

    // Limit to 5 tags
    return tags.slice(0, 5);
};
