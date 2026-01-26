export * from './database';

export interface UserSession {
    user: {
        id: string;
        email?: string;
    } | null;
    accessToken: string | null;
}
