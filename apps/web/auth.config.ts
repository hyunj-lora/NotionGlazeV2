/// <reference types="astro/client" />
import Google from '@auth/core/providers/google';
import { defineConfig } from 'auth-astro';

export default defineConfig({
    secret: import.meta.env.AUTH_SECRET,
    providers: [
        Google({
            clientId: import.meta.env.GOOGLE_CLIENT_ID,
            clientSecret: import.meta.env.GOOGLE_CLIENT_SECRET,
        }),
    ],
    callbacks: {
        async session({ session, token }) {
            // Expose the unique Google ID (token.sub) to the session object
            if (session.user && token.sub) {
                session.user.id = token.sub;
            }
            return session;
        },
    }
});
