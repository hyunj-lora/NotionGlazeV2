import { CloudflareService } from './cloudflare.service.js';
import { fetchDnsJSON } from '../utils.js';
import { NOTION_GLAZE_CONFIG, DOMAIN_ERROR_MESSAGES, COMMON_MULTI_SUFFIXES } from '../constants.js';

export interface DnsRecord {
    type: 'A' | 'CNAME' | 'TXT';
    host: string;
    required_value: string;
    current_value: string | null;
    status: 'ACTIVE' | 'PENDING' | 'CONFLICT';
}

export class DomainService {
    private cf: CloudflareService;

    constructor(env: any) {
        this.cf = new CloudflareService(env);
    }

    async getUnifiedStatus(hostname: string) {
        if (!hostname) {
            return { status: 'no_domain' };
        }

        const [cfStatus, dnsData] = await Promise.all([
            this.cf.getStatus(hostname),
            this.fetchDnsRecords(hostname)
        ]);

        if ((cfStatus as any).error) {
            const errorMsg = (cfStatus as any).error;
            throw new Error(this.mapCloudflareError(errorMsg));
        }

        const isPointsToUs = this.checkPointsToUs(dnsData);
        const records = this.generateUnifiedRecords(hostname, cfStatus, dnsData);

        let state = 'PENDING_DNS';
        if (cfStatus.hostname_status === 'active' && cfStatus.ssl_status === 'active') {
            state = 'ACTIVE';
        } else if (isPointsToUs) {
            state = 'UNVERIFIED';
        }

        const isCloudflare = dnsData.ns.some((ns: string) => ns.toLowerCase().includes('cloudflare.com'));
        const isApex = hostname === this.getApexDomain(hostname);
        const advice = [];

        if (isCloudflare && state !== 'ACTIVE') {
            if (isApex) {
                advice.push('Root(@) 도메인을 Cloudflare에서 사용 중입니다. A 레코드 대신 **CNAME Flattening**을 사용하여 `' + NOTION_GLAZE_CONFIG.PROXY_TARGET + '`를 가리키도록 설정해 주세요. (Cloudflare O2O 필수 요건)');
            } else {
                advice.push('도메인이 Cloudflare를 사용 중입니다. 연결이 완료될 때까지 잠시 DNS 설정에서 Proxy(주황색 구름)를 끄고 **DNS Only(회색 구름)**로 유지해 주세요. (Error 1000 방지)');
            }
            advice.push('**중요**: 아래 "Ownership Verification" TXT 레코드를 반드시 등록해야 Cloudflare 간 연결(O2O)이 승인됩니다.');
        }

        const isHealthy = await this.probeConnection(hostname);

        if (!isHealthy && state === 'ACTIVE') {
            advice.push('**연결 상태 확인**: 도메인이 연결되었으나 서버 응답이 지연되고 있습니다.');
            advice.push('1. Cloudflare를 사용 중이시라면 SSL 모드를 **Full (Strict)**로 설정했는지 확인해 주세요.');
            advice.push('2. 시스템에서 O2O(Cloudflare 간 연결) 최적화를 진행 중입니다. 잠시 후 다시 시도해 주세요.');
        }

        if (state.includes('PENDING') || state === 'UNVERIFIED') {
            advice.push('**참고**: Cloudflare의 검증 주기는 실패 시 점차 길어집니다(Backoff). 설정을 고치셨다면 아래 "도메인 재설정" 버튼을 눌러 즉시 재검증을 요청하세요.');
        }

        if (cfStatus.verification_errors && cfStatus.verification_errors.length > 0) {
            cfStatus.verification_errors.forEach((err: any) => {
                if (err.message) advice.push(`**검증 오류**: ${err.message}`);
            });
        }

        return {
            hostname,
            state,
            isHealthy,
            cfStatus,
            dnsData,
            records,
            diagnostics: {
                isCloudflare,
                isO2O: isCloudflare && state !== 'ACTIVE',
                proxyVersion: '2.2.0-o2o-ready',
                advice
            }
        };
    }

