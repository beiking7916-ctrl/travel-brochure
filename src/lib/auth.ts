import { supabase } from './supabase';
import bcrypt from 'bcryptjs';

export interface AdminUser {
    id: string;
    username: string;
    role: string;
    created_at: string;
}

const AUTH_KEY = 'travel_brochure_auth';

export const auth = {
    async login(username: string, password_plain: string): Promise<boolean> {
        if (!supabase) return false;

        try {
            // 從 admin_users 取出對應的 hash
            const { data, error } = await supabase
                .from('admin_users')
                .select('id, username, password_hash, role, created_at')
                .eq('username', username)
                .single();

            if (error || !data) {
                console.error('Login failed or user not found', error);
                return false;
            }

            // 驗證密碼
            const isValid = await bcrypt.compare(password_plain, data.password_hash);
            
            if (isValid) {
                // 登入成功，儲存資訊到 localStorage
                const user: AdminUser = {
                    id: data.id,
                    username: data.username,
                    role: data.role,
                    created_at: data.created_at
                };
                localStorage.setItem(AUTH_KEY, JSON.stringify(user));
                return true;
            }
            return false;
        } catch (err) {
            console.error('Auth error', err);
            return false;
        }
    },

    getCurrentUser(): AdminUser | null {
        const stored = localStorage.getItem(AUTH_KEY);
        if (!stored) return null;
        try {
            return JSON.parse(stored) as AdminUser;
        } catch {
            return null;
        }
    },

    logout() {
        localStorage.removeItem(AUTH_KEY);
    }
};
