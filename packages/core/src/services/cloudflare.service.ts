export interface CustomHostnameResponse {
    success: boolean;
    errors: any[];
    messages: any[];
    result: any;
}

export class CloudflareService {
    private apiToken?: string;
    private zoneId?: string;

    constructor(env: any) {
        this.apiToken = env?.CLOUDFLARE_API_TOKEN;
        this.zoneId = env?.CLOUDFLARE_ZONE_ID;
    }

    private async request(path: string, options: RequestInit = {}): Promise<CustomHostnameResponse> {
        if (!this.apiToken || !this.zoneId) {
            throw new Error('Cloudflare API Token or Zone ID missing');
        }

        const url = `https://api.cloudflare.com/client/v4/zones/${this.zoneId}${path}`;
        const defaultOptions: RequestInit = {
            headers: {
                'Authorization': `Bearer ${this.apiToken}`,
                'Content-Type': 'application/json',
            },
        };

        const response = await fetch(url, { ...defaultOptions, ...options });
        const data = await response.json() as CustomHostnameResponse;

        if (!data.success) {
            console.error('Cloudflare API Error Details:', JSON.stringify(data, null, 2));
        }

        return data;
    }

    async upsertCustomHostname(hostname: string) {
        const payload = {
            hostname: hostname,
            ssl: {
                method: 'txt',
                type: 'dv',
            },
        };

        const existing = await this.request(`/custom_hostnames?hostname=${hostname}`);

        if (existing.result && existing.result.length > 0) {
            const res = await this.request(`/custom_hostnames/${existing.result[0].id}`, {
                method: 'PATCH',
                body: JSON.stringify(payload),
            });
            if (!res.success) {
                if (res.errors?.some(e => e.code === 1460)) {
                    payload.ssl.method = 'cname';
                    return await this.request(`/custom_hostnames/${existing.result[0].id}`, {
                        method: 'PATCH',
                        body: JSON.stringify(payload),
                    });
                }
                throw new Error(`Cloudflare API Error: ${res.errors?.[0]?.message} (${res.errors?.[0]?.code})`);
            }
            return res;
        } else {
            const res = await this.request('/custom_hostnames', {
                method: 'POST',
                body: JSON.stringify(payload),
            });
            if (!res.success) {
                if (res.errors?.some(e => e.code === 1460)) {
                    payload.ssl.method = 'cname';
                    return await this.request('/custom_hostnames', {
                        method: 'POST',
                        body: JSON.stringify(payload),
                    });
                }
                throw new Error(`Cloudflare API Error: ${res.errors?.[0]?.message} (${res.errors?.[0]?.code})`);
            }
            return res;
        }
    }

    async deleteCustomHostname(hostname: string): Promise<CustomHostnameResponse> {
        const existing = await this.request(`/custom_hostnames?hostname=${hostname}`);

        if (existing.result && existing.result.length > 0) {
            const id = existing.result[0].id;
            return await this.request(`/custom_hostnames/${id}`, {
                method: 'DELETE',
            });
        }

        return { success: true, result: null, errors: [], messages: [] };
    }

    async getStatus(hostname: string) {
        try {
            const res = await this.request(`/custom_hostnames?hostname=${hostname}`);

            if (!res.success) {
                const errorMsg = res.errors?.[0]?.message || 'Cloudflare API Error';
                return { error: errorMsg };
            }

            if (!res.result || res.result.length === 0) {
                return {
                    hostname_status: 'not_found',
                    ssl_status: 'not_found'
                };
            }

            const item = res.result[0];
            return {
                id: item.id,
                hostname: item.hostname,
                ssl_status: item.ssl?.status || 'pending',
                ssl_method: item.ssl?.method || 'txt',
                hostname_status: item.status || 'pending',
                verification_errors: item.ssl?.validation_errors || [],
                ownership_verification: item.ownership_verification || null,
                ssl_validation: item.ssl?.validation_records || [],
            };
        } catch (error: any) {
            console.error('CloudflareService.getStatus error:', error);
            return { error: error.message || 'Service Unavailable' };
        }
    }

    async getFallbackOrigin() {
        return await this.request('/custom_hostnames/fallback_origin');
    }

    async updateFallbackOrigin(origin: string) {
        return await this.request('/custom_hostnames/fallback_origin', {
            method: 'PUT',
            body: JSON.stringify({ origin })
        });
    }
}
