
import { describe, it, expect } from 'vitest';
import { resolvePostTheme, resolveSiteTheme } from './themes.js';

describe('Theme Resolution', () => {
    describe('resolvePostTheme', () => {
        it('should return defaultTheme if no tags provided', () => {
            expect(resolvePostTheme([], 'notion')).toBe('notion');
        });

        it('should resolved "tech" keywords to "notion" (Bootstrap default)', () => {
            expect(resolvePostTheme(['coding', 'it'], 'zero')).toBe('notion');
        });

        it('should resolve "design" keywords to "zero"', () => {
            expect(resolvePostTheme(['design', 'ux'], 'notion')).toBe('zero');
        });

        it('should fallback to default if no keywords match', () => {
            expect(resolvePostTheme(['random-tag'], 'notion')).toBe('notion');
        });
    });

    describe('resolveSiteTheme', () => {
        it('should enforce "notion" for non-pro (free) plans regardless of config', () => {
            const result = resolveSiteTheme({
                config: { site_theme: 'zero', enable_tag_based_themes: true },
                tenant: { plan: 'free' },
                tags: ['design']
            });
            expect(result).toBe('notion');
        });

        it('should respect site_theme for pro plans', () => {
            const result = resolveSiteTheme({
                config: { site_theme: 'zero' },
                tenant: { plan: 'pro' }
            });
            expect(result).toBe('zero');
        });

        it('should allow tag-based switching for pro plans', () => {
            const result = resolveSiteTheme({
                config: { site_theme: 'notion', enable_tag_based_themes: true },
                tenant: { plan: 'pro' },
                tags: ['design']
            });
            expect(result).toBe('zero');
        });

        it('should use "notion" as total fallback if no config or plan info', () => {
            const result = resolveSiteTheme({
                config: {},
                tenant: null
            });
            expect(result).toBe('notion');
        });
    });
});
