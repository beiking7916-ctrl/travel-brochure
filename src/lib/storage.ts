import { BrochureData, createDefaultData } from '../types';
import { get, set, del } from 'idb-keyval';
import { supabase } from './supabase';
import { auth } from './auth';

export interface BrochureMeta {
    id: string;
    title: string;
    agency?: string;
    groupNumber?: string;
    isPublished?: boolean;
    createdAt: string;
    updatedAt: string;
    lastModifiedBy?: string;
    isDeleted?: boolean;
    expiresAt?: string;
    shortId?: string;
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
                    .select('id, title:data->>title, agency:data->>agency, groupNumber:data->>groupNumber, isPublished:data->>isPublished, isDeleted:data->>isDeleted, expiresAt:data->>expiresAt, shortId:data->>shortId, last_modified_by, created_at, updated_at')
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
                            lastModifiedBy: item.last_modified_by || '',
                            isDeleted: false,
                            expiresAt: item.expiresAt || '',
                            shortId: item.shortId || ''
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
                    .select('data, updated_at')
                    .eq('id', id)
                    .single();
                
                if (!error && cloudItem) {
                    const data = cloudItem.data as BrochureData;
                    // 將資料庫的 updated_at 存入資料中，用於後續儲存時的衝突檢查
                    data.serverUpdatedAt = cloudItem.updated_at;
                    
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

    // 儲存單一本手冊內容（同步到雲端，優化順序以防本地快取污染）
    async saveBrochure(id: string, data: BrochureData): Promise<{ success: boolean; error?: string }> {
        // 如果已發佈但還沒有短代碼，生成一個
        if (data.isPublished && !data.shortId) {
            const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
            let code = '';
            for (let i = 0; i < 6; i++) {
                code += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            data.shortId = code;
        }

        const now = new Date().toISOString();
        let syncError = '';
        let isConflict = false;
        
        // 1. 準備儲存的資料，移除暫存的 serverUpdatedAt 欄位
        const dataToSave = { ...data };
        delete dataToSave.serverUpdatedAt;

        // 2. 儲存到雲端 Supabase (優先雲端)
        if (supabase) {
            try {
                const user = await auth.getCurrentUser();
                const editorName = user?.name || user?.email || '未知使用者';
                const originalUpdatedAt = data.serverUpdatedAt;
                
                let newUpdatedAt = now;

                if (originalUpdatedAt) {
                    // 執行更新，並檢查時間戳是否一致（樂觀鎖）
                    const { data: updatedData, error } = await supabase
                        .from('brochures')
                        .update({
                            data: dataToSave,
                            short_id: data.shortId || null,
                            updated_at: now,
                            last_modified_by: editorName
                        })
                        .eq('id', id)
                        .eq('updated_at', originalUpdatedAt)
                        .select('updated_at');

                    if (error) {
                        syncError = error.message;
                    } else if (!updatedData || updatedData.length === 0) {
                        // 儲存衝突：雲端已被修改
                        console.warn('儲存衝突：資料已被他人修改');
                        isConflict = true;
                    } else {
                        newUpdatedAt = updatedData[0].updated_at;
                        data.serverUpdatedAt = newUpdatedAt; // 回填時間戳
                    }
                } else {
                    // 新增資料
                    const { data: insertedData, error } = await supabase
                        .from('brochures')
                        .insert({
                            id: id,
                            data: dataToSave,
                            short_id: data.shortId || null,
                            updated_at: now,
                            last_modified_by: editorName
                        })
                        .select('updated_at');
                    
                    if (error) {
                        syncError = error.message;
                    } else if (insertedData && insertedData.length > 0) {
                        newUpdatedAt = insertedData[0].updated_at;
                        data.serverUpdatedAt = newUpdatedAt; // 回填時間戳
                    }
                }

                // 如果沒有發生衝突且雲端成功，則紀錄歷程
                if (!isConflict && !syncError) {
                    console.log(`正在為手冊 ${id} 寫入快照歷程...`);
                    const { error: logError } = await supabase.from('brochure_logs').insert({
                        brochure_id: id,
                        editor_name: editorName,
                        action_type: 'save',
                        data: dataToSave
                    });

                    if (logError) {
                        console.error('版本歷程寫入失敗：', logError.message, '請確認 brochure_logs 表格是否已正確建立。');
                    } else {
                        console.log('版本歷程寫入完成');
                    }
                }
            } catch (err: any) {
                console.error('雲端通訊發生意外錯誤：', err);
                syncError = err.message || '網路通訊失敗';
            }
        }

        // 3. 處理本地快取更新
        // 若發生「版本衝突 (CONFLICT)」，則絕對不更新本地快取，以免污染本地資料
        if (isConflict) {
            return { success: false, error: 'CONFLICT' };
        }

        // 雲端成功 或 雲端因網路問題失敗時，更新本地快取（作為備援或成功紀錄）
        try {
            // 同步最新的 data（包含可能的 serverUpdatedAt）到本地
            await set(`${STORAGE_KEY_PREFIX}${id}`, data);

            // 更新本地列表 Meta
            const list = (await get(LIST_KEY) as BrochureMeta[]) || [];
            const existingIndex = list.findIndex(item => item.id === id);

            const title = data.title || '未命名手冊';
            const agency = data.agency || '';
            const groupNumber = data.groupNumber || '';
            const isPublished = !!data.isPublished;
            const expiresAt = data.expiresAt || '';
            const shortId = data.shortId || '';

            if (existingIndex >= 0) {
                list[existingIndex] = { 
                    ...list[existingIndex], 
                    title, agency, groupNumber, isPublished, expiresAt, shortId, 
                    updatedAt: now, 
                    lastModifiedBy: (await auth.getCurrentUser())?.name || '' 
                };
            } else {
                list.unshift({
                    id, title, agency, groupNumber, isPublished, expiresAt, shortId,
                    createdAt: now, updatedAt: now,
                    lastModifiedBy: (await auth.getCurrentUser())?.name || ''
                });
            }
            await set(LIST_KEY, list);
        } catch (error) {
            console.error('本地存取更新失敗：', error);
        }

        return { success: !syncError, error: syncError };
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
    },

    // 取得修改歷程紀錄（包含快照的版本紀錄）
    async getVersions(brochureId: string): Promise<any[]> {
        if (!supabase) return [];
        try {
            // 先嘗試抓取所有紀錄，不要過濾 data is null，這樣才能確認是否連線正常
            const { data, error } = await supabase
                .from('brochure_logs')
                .select('*')
                .eq('brochure_id', brochureId)
                .order('created_at', { ascending: false });
            
            if (error) {
                console.error('Supabase 查詢錯誤 (請確認 brochure_logs 表是否有 data 欄位):', error);
                throw error;
            }
            
            // 返回所有紀錄，UI 端會根據是否含有 data 來決定是否可恢復
            return data || [];
        } catch (error) {
            console.error('取得版本紀錄失敗：', error);
            return [];
        }
    },

    // 恢復至指定版本 (優化：先取得雲端最新時間戳再執行覆蓋，以確保恢復動作不受樂觀鎖阻擋)
    async restoreVersion(id: string, versionData: BrochureData): Promise<{ success: boolean; error?: string }> {
        if (supabase) {
            // 1. 先抓取目前的雲端版本，取得最新的時間戳
            const { data: current, error: fetchError } = await supabase
                .from('brochures')
                .select('updated_at')
                .eq('id', id)
                .single();
            
            if (!fetchError && current) {
                // 2. 將最新的時間戳填入要恢復的資料中
                versionData.serverUpdatedAt = current.updated_at;
            }
        }
        
        // 3. 調用 saveBrochure 執行覆蓋
        return await this.saveBrochure(id, versionData);
    },

    // 取得原始修改歷程紀錄 (Audit Log)
    async getLogs(brochureId: string): Promise<any[]> {
        if (!supabase) return [];
        try {
            const { data, error } = await supabase
                .from('brochure_logs')
                .select('*')
                .eq('brochure_id', brochureId)
                .order('created_at', { ascending: false })
                .limit(50);
            
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('取得歷程紀錄失敗：', error);
            return [];
        }
    }
};
