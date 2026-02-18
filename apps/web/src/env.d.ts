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
            pendingSessionId?: string;
            blogTenantId?: string | null;
            tenantPlan?: string;
            internalRewrite?: string;
            runtime?: CloudflareRuntime;
        }
    }
}