    private async fetchDnsRecords(hostname: string) {
        const [a, cname, ns, txt, ovTxt] = await Promise.all([
            fetchDnsJSON(hostname, 'A') as any,
            fetchDnsJSON(hostname, 'CNAME') as any,
            fetchDnsJSON(hostname, 'NS') as any,
            fetchDnsJSON(hostname, 'TXT') as any,
            fetchDnsJSON(`_cf-custom-hostname.${hostname}`, 'TXT') as any
        ]);

        const allTxt = [
            ...(txt?.Answer?.map((r: any) => r.data.replace(/"/g, '')) || []),
            ...(ovTxt?.Answer?.map((r: any) => r.data.replace(/"/g, '')) || [])
        ];

        return {
            a: a?.Answer?.map((r: any) => r.data) || [],
            cname: cname?.Answer?.map((r: any) => r.data) || [],
            ns: ns?.Answer?.map((r: any) => r.data) || [],
            txt: allTxt,
        };
    }

    private checkPointsToUs(dns: any) {
        return dns.cname.some((v: string) => v.includes(NOTION_GLAZE_CONFIG.PROXY_TARGET)) ||
            dns.a.some((ip: string) => NOTION_GLAZE_CONFIG.PROXY_IPS.includes(ip));
    }

    private mapCloudflareError(error: string): string {
        const match = error.match(/\((\d+)\)/);
        const code = match ? match[1] : 'default';
        return DOMAIN_ERROR_MESSAGES[code] || DOMAIN_ERROR_MESSAGES['default'];
    }

    private getApexDomain(hostname: string): string {
        const parts = hostname.split('.');
        if (parts.length <= 2) return hostname;

        const lastTwo = parts.slice(-2).join('.');
        if (COMMON_MULTI_SUFFIXES.includes(lastTwo)) {
            return parts.slice(-3).join('.');
        }

        return parts.slice(-2).join('.');
    }

    private generateUnifiedRecords(hostname: string, cfStatus: any, dnsData: any): DnsRecord[] {
        const records: DnsRecord[] = [];
        const apexDomain = this.getApexDomain(hostname);
        const isApex = hostname === apexDomain;

        const getRelativeHost = (full: string) => {
            if (full === apexDomain) return '@';
            if (full.endsWith(`.${apexDomain}`)) {
                return full.replace(`.${apexDomain}`, '');
            }
            return full;
        };

        const isCloudflare = dnsData.ns.some((ns: string) => ns.toLowerCase().includes('cloudflare.com'));

        if (isApex && isCloudflare) {
            const matchesProxyIp = dnsData.a.some((ip: string) => NOTION_GLAZE_CONFIG.PROXY_IPS.includes(ip));
            records.push({
                type: 'CNAME',
                host: '@',
                required_value: NOTION_GLAZE_CONFIG.PROXY_TARGET,
                current_value: dnsData.cname[0] || (matchesProxyIp ? '(Flattened)' : null),
                status: (dnsData.cname.includes(NOTION_GLAZE_CONFIG.PROXY_TARGET) || matchesProxyIp) ? 'ACTIVE' : 'PENDING'
            });
        } else if (isApex) {
            records.push({
                type: 'A',
                host: '@',
                required_value: NOTION_GLAZE_CONFIG.PROXY_IPS[0],
                current_value: dnsData.a[0] || null,
                status: dnsData.a.some((ip: string) => NOTION_GLAZE_CONFIG.PROXY_IPS.includes(ip)) ? 'ACTIVE' : 'PENDING'
            });
        } else {
            records.push({
                type: 'CNAME',
                host: getRelativeHost(hostname),
                required_value: NOTION_GLAZE_CONFIG.PROXY_TARGET,
                current_value: dnsData.cname[0] || null,
                status: dnsData.cname.includes(NOTION_GLAZE_CONFIG.PROXY_TARGET) ? 'ACTIVE' : 'PENDING'
            });
        }

        if (cfStatus.ssl_validation && cfStatus.ssl_validation.length > 0) {
            cfStatus.ssl_validation.forEach((v: any) => {
                let type: 'CNAME' | 'TXT' | 'A' = 'CNAME';
                if (v.method === 'txt') type = 'TXT';
                if (v.method === 'cname') type = 'CNAME';

                records.push({
                    type,
                    host: getRelativeHost(v.hostname),
                    required_value: v.value,
                    current_value: null,
                    status: cfStatus.ssl_status === 'active' ? 'ACTIVE' : 'PENDING'
                });
            });
        }

        if (cfStatus.ownership_verification) {
            const ov = cfStatus.ownership_verification;
            const recordsToMatch = dnsData.txt;

            records.push({
                type: ov.type.toUpperCase() as any,
                host: getRelativeHost(ov.name),
                required_value: ov.value,
                current_value: recordsToMatch.includes(ov.value) ? ov.value : null,
                status: (cfStatus.hostname_status === 'active' || recordsToMatch.includes(ov.value)) ? 'ACTIVE' : 'PENDING'
            });
        }

        return records;
    }

    async resetDomain(hostname: string) {
        await this.cf.deleteCustomHostname(hostname);
        return await this.cf.upsertCustomHostname(hostname);
    }

    async probeConnection(hostname: string): Promise<boolean> {
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 5000);

            const res = await fetch(`https://${hostname}/_notion_glaze_health`, {
                method: 'GET',
                signal: controller.signal
            });

            clearTimeout(timeout);
            return res.ok;
        } catch (e) {
            return false;
        }
    }
}
