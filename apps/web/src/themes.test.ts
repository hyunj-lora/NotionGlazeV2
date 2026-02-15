import { describe, it, expect } from 'vitest';
import { resolvePostTheme } from '@notionglaze/core';
import { THEME_CONFIGS, THEMES } from '@notionglaze/themes';



describe('Theme Logic TDD', () => {
    describe('Theme Resolution', () => {
        it('should resolve default theme when no tags provided', () => {
            expect(resolvePostTheme([], 'notion')).toBe('notion');
            expect(resolvePostTheme([], 'zero')).toBe('zero');
        });

        it('should resolve theme from tags', () => {
            // 'brutal' and 'design' tags resolve to 'zero'
            expect(resolvePostTheme(['brutal'], 'notion')).toBe('zero');
            expect(resolvePostTheme(['design'], 'notion')).toBe('zero');
            // 'tech' and 'writing' tags resolve to 'notion'
            expect(resolvePostTheme(['tech', 'writing'], 'zero')).toBe('notion');
        });

        it('should fallback to default if tag not mapped', () => {
            expect(resolvePostTheme(['unknown-tag'], 'notion')).toBe('notion');
        });
    });

    describe('THEME_CONFIGS Coverage', () => {
        it('should have a config for every defined theme', () => {
            THEMES.forEach(theme => {
                expect(THEME_CONFIGS[theme]).toBeDefined();
                expect(THEME_CONFIGS[theme].colors.background.light).toMatch(/^#[0-9a-fA-F]{6}$/);
            });
        });
    });

    describe('Layout Class Calculation', () => {
        const getLayoutBodyClass = (theme: string) => {
            return `notion-glaze-theme-${theme}`;
        };

        it('should generate the correct body class for a theme', () => {
            expect(getLayoutBodyClass('notion')).toBe('notion-glaze-theme-notion');
            expect(getLayoutBodyClass('zero')).toBe('notion-glaze-theme-zero');
        });
    });

    describe('Theme RGB Logic', () => {
        const hexToRgb = (hex: string) => {
            if (!hex.startsWith("#")) return "99, 102, 241";
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return `${r}, ${g}, ${b}`;
        };

        it('should correctly convert hex to rgb string', () => {
            expect(hexToRgb('#ffffff')).toBe('255, 255, 255');
            expect(hexToRgb('#000000')).toBe('0, 0, 0');
            expect(hexToRgb('#6366f1')).toBe('99, 102, 241');
        });

        it('should return default for invalid hex', () => {
            expect(hexToRgb('invalid')).toBe('99, 102, 241');
        });
    });
});

