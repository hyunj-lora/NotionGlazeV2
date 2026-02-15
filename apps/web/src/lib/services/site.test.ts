import { describe, it, expect } from 'vitest';
import { getLiveSiteUrl } from './site';

describe('getLiveSiteUrl', () => {
    it('should return default URL if tenant is missing', () => {
        expect(getLiveSiteUrl(null)).toBe('https://notionglaze.cc');
    });

    it('should return custom domain for pro plans with domain', () => {
        const tenant = { plan: 'pro', custom_domain: 'example.com' };
        expect(getLiveSiteUrl(tenant)).toBe('https://example.com');
    });

    it('should return subdomain for plans without custom domain', () => {
        const tenant = { plan: 'free', subdomain: 'test' };
        expect(getLiveSiteUrl(tenant)).toBe('https://test.notionglaze.cc');
    });

    it('should return default URL if no subdomain and no custom domain', () => {
        const tenant = { plan: 'free' };
        expect(getLiveSiteUrl(tenant)).toBe('https://notionglaze.cc');
    });
});
