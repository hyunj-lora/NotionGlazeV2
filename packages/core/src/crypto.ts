/**
 * Utility for encrypting and decrypting sensitive data like Notion Access Tokens.
 * Uses AES-256-GCM for authenticated encryption.
 */
export class CryptoService {
    private key: CryptoKey | null = null;
    private encoder = new TextEncoder();
    private decoder = new TextDecoder();

    constructor(private secretString: string) { }

    private async ensureKey() {
        if (this.key) return;

        // Hash the secret string to get a 256-bit key
        const hash = await crypto.subtle.digest('SHA-256', this.encoder.encode(this.secretString));

        this.key = await crypto.subtle.importKey(
            'raw',
            hash,
            { name: 'AES-GCM' },
            false,
            ['encrypt', 'decrypt']
        );
    }

    /**
     * Encrypts a string and returns a base64-encoded string containing IV + Ciphertext
     */
    async encrypt(text: string): Promise<string> {
        await this.ensureKey();
        if (!this.key) throw new Error('Failed to initialize CryptoKey');

        const iv = crypto.getRandomValues(new Uint8Array(12));
        const encodedText = this.encoder.encode(text);

        const ciphertext = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv },
            this.key,
            encodedText
        );

        // Combine IV and ciphertext for storage
        const combined = new Uint8Array(iv.length + ciphertext.byteLength);
        combined.set(iv);
        combined.set(new Uint8Array(ciphertext), iv.length);

        return btoa(String.fromCharCode(...combined));
    }

    /**
     * Decrypts a base64-encoded string (IV + Ciphertext)
     */
    async decrypt(encryptedBase64: string): Promise<string> {
        await this.ensureKey();
        if (!this.key) throw new Error('Failed to initialize CryptoKey');

        const combined = new Uint8Array(
            atob(encryptedBase64).split('').map(c => c.charCodeAt(0))
        );

        const iv = combined.slice(0, 12);
        const ciphertext = combined.slice(12);

        const decrypted = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv },
            this.key,
            ciphertext
        );

        return this.decoder.decode(decrypted);
    }
}
