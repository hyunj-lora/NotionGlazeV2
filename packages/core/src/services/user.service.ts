export interface User {
    id: string;
    notion_user_id: string;
    email?: string;
    name?: string;
    avatar_url?: string;
    created_at?: string;
    updated_at?: string;
}

export class UserService {
    constructor(private db: D1Database) {}

    async getUserByNotionId(notionUserId: string): Promise<User | null> {
        return await this.db
            .prepare("SELECT * FROM users WHERE notion_user_id = ?")
            .bind(notionUserId)
            .first();
    }

    async getUserById(id: string): Promise<User | null> {
        return await this.db
            .prepare("SELECT * FROM users WHERE id = ?")
            .bind(id)
            .first();
    }

    async createUser(user: { id: string; notion_user_id: string; email?: string; name?: string; avatar_url?: string }): Promise<void> {
        await this.db
            .prepare(`
                INSERT INTO users (id, notion_user_id, email, name, avatar_url)
                VALUES (?, ?, ?, ?, ?)
            `)
            .bind(user.id, user.notion_user_id, user.email || null, user.name || null, user.avatar_url || null)
            .run();
    }

    async updateUser(id: string, updates: { email?: string; name?: string; avatar_url?: string }): Promise<void> {
        await this.db
            .prepare(`
                UPDATE users
                SET email = ?, name = ?, avatar_url = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `)
            .bind(updates.email || null, updates.name || null, updates.avatar_url || null, id)
            .run();
    }
}
