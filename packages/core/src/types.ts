export interface NotionPost {
    id: string;
    tenantId: string;
    slug: string;
    title: string;
    summary: string | null;
    tags: string[];
    contentJson: string;
    coverImageUrl: string | null;
    publishedAt: number | null;
    lastEditedTime: number;
    status: string;
    notionUrl: string | null;
    icon: string | null;
    createdTime: number;
    archived: boolean;
    inTrash: boolean;
    canonicalUrl: string | null;
    noindex: boolean;
    aiSeoStatus: 'pending' | 'completed' | 'skipped' | 'failed';
    aiSeoAdvice: string | null;
}

export interface NotionBlock {
    id: string;
    postId: string;
    tenantId: string;
    parentId: string | null;
    type: string;
    contentJson: string;
    createdTime: number;
    lastEditedTime: number;
    orderIndex: number;
}

export type BillingPlan = "trial" | "pro" | "free" | "enterprise";
export type SubscriptionStatus = "active" | "past_due" | "canceled" | "deleted" | "trialing" | "paused";

export interface Tenant {
    id: string;
    owner_id: string;
    root_page_id: string | null;
    notion_access_token: string | null;
    custom_domain: string | null;
    subdomain: string | null;
    config_json: string | null;
    plan: BillingPlan;
    subscription_status?: SubscriptionStatus;
    subscription_id?: string;
    subscription_ends_at?: number | null;
    trial_ends_at: number | null;
    sync_status: "idle" | "syncing" | "error" | "success";
    sync_progress: number;
    last_sync_at: number | null;
    last_token_check_at?: string | null; // ISO timestamp of last token validation
}

export interface SyncContext {
    requestCount: number;
}

export interface SiteConfig {
    site_name?: string;
    site_description?: string;
    favicon_url?: string;
    brand_color?: string;
    site_theme?: string;
    site_appearance?: string;
    site_font?: string;
    border_radius?: string;
    content_width?: string;
    home_page_id?: string;
    enable_tag_based_themes?: boolean;
    navigation?: Array<{
        label: string;
        type: string;
        value: string;
    }>;
    custom_head_scripts?: string;
    custom_css?: string;
    user_analytics_id?: string;
    social_links?: Record<string, string>;
    visible_social_platforms?: string[];
    social_title?: string;
    social_description?: string;
    og_image?: string;
    twitter_card_type?: string;
    twitter_handle?: string;
}

export interface DatabaseSchema {
    [key: string]: {
        type: string;
        name: string;
        options?: Array<{ name: string; color: string }>;
    };
}

export interface EnrichedDatabase {
    id: string;
    title: string;
    description?: string;
    schema: DatabaseSchema;
    rows: Array<{
        id: string;
        icon: string | null;
        cover: string | null;
        properties: Record<string, any>;
        url: string;
    }>;
}
