import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";


export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function hexToHsl(hex: string): string {
    let c = hex.substring(1).split("");
    if (c.length === 3) {
        c = [c[0], c[0], c[1], c[1], c[2], c[2]];
    }
    const r = parseInt(c[0] + c[1], 16) / 255;
    const g = parseInt(c[2] + c[3], 16) / 255;
    const b = parseInt(c[4] + c[5], 16) / 255;

    const max = Math.max(r, g, b),
        min = Math.min(r, g, b);
    let h = 0,
        s = 0,
        l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r:
                h = (g - b) / d + (g < b ? 6 : 0);
                break;
            case g:
                h = (b - r) / d + 2;
                break;
            case b:
                h = (r - g) / d + 4;
                break;
        }
        h /= 6;
    }
    // Return space separated H S L values for Shadcn (e.g. "222.2 47.4% 11.2%")
    return `${(h * 360).toFixed(1)} ${(s * 100).toFixed(1)}% ${(l * 100).toFixed(1)}%`;
}

export async function fetchDnsJSON(name: string, type: string) {
    try {
        const url = `https://cloudflare-dns.com/dns-query?name=${name}&type=${type}&_t=${Date.now()}`;
        const res = await fetch(url, {
            headers: { 'Accept': 'application/dns-json' }
        });
        return await res.json();
    } catch (e) {
        return null;
    }
}
