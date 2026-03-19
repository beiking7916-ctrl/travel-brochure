import { BrochureData, createDefaultData } from '../types';
import { get, set, del } from 'idb-keyval';
import { supabase } from './supabase'; //

export interface BrochureMeta {
    id: string;
    title: string;
    agency?: string;
    createdAt: string;
    updatedAt: string;
}

const STORAGE_KEY_PREFIX = 'travel_brochure_';
const LIST_KEY = 'travel_brochure_list';

export const storage = {
    // 取得手冊列表（合併雲端與本機）
    async getList(): Promise<BrochureMeta[]> {
        try {
            // 優先取得雲端資料（如果 supabase 已設定）
            if (supabase) {
                const { data: cloudData, error } = await supabase
                    .from('brochures')
                    .select('id, data, created_at, updated_at')
                    .order('updated_at', { ascending: false });

                if (!error && cloudData) {
                    const cloudList: BrochureMeta[] = cloudData.map(item => ({
                        id: item.id,
                        title: item.data.title || '未命名手冊',
                        agency: item.data.agency || '',
                        createdAt: item.created_at,
                        updatedAt: item.updated_at
                    }));
                    // 同步回本機列表
                    await set(LIST_KEY, cloudList);
                    return cloudList;
                }
            }
            
            const list = await get(LIST_KEY);
            return list || [];
        } catch (error) {
            console.error('取得列表失敗：', error);
            return [];
        }
    },

    // 儲存手冊列表（內部輔助）
    async saveList(list: BrochureMeta[]): Promise<void> {
        try {
            await set(LIST_KEY, list);
        } catch (error) {
            console.error('儲存列表失敗：', error);
        }
    },

    // 取得單一手冊內容
    async getBrochure(id: string): Promise<BrochureData | null> {
        try {
            // 先看本機有沒有
            let data = await get(`${STORAGE_KEY_PREFIX}${id}`);
            
            // 如果本機沒有且有雲端，從雲端抓取
            if (!data && supabase) {
                const { data: cloudItem, error } = await supabase
                    .from('brochures')
                    .select('data')
                    .eq('id', id)
                    .single();
                
                if (!error && cloudItem) {
                    data = cloudItem.data;
                    await set(`${STORAGE_KEY_PREFIX}${id}`, data); // 存回本機快取
                }
            }
            return data || null;
        } catch {
            return null;
        }
    },

    // 儲存單一手冊內容（同步到雲端）
    async saveBrochure(id: string, data: BrochureData): Promise<void> {
        const now = new Date().toISOString();
        
        // 1. 儲存到本機 IndexedDB
        try {
            await set(`${STORAGE_KEY_PREFIX}${id}`, data);
        } catch (error) {
            console.error('本機快取失敗：', error);
        }

        // 2. 儲存到雲端 Supabase
        if (supabase) {
            const { error: cloudError } = await supabase
                .from('brochures')
                .upsert({
                    id: id,
                    data: data,
                    updated_at: now
                });
            
            if (cloudError) {
                console.error('雲端同步失敗（請確認是否已登入或 RLS 設定）：', cloudError.message);
            }
        }

        // 3. 更新列表 Meta
        const list = await this.getList();
        const existingIndex = list.findIndex(item => item.id === id);

        const title = data.title || '未命名手冊';
        const agency = data.agency || '';

        if (existingIndex >= 0) {
            list[existingIndex] = { ...list[existingIndex], title, agency, updatedAt: now };
        } else {
            list.unshift({
                id,
                title,
                agency,
                createdAt: now,
                updatedAt: now,
            });
        }
        await this.saveList(list);
    },

    // 建立全新手冊
    async createBrochure(): Promise<string> {
        const newId = crypto.randomUUID();
        const defaultData = createDefaultData();
        await this.saveBrochure(newId, defaultData);
        return newId;
    },

    // 複製手冊
    async duplicateBrochure(id: string): Promise<string | null> {
        const data = await this.getBrochure(id);
        if (!data) return null;

        const newId = crypto.randomUUID();
        const duplicatedData = {
            ...data,
            title: `${data.title} (複製)`,
        };
        await this.saveBrochure(newId, duplicatedData);
        return newId;
    },

    // 刪除手冊（同步刪除雲端）
    async deleteBrochure(id: string): Promise<void> {
        // 刪除本機
        await del(`${STORAGE_KEY_PREFIX}${id}`);

        // 刪除雲端
        if (supabase) {
            const { error } = await supabase
                .from('brochures')
                .delete()
                .eq('id', id);
            
            if (error) console.error('雲端刪除失敗：', error.message);
        }

        // 從列表移除
        const list = await this.getList();
        await this.saveList(list.filter(item => item.id !== id));
    }
};
