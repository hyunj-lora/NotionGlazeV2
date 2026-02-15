/**
 * NotionGlaze Project Constants
 * Centralizing these ensures consistency between backend logic and frontend UI.
 */

export const NOTION_GLAZE_CONFIG = {
    // SaaS Infrastructure
    PROXY_TARGET: 'proxy.notionglaze.cc',
    PROXY_IPS: [
        '104.21.76.150',
        '172.67.196.65'
    ],

    // Domain Defaults
    DEFAULT_SUBDOMAIN_SUFFIX: 'notionglaze.cc',

    // Infrastructure
    DNS_QUERY_URL: 'https://cloudflare-dns.com/dns-query',

    // UI Notification Strings
    ADVICE_TITLES: {
        CONNECTED: 'Connected',
        SECURITY_LOCK: 'Cloudflare Security Lock',
        SETUP_REQUIRED: 'DNS Setup Required',
        VERIFYING: 'Verifying...'
    }
};

export const DOMAIN_STATES = {
    ACTIVE: 'ACTIVE',
    PENDING: 'PENDING',
    O2O_READY: 'O2O_READY',
    O2O_DEADLOCK: 'O2O_DEADLOCK',
    ERROR: 'ERROR'
};

export const DOMAIN_ERROR_MESSAGES: Record<string, string> = {
    '1001': '이미 다른 사용자가 등록한 도메인입니다. 본인 소유가 맞다면 관리자에게 문의하세요.',
    '1002': '존재하지 않는 도메인입니다. 도메인 이름을 확인해 주세요.',
    '1014': 'Cross-User Banned (1014): 고객의 Cloudflare 계정과 서비스 계정 간의 CNAME 연결이 차단되었습니다. Custom Hostname 등록이 완료되면 자동으로 해결됩니다.',
    '1025': '도메인 형식이 올바르지 않습니다.',
    '1406': 'Duplicate Custom Hostname (1406): 다른 SaaS에서 사용 중인 도메인입니다. 아래 TXT 레코드를 등록하면 저희 서비스로 소유권이 "탈취(Liberate)"됩니다.',
    '1451': 'CAA 레코드가 인증서 발급을 차단하고 있습니다. DNS에서 CAA 레코드를 확인하거나 삭제해 주세요.',
    '1460': 'Cloudflare를 사용하는 도메인입니다. DNS 설정에서 "Proxy"를 잠시 끄거나(회색 구름), TXT 대신 CNAME 검증을 기다려 주세요.',
    '1466': '도메인이 아직 당사 시스템을 가리키고 있지 않습니다. CNAME 레코드 설정을 확인해 주세요.',
    'default': '도메인 설정 중 알 수 없는 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.'
};

export const COMMON_MULTI_SUFFIXES = [
    'co.kr', 'com.kr', 'net.kr', 'or.kr',
    'co.uk', 'org.uk', 'me.uk',
    'com.au', 'net.au',
    'github.io', 'pages.dev'
];
