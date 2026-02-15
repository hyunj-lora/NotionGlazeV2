import { CloudflareService } from './apps/web/src/lib/services/cloudflare';

const env = {
  CLOUDFLARE_API_TOKEN: process.env.CLOUDFLARE_API_TOKEN,
  CLOUDFLARE_ZONE_ID: process.env.CLOUDFLARE_ZONE_ID
};

async function inspect() {
    const cf = new CloudflareService(env as any);
    const domain = 'humanerd.kr';
    console.log(`Inspecting ${domain}...`);
    const res = await (cf as any).request(\`/custom_hostnames?hostname=\${domain}\`);
    console.log(JSON.stringify(res, null, 2));
}

inspect();
