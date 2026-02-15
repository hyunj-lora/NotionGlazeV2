/**
 * Shared utility functions for theme block components
 */

/**
 * Safely extracts media URL from Notion content
 * @param content - Notion block content
 * @returns Media URL or null if not found
 */
export function getMediaUrl(content: any): string | null {
    const url = content?.url || content?.file?.url || content?.external?.url;

    if (!url) {
        console.warn('Media URL not found in content:', content);
        return null;
    }

    // Validate URL format
    if (url.startsWith('/')) {
        return url;
    }

    try {
        const urlObj = new URL(url);
        if (!['http:', 'https:'].includes(urlObj.protocol)) {
            console.warn('Invalid protocol:', urlObj.protocol);
            return null;
        }
        return url;
    } catch (error) {
        console.error('Invalid URL:', url, error);
        return null;
    }
}

/**
 * Extracts caption text from Notion content
 * @param content - Notion block content
 * @returns Caption text or empty string
 */
export function getCaption(content: any): string {
    if (!content?.caption || !Array.isArray(content.caption)) {
        return '';
    }

    return content.caption
        .map((item: any) => item?.plain_text || '')
        .join('')
        .trim();
}

/**
 * Validates and sanitizes embed URLs
 * Only allows trusted domains for iframe embedding
 * @param url - URL to validate
 * @returns true if URL is from allowed domain
 */
export function validateEmbedUrl(url: string): boolean {
    const allowedDomains = [
        // Video platforms
        'youtube.com',
        'youtu.be',
        'vimeo.com',

        // Code platforms
        'codepen.io',
        'codesandbox.io',
        'jsfiddle.net',
        'stackblitz.com',

        // Design platforms
        'figma.com',

        // Documents & Maps
        'google.com',
        'docs.google.com',
        'drive.google.com',

        // Social
        'twitter.com',
        'x.com',
        'instagram.com',

        // Other
        'soundcloud.com',
        'spotify.com',
    ];

    try {
        const urlObj = new URL(url);

        // Check protocol
        if (!['http:', 'https:'].includes(urlObj.protocol)) {
            console.warn('Invalid embed protocol:', urlObj.protocol);
            return false;
        }

        // Check domain
        const isAllowed = allowedDomains.some(domain =>
            urlObj.hostname === domain || urlObj.hostname.endsWith('.' + domain)
        );

        if (!isAllowed) {
            console.warn('Embed domain not in whitelist:', urlObj.hostname);
        }

        return isAllowed;
    } catch (error) {
        console.error('Invalid embed URL:', url, error);
        return false;
    }
}

/**
 * Gets appropriate sandbox attributes for iframe
 * @returns Space-separated sandbox attribute values
 */
export function getIframeSandbox(): string {
    return 'allow-scripts allow-same-origin allow-presentation allow-forms';
}
