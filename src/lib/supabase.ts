import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// 全域 fetch with 5 秒 timeout（避免 Zeabur WebSocket 連線問題拖慢請求）
const fetchWithTimeout = (input: RequestInfo | URL, init?: RequestInit) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    return fetch(input, { ...init, signal: controller.signal }).finally(() => clearTimeout(timer));
};

export const supabase = supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey, {
        // 停用 Realtime WebSocket（本應用不需要，且 Zeabur 環境下會拖慢載入）
        realtime: { params: { eventsPerSecond: 0 } },
        global: { fetch: fetchWithTimeout },
        auth: { persistSession: false },
    })
    : null;
