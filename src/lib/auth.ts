import { supabase } from './supabase';

export const auth = {
    async login(email: string, password_plain: string): Promise<boolean> {
        if (!supabase) return false;

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password: password_plain
            });

            if (error) {
                console.error('Login failed:', error.message);
                return false;
            }

            return true;
        } catch (err) {
            console.error('Auth error:', err);
            return false;
        }
    },

    async getCurrentUser() {
        if (!supabase) return null;
        try {
            const { data: { user } } = await supabase.auth.getUser();
            return user;
        } catch {
            return null;
        }
    },

    async logout() {
        if (!supabase) return;
        try {
            await supabase.auth.signOut();
        } catch (err) {
            console.error('Logout error', err);
        }
    }
};
