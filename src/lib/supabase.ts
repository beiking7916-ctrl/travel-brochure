import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_ANON_KEY || '';

// 全域 fetch with 10 秒 timeout（避免 Zeabur WebSocket 連線問題拖慢請求）
const fetchWithTimeout = (input: RequestInfo | URL, init?: RequestInit) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    return fetch(input, { ...init, signal: controller.signal }).finally(() => clearTimeout(timer));
};

export const supabase = supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey, {
        global: { fetch: fetchWithTimeout },
        auth: { persistSession: true },
    })
    : null;
