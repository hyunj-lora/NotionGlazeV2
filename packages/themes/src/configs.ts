import type { ThemeName } from './index';

export interface ThemeConfig {
    name: ThemeName;
    colors: {
        background: {
            light: string;
            dark: string;
        };
        text: {
            light: string;
            dark: string;
        };
        primary: string;
    };
    fonts?: {
        heading?: string;
        body?: string;
    };
}

export const THEME_CONFIGS: Record<ThemeName, ThemeConfig> = {
    notion: {
        name: 'notion',
        colors: {
            background: { light: '#ffffff', dark: '#191919' },
            text: { light: '#37352f', dark: 'rgba(255, 255, 255, 0.9)' },
            primary: '#2383e2'
        }
    },
    zero: {
        name: 'zero',
        colors: {
            background: { light: '#ffffff', dark: '#000000' },
            text: { light: '#0f172a', dark: '#f8fafc' },
            primary: '#6366f1'
        }
    }
};
