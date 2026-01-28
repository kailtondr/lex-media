
export const extractWikiLinks = (text: string): string[] => {
    const regex = /\[\[(.*?)\]\]/g;
    const matches: string[] = [];
    let match;
    while ((match = regex.exec(text)) !== null) {
        // match[1] contains the text inside brackets
        matches.push(match[1]);
    }
    return matches;
};
