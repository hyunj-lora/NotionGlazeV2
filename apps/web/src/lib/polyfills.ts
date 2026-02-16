/**
 * Polyfill for MessageChannel which is required by React 19 but might be missing
 * in some environments like Cloudflare Workers.
 */
// @ts-ignore - Polyfill for React 19 on Cloudflare
if (typeof MessageChannel === 'undefined') {
    // @ts-ignore
    globalThis.MessageChannel = class MessageChannel {
        port1: any;
        port2: any;
        constructor() {
            this.port1 = {
                onmessage: null,
                postMessage: (msg: any) => {
                    setTimeout(() => this.port2.onmessage?.({ data: msg }), 0);
                }
            };
            this.port2 = {
                onmessage: null,
                postMessage: (msg: any) => {
                    setTimeout(() => this.port1.onmessage?.({ data: msg }), 0);
                }
            };
        }
    };
}
