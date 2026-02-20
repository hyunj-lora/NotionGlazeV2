/// <reference types="astro/client" />

import type { Tenant, SiteConfig } from "@notionglaze/core";

interface CloudflareRuntime {
    env: {
        DB: D1Database;
        ENCRYPTION_SECRET: string;
        PADDLE_CLIENT_TOKEN: string;
        PADDLE_ENVIRONMENT: string;
        PADDLE_PRO_MONTHLY_PRICE_ID: string;
        PADDLE_PRO_ANNUALLY_PRICE_ID: string;
        NOTION_CLIENT_ID: string;
        NOTION_CLIENT_SECRET: string;
        NOTION_REDIRECT_URI: string;
    };
    context: {
        waitUntil(promise: Promise<any>): void;
    };
}

declare global {
    namespace App {
        interface Locals {
            userId: string | null;
            tenantId: string | null;
            tenant?: Tenant | null;
            siteConfig?: SiteConfig;
            isSystemDomain: boolean;
            isDashboardDomain: boolean;
            hostResolutionMethod: string;
            pendingAuthCookies?: { name: string; value: string; attributes: string }[];
            blogTenantId?: string | null;
            tenantPlan?: string;
            internalRewrite?: string;
            runtime: CloudflareRuntime;
            auth: () => Promise<any>;
        }
    }
}
