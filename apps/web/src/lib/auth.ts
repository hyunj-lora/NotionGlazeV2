export async function recoverSessionFromCookie(cookies: string | null, db: any): Promise<string | null> {
    if (!cookies) return null;

    const glazeId = cookies.split(';').find(c => c.trim().startsWith('notion_glaze_id='))?.split('=')[1];
    if (!glazeId) return null;

    try {
        const user: any = await db.prepare('SELECT id FROM users WHERE id = ?').bind(glazeId).first();
        if (user) {
            return user.id;
        }
    } catch (e) {
        console.error('Failed to recover session from glaze_id:', e);
    }

    return null;
}
