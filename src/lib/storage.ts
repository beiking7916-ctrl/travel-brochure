import { BrochureData, createDefaultData } from '../types';
import { get, set, del } from 'idb-keyval';
import { supabase } from './supabase'; //

export interface BrochureMeta {
    id: string;
    title: string;
    agency?: string;
    groupNumber?: string;
    isPublished?: boolean;
    createdAt: string;
    updatedAt: string;
    isDeleted?: boolean;
}

const STORAGE_KEY_PREFIX = 'travel_brochure_';
const LIST_KEY = 'travel_brochure_list';

export const storage = {
    // 取得手冊列表（主要從雲端抓取，若無則才降級本機）
    async getList(): Promise<BrochureMeta[]> {
        try {
            if (supabase) {
                // 優化：僅抓取 Metadata，不抓取完整巨大的 data 物件
                const { data: cloudData, error } = await supabase
                    .from('brochures')
                    .select('id, title:data->>title, agency:data->>agency, groupNumber:data->>groupNumber, isPublished:data->>isPublished, isDeleted:data->>isDeleted, created_at, updated_at')
                    .order('updated_at', { ascending: false });

                if (!error && cloudData) {
                    const cloudList: BrochureMeta[] = cloudData
                        .filter((item: any) => {
                             // 過濾掉標記為 isDeleted 的資料 (JSON path 提取出來會是字串)
                            return item.isDeleted !== 'true' && item.isDeleted !== true;
                        })
                        .map((item: any) => ({
                            id: item.id,
                            title: item.title || '未命名手冊',
                            agency: item.agency || '',
                            groupNumber: item.groupNumber || '',
                            isPublished: item.isPublished === 'true' || item.isPublished === true,
                            createdAt: item.created_at,
                            updatedAt: item.updated_at,
                            isDeleted: false
                        }));
                    
                    // 同步到本機列表快取
                    await set(LIST_KEY, cloudList);
                    return cloudList;
                }
            }
            
            // 雲端失敗或未登入才看本機
            const list = await get(LIST_KEY);
            return (list || []).filter((m: any) => !m.isDeleted);
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

    // 取得單一手冊內容（優先雲端）
    async getBrochure(id: string): Promise<BrochureData | null> {
        try {
            // 1. 優先從雲端抓取以確保最新
            if (supabase) {
                const { data: cloudItem, error } = await supabase
                    .from('brochures')
                    .select('data')
                    .eq('id', id)
                    .single();
                
                if (!error && cloudItem) {
                    const data = cloudItem.data as BrochureData;
                    // 同步回本機快取
                    await set(`${STORAGE_KEY_PREFIX}${id}`, data);
                    return data;
                }
            }

            // 2. 雲端失敗或沒網路時，才看本機
            const localData = await get(`${STORAGE_KEY_PREFIX}${id}`);
            return localData || null;
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
        const groupNumber = data.groupNumber || '';
        const isPublished = !!data.isPublished;

        if (existingIndex >= 0) {
            list[existingIndex] = { ...list[existingIndex], title, agency, groupNumber, isPublished, updatedAt: now };
        } else {
            list.unshift({
                id,
                title,
                agency,
                groupNumber,
                isPublished,
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

    // 刪除手冊（實體刪除本機，雲端嘗試刪除）
    async deleteBrochure(id: string): Promise<void> {
        // 刪除本機
        await del(`${STORAGE_KEY_PREFIX}${id}`);

        // 刪除雲端
        if (supabase) {
            const { error } = await supabase
                .from('brochures')
                .delete()
                .eq('id', id);
            
            if (error) {
                 console.warn('雲端刪除失敗（可能是 RLS 限制實體刪除），改嘗試作廢機制。');
                 await this.invalidateBrochure(id);
            }
        }

        // 從列表移除
        const list = await this.getList();
        await this.saveList(list.filter(item => item.id !== id));
    },

    // 作廢手冊機制 (Invalidate)
    async invalidateBrochure(id: string): Promise<void> {
        const data = await this.getBrochure(id);
        if (data) {
            data.isDeleted = true;
            await this.saveBrochure(id, data);
        }
    }
};
