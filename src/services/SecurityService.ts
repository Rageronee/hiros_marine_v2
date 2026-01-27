import { invoke } from '@tauri-apps/api/core';

export interface ValidationResult {
    valid: boolean;
    hash: string;
    timestamp?: string;
    gps?: string;
    error?: string;
}

export const SecurityService = {
    async validateImage(path: string): Promise<ValidationResult> {
        // Web Environment Guard
        // @ts-ignore
        const isTauri = typeof window !== 'undefined' && window.__TAURI_INTERNALS__ !== undefined;

        if (!isTauri) {
            console.warn("SecurityService: Web environment detected. Using mock validation.");
            return this.mockValidation();
        }

        try {
            // @ts-ignore - invoke signature might vary based on setup, safe to ignore for now
            const result: ValidationResult = await invoke('validate_image', { path });
            return result;
        } catch (e) {
            console.error('Validation failed', e);
            return {
                valid: false,
                hash: '',
                error: String(e)
            };
        }
    },

    async mockValidation(): Promise<ValidationResult> {
        // Simulator for Web Environment
        await new Promise(r => setTimeout(r, 2000));
        return {
            valid: true,
            hash: 'a1b2c3d4e5f6...',
            timestamp: new Date().toISOString(),
            gps: '-6.9932, 110.4182',
        };
    }
};
