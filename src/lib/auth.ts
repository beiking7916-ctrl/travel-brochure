import { supabase } from './supabase';
import type { User } from '../types';

const CUSTOM_SESSION_KEY = 'travel_brochure_custom_user';

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
                return true;
            }

            // 2. 若自訂表格失敗，回退嘗試 Supabase Auth (email)
            const { error: authError } = await supabase.auth.signInWithPassword({
                email: identifier,
                password: password_plain
            });

            if (!authError) {
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
            await supabase.auth.signOut();
        } catch (err) {
            console.error('Logout error', err);
        }
    }
}
