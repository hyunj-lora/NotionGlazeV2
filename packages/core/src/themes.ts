/**
 * Logic to determine the best theme for a post or site
 */

const THEME_MAPPING: Record<string, string> = {
    // Notion-like (Simple, Text-focused)
    'notion': 'notion',
    'tech': 'notion',
    'development': 'notion',
    'coding': 'notion',
    'engineering': 'notion',
    'it': 'notion',
    'software': 'notion',
    'essay': 'notion',
    'writing': 'notion',
    'thought': 'notion',
    'minimal': 'notion',
    'simple': 'notion',
    'life': 'notion',
    'paper': 'notion',
    'news': 'notion',
    'editorial': 'notion',
    'report': 'notion',
    'zen': 'notion',
    'meditation': 'notion',
    'wellness': 'notion',
    'terminal': 'notion',
    'log': 'notion',

    // Zero-like (Premium, Custom)
    'zero': 'zero',
    'premium': 'zero',
    'design': 'zero',
    'visual': 'zero',
    'work': 'zero',
    'portfolio': 'zero',
    'gallery': 'zero',
    'photo': 'zero',
    'photography': 'zero',
    'brutal': 'zero',
    'glass': 'zero',
    'future': 'zero'
};

/**
 * Resolves the theme for a specific post based on its tags/categories
 * @param tags Array of Notion tags
 * @param defaultTheme The site-wide default theme
 */
export function resolvePostTheme(tags: string[] = [], defaultTheme: string = 'notion'): string {
    if (!tags || tags.length === 0) return defaultTheme;

    // Check each tag against our mapping
    for (const tag of tags) {
        const normalizedTag = tag.toLowerCase().trim();
        if (THEME_MAPPING[normalizedTag]) {
            return THEME_MAPPING[normalizedTag];
        }
    }

    return defaultTheme;
}

/**
 * Higher-level site theme resolution logic.
 * Handles Pro-plan checks and tag-based switching.
 */
export function resolveSiteTheme(params: {
    config: any;
    tenant: any;
    tags?: string[];
}): string {
    const { config, tenant, tags = [] } = params;

    // 1. Identify the default theme (Site setting vs Bootstrap fallback)
    const defaultTheme = config.site_theme || "notion";

    // 2. Enforce 'notion' for non-pro plans (Bootstrap strategy)
    const effectiveDefault = tenant?.plan === "pro" ? defaultTheme : "notion";

    // 3. Resolve tag-based theme if enabled (Pro only)
    if (config.enable_tag_based_themes && tenant?.plan === "pro" && tags.length > 0) {
        return resolvePostTheme(tags, effectiveDefault);
    }

    return effectiveDefault;
}
