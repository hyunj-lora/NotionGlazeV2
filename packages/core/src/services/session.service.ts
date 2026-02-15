export interface Session {
    user_id: string;
    expires_at: string;
}

export class SessionService {
    constructor(private db: D1Database) { }

    async getSession(sessionId: string): Promise<Session | null> {
        return await this.db
            .prepare("SELECT user_id, expires_at FROM sessions WHERE id = ?")
            .bind(sessionId)
            .first();
    }

    async createSession(sessionId: string, userId: string, expiresAt: string): Promise<void> {
        await this.db
            .prepare("INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)")
            .bind(sessionId, userId, expiresAt)
            .run();
    }

    async getUserByNotionId(notionUserId: string): Promise<{ id: string } | null> {
        return await this.db
            .prepare("SELECT id FROM users WHERE notion_user_id = ?")
            .bind(notionUserId)
            .first();
    }
}
