import { SessionService } from './session.service.js';
import { UserService } from './user.service.js';

export interface AuthCookie {
    name: string;
    value: string;
    attributes: string;
}

export interface AuthResult {
    sessionId: string;
    userId: string;
    cookies: AuthCookie[];
}

export class AuthService {
    private sessionService: SessionService;
    private userService: UserService;

    constructor(private db: D1Database) {
        this.sessionService = new SessionService(db);
        this.userService = new UserService(db);
    }

    async createSession(userId: string, isSecure: boolean = true): Promise<AuthResult> {
        const sessionId = crypto.randomUUID();
        // 30 days
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

        await this.sessionService.createSession(sessionId, userId, expiresAt);

        const sessionCookieAttr = this.getCookieAttributes(isSecure, 30 * 24 * 60 * 60); // 30 days
        const rememberMeCookieAttr = this.getCookieAttributes(isSecure, 365 * 24 * 60 * 60); // 1 year

        return {
            sessionId,
            userId,
            cookies: [
                {
                    name: 'session_id',
                    value: sessionId,
                    attributes: sessionCookieAttr
                },
                {
                    name: 'notion_glaze_id',
                    value: userId,
                    attributes: rememberMeCookieAttr
                }
            ]
        };
    }

    async verifySession(sessionId: string): Promise<string | null> {
        const session = await this.sessionService.getSession(sessionId);
        if (!session) return null;

        const expiresAt = new Date(session.expires_at).getTime();
        if (expiresAt <= Date.now()) return null;

        return session.user_id;
    }

    async recoverSession(cookiesStr: string | null, isSecure: boolean = true): Promise<AuthResult | null> {
        if (!cookiesStr) return null;

        // Extract notion_glaze_id
        const glazeIdCookie = cookiesStr.split(';').find(c => c.trim().startsWith('notion_glaze_id='));
        if (!glazeIdCookie) return null;

        const glazeId = glazeIdCookie.split('=')[1];
        if (!glazeId) return null;

        const user = await this.userService.getUserById(glazeId);
        if (!user) return null;

        // Create new session
        return this.createSession(user.id, isSecure);
    }

    async logout(sessionId: string | null): Promise<{ cookies: AuthCookie[] }> {
        if (sessionId) {
            await this.db.prepare('DELETE FROM sessions WHERE id = ?').bind(sessionId).run();
        }

        const clearAttr = 'Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; HttpOnly; SameSite=Lax';

        return {
            cookies: [
                { name: 'session_id', value: '', attributes: clearAttr },
                { name: 'notion_glaze_id', value: '', attributes: clearAttr }
            ]
        };
    }

    private getCookieAttributes(isSecure: boolean, maxAgeSeconds: number): string {
        return `Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}${isSecure ? '; Secure' : ''}`;
    }
}
