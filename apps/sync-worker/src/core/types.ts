export interface NotionPost {
    id: string;
    tenantId: string;
    slug: string;
    title: string;
    contentJson: string;
    coverImageUrl: string | null;
    lastEditedTime: number;
}

export interface NotionTenant {
    id: string;
    rootPageId: string;
    accessToken: string;
    customDomain?: string;
}
