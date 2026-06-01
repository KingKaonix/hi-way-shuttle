export type UserRole = 'rider' | 'driver' | 'admin';
export interface User {
    id: number;
    email: string;
    name: string;
    password_hash: string;
    role: UserRole;
    phone?: string;
    avatar_url?: string;
    created_at: string;
    updated_at: string;
}
export interface UserPublic {
    id: number;
    email: string;
    name: string;
    role: UserRole;
    phone?: string;
    avatar_url?: string;
    created_at: string;
}
