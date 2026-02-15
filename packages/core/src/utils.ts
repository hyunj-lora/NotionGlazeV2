/**
 * Calculates the live site URL for a given tenant.
 * Prioritizes custom domain for PRO plans.
 */
export function getLiveSiteUrl(tenant: any): string {
    if (!tenant) return 'https://notionglaze.cc';

    const isPro = tenant.plan === 'pro';

    if (isPro && tenant.custom_domain) {
        return `https://${tenant.custom_domain}`;
    }

    if (tenant.subdomain) {
        return `https://${tenant.subdomain}.notionglaze.cc`;
    }

    return 'https://notionglaze.cc';
}

export async function fetchDnsJSON(name: string, type: string) {
    try {
        const url = `https://cloudflare-dns.com/dns-query?name=${name}&type=${type}&_t=${Date.now()}`;
        const res = await fetch(url, {
            headers: { 'Accept': 'application/dns-json' }
        });
        return await res.json();
    } catch (e) {
        return null;
    }
}
