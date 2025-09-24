/* LEEWAY HEADER — DO NOT REMOVE
TAG: AGENT_LEE_CRYPTO
COLOR_ONION_HEX: NEON=#DC2626 FLUO=#B91C1C PASTEL=#FCA5A5
ICON_FAMILY: lucide
ICON_GLYPH: lock
ICON_SIG: AL005003
5WH: WHAT=Cryptographic utilities and security functions; WHY=Data encryption and security operations; WHO=Agent Lee Development Team; WHERE=D:\Agent-Lee_System\utils\crypto.ts; WHEN=2025-09-22; HOW=TypeScript utility functions with Web Crypto API
SPDX-License-Identifier: MIT
AGENTS: GEMINI, CLAUDE, GPT4, LLAMA, QWEN
*/

//#region Metadata
//#endregion

//#region Init
//#endregion

//#region Internals
// Helper function to convert ArrayBuffer to Base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}

// Helper function to convert Base64 to ArrayBuffer
function base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary_string = window.atob(base64);
    const len = binary_string.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
}

// Derives a key from a password and salt using PBKDF2
async function getKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
        'raw',
        enc.encode(password),
        { name: 'PBKDF2' },
        false,
        ['deriveKey']
    );
    return window.crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: salt,
            iterations: 100000,
            hash: 'SHA-256',
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
    );
}
//#endregion

//#region Public API
/**
 * Encrypts a string with a password.
 * @param text The plaintext string to encrypt.
 * @param password The password to use for encryption.
 * @returns A promise that resolves to an object containing the ciphertext, iv, and salt as base64 strings.
 */
export async function encryptText(text: string, password: string): Promise<{ ciphertext: string, iv: string, salt: string }> {
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const key = await getKey(password, salt);
    const enc = new TextEncoder();

    const encryptedContent = await window.crypto.subtle.encrypt(
        {
            name: 'AES-GCM',
            iv: iv,
        },
        key,
        enc.encode(text)
    );

    return {
        ciphertext: arrayBufferToBase64(encryptedContent),
        iv: arrayBufferToBase64(iv.buffer),
        salt: arrayBufferToBase64(salt.buffer)
    };
}

/**
 * Decrypts a ciphertext string with a password.
 * @param ciphertext The base64 encoded ciphertext.
 * @param password The password to use for decryption.
 * @param iv The base64 encoded initialization vector.
 * @param salt The base64 encoded salt.
 * @returns A promise that resolves to the decrypted plaintext string.
 */
export async function decryptText(ciphertext: string, password: string, iv: string, salt: string): Promise<string> {
    const saltBuffer = base64ToArrayBuffer(salt);
    const ivBuffer = base64ToArrayBuffer(iv);
    // FIX: Convert ArrayBuffer to Uint8Array as expected by getKey
    const key = await getKey(password, new Uint8Array(saltBuffer));
    const dec = new TextDecoder();
    
    try {
        const decryptedContent = await window.crypto.subtle.decrypt(
            {
                name: 'AES-GCM',
                iv: ivBuffer,
            },
            key,
            base64ToArrayBuffer(ciphertext)
        );
        return dec.decode(decryptedContent);
    } catch (e) {
        throw new Error("Decryption failed. Invalid password or corrupted data.");
    }
}
//#endregion