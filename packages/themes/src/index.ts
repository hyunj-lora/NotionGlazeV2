// Theme Registry & Dynamic Loader
export const THEMES = [
    'notion',
    'zero'
] as const;

export type ThemeName = typeof THEMES[number];

/**
 * Dynamic registry of theme renderers.
 * This allows Astro to only load the code for the selected theme.
 */
export const RENDERERS: Record<ThemeName, () => Promise<any>> = {
    notion: () => import('./notion/Renderer.astro'),
    zero: () => import('./zero/Renderer.astro'),
};

/**
 * Dynamic registry of theme post cards.
 */
export const POST_CARDS: Record<ThemeName, () => Promise<any>> = {
    notion: () => import('./notion/PostCard.astro'),
    zero: () => import('./zero/PostCard.astro'),
};

/**
 * Dynamic registry of theme full-page home views.
 */
export const HOME_VIEWS: Record<ThemeName, () => Promise<any>> = {
    notion: () => import('./notion/HomeView.astro'),
    zero: () => import('./zero/HomeView.astro'),
};

/**
 * Dynamic registry of theme full-page post views.
 */
export const POST_VIEWS: Record<ThemeName, () => Promise<any>> = {
    notion: () => import('./notion/PostView.astro'),
    zero: () => import('./zero/PostView.astro'),
};

export * from './configs';
