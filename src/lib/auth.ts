import { supabase } from './supabase';
import type { User } from '../types';

const CUSTOM_SESSION_KEY = 'travel_brochure_custom_user';
const LAST_ACTIVITY_KEY = 'auth_last_activity';
const SESSION_TIMEOUT = 6 * 60 * 60 * 1000; // 6 小時 (毫秒)

export const auth = {
    async login(identifier: string, password_plain: string): Promise<boolean> {
        if (!supabase) return false;

        try {
            // 1. 優先嘗試自訂表格 (RPC + bcrypt)
            const { data: rpcData, error: rpcError } = await supabase.rpc('check_user_password', {
                p_employee_id: identifier,
                p_password: password_plain
            });

            console.log('RPC Login Result:', { rpcData, rpcError });

            if (!rpcError && rpcData?.success) {
                // 登入成功，儲存自訂 Session
                localStorage.setItem(CUSTOM_SESSION_KEY, JSON.stringify(rpcData.user));
                localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
                return true;
            }

            // 2. 若自訂表格失敗，回退嘗試 Supabase Auth (email)
            const { error: authError } = await supabase.auth.signInWithPassword({
                email: identifier,
                password: password_plain
            });

            if (!authError) {
                localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
                return true;
            }

            console.error('Login failed both path:', rpcError?.message || authError?.message);
            return false;
        } catch (err) {
            console.error('Auth error:', err);
            return false;
        }
    },

    async getCurrentUser(): Promise<User | any | null> {
        if (!supabase) return null;

        try {
            // 0. 檢查最後活動時間是否過期 (閒置登出)
            const lastActivity = localStorage.getItem(LAST_ACTIVITY_KEY);
            if (lastActivity && Date.now() - parseInt(lastActivity, 10) > SESSION_TIMEOUT) {
                await this.logout();
                return null;
            }

            // 1. 檢查自訂 Session
            const localUser = localStorage.getItem(CUSTOM_SESSION_KEY);
            if (localUser) {
                return JSON.parse(localUser);
            }

            // 2. 檢查 Supabase Auth (優先使用 getSession 進行快速本地檢查)
            const { data: { session } } = await supabase.auth.getSession();
            return session?.user ?? null;
        } catch {
            return null;
        }
    },

    async logout() {
        if (!supabase) return;
        try {
            localStorage.removeItem(CUSTOM_SESSION_KEY);
            localStorage.removeItem(LAST_ACTIVITY_KEY);
            await supabase.auth.signOut();
        } catch (err) {
            console.error('Logout error', err);
        }
    },

    updateLastActivity() {
        localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
    }
}
