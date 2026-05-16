import { BrochureData, BrochureMeta, createDefaultData } from '../types';
export type { BrochureMeta }; // 重新匯出，讓 Dashboard 等組件能繼續從這裡引用
import { get, set, del } from 'idb-keyval';
import { supabase } from './supabase';
import { auth } from './auth';

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
                    .select('id, title:data->>title, agency:data->>agency, groupNumber:data->>groupNumber, isPublished:data->>isPublished, isDeleted:data->>isDeleted, expiresAt:data->>expiresAt, shortId:data->>shortId, category, status, departure_date, last_modified_by, created_at, updated_at')
                    .order('updated_at', { ascending: false });

                if (!error && cloudData) {
                    const today = new Date().toISOString().split('T')[0];
                    const cloudList: BrochureMeta[] = cloudData
                        .filter((item: any) => {
                             // 過濾掉標記為 isDeleted 的資料 (JSON path 提取出來會是字串)
                            return item.isDeleted !== 'true' && item.isDeleted !== true;
                        })
                        .map((item: any) => {
                            let currentStatus = item.status || '待製作';
                            const departureDate = item.departure_date;
                            
                            // 自動判定：如果當前日期大於等於出發日期，則顯示為「已出團」
                            if (departureDate && today >= departureDate) {
                                currentStatus = '已出團';
                            }

                            return {
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
                                shortId: item.shortId || '',
                                category: item.category || '報價',
                                status: currentStatus,
                                departureDate: departureDate || ''
                            };
                        });
                    
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

    // 取得單一手冊內容（優先雲端，支援按需載入圖片以提升效能）
    async getBrochure(id: string, includeImages: boolean = false): Promise<BrochureData | null> {
        try {
            if (supabase) {
                // 根據需求決定是否抓取巨大的圖片欄位
                const selectFields = includeImages ? 'data, updated_at, published_images' : 'data, updated_at';
                const { data: cloudItem, error } = await supabase
                    .from('brochures')
                    .select(selectFields)
                    .eq('id', id)
                    .single();
                
                if (!error && cloudItem) {
                    const item = cloudItem as any;
                    const data = item.data as BrochureData;
                    data.serverUpdatedAt = item.updated_at;
                    
                    // 如果有抓取圖片，則合併回 data 物件中供 UI 使用
                    if (includeImages && item.published_images) {
                        data.publishedImages = item.published_images as string[];
                    }
                    
                    await set(`${STORAGE_KEY_PREFIX}${id}`, data);
                    return data;
                }
            }
            const localData = await get(`${STORAGE_KEY_PREFIX}${id}`);
            return localData || null;
        } catch {
            return null;
        }
    },

    // 儲存單一本手冊內容（同步到雲端，優化順序以防本地快取污染）
    async saveBrochure(id: string, data: BrochureData, isAutoSave: boolean = false): Promise<{ success: boolean; error?: string }> {
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
                
                // 取得舊資料以比對狀態變更
                const { data: oldData } = await supabase
                    .from('brochures')
                    .select('status')
                    .eq('id', id)
                    .single();
                
                const oldStatus = oldData?.status || '待製作';
                const newStatus = data.status || '待製作';
                const statusChanged = oldStatus !== newStatus;

                let newUpdatedAt = now;

                if (originalUpdatedAt) {
                    // 1. 執行更新
                    const updatePayload: any = {
                        data: dataToSave,
                        short_id: data.shortId || null,
                        updated_at: now,
                        last_modified_by: editorName,
                        category: data.category || '報價',
                        status: data.status || '待製作',
                        departure_date: data.departureDate || null
                    };
                    
                    // 只有當物件中確實含有圖片時才更新圖片欄位，避免覆蓋舊圖
                    if (data.publishedImages) {
                        updatePayload.published_images = data.publishedImages;
                    }

                    const { data: updatedData, error } = await supabase
                        .from('brochures')
                        .update(updatePayload)
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
                    // 2. 新增資料 (如果是全新手冊)
                    const { data: insertedData, error } = await supabase
                        .from('brochures')
                        .insert({
                            id: id,
                            data: dataToSave,
                            published_images: data.publishedImages || null, // 圖片存入獨立欄位
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
                    // 如果是手動儲存，則建立完整快照版本
                    if (!isAutoSave) {
                        // 重要：版本歷程不儲存圖片快照，以節省空間與提升讀取效率
                        const logData = { ...dataToSave };
                        delete (logData as any).publishedImages; 

                        console.log(`正在為手冊 ${id} 寫入快照版本 (手動)...`);
                        const { error: logError } = await supabase.from('brochure_logs').insert({
                            brochure_id: id,
                            editor_name: editorName,
                            action_type: 'save',
                            data: logData
                        });

                        if (logError) {
                            console.error('快照版本寫入失敗：', logError.message);
                        } else {
                            console.log('快照版本寫入完成');
                        }
                    }

                    // 如果進度有變更，不論是否為自動儲存，皆額外寫入一筆進度變更紀錄
                    if (statusChanged) {
                        await supabase.from('brochure_logs').insert({
                            brochure_id: id,
                            editor_name: editorName,
                            action_type: 'status_change',
                            data: {
                                from: oldStatus,
                                to: newStatus,
                                note: `將製作進度從「${oldStatus}」調整為「${newStatus}」`
                            }
                        });
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
                    isDeleted: !!data.isDeleted,
                    updatedAt: now, 
                    lastModifiedBy: (await auth.getCurrentUser())?.name || '系統' 
                };
            } else {
                list.unshift({
                    id, title, agency, groupNumber, isPublished, expiresAt, shortId,
                    isDeleted: !!data.isDeleted,
                    createdAt: now, updatedAt: now,
                    lastModifiedBy: (await auth.getCurrentUser())?.name || '系統'
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

    // 將手冊發佈到外部電子書系統 (FlipCloud)
    async publishToEbook(title: string, pages: string[]): Promise<{ success: boolean; id?: string; error?: string }> {
        const EBOOK_API_URL = import.meta.env.VITE_FLIPCLOUD_API_URL || 'https://flipcloud-api.khuang167.workers.dev';
        const API_KEY = import.meta.env.VITE_FLIPCLOUD_API_KEY;

        if (!API_KEY) {
            return { success: false, error: 'FlipCloud API 金鑰尚未設定' };
        }

        try {
            const response = await fetch(`${EBOOK_API_URL}/api/upload`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': API_KEY
                },
                body: JSON.stringify({
                    title: title,
                    pages: pages, // PNG Base64 陣列
                    category: '旅遊手冊'
                })
            });

            const result = await response.json();
            if (response.ok && result.id) {
                return { success: true, id: result.id };
            } else {
                return { success: false, error: result.error || '發佈到電子書系統失敗' };
            }
        } catch (err: any) {
            console.error('發佈到電子書時發生錯誤：', err);
            return { success: false, error: err.message || '網路連線失敗' };
        }
    },

    // 取得修改歷程清單 (不包含巨大的 data 欄位，以提升載入清單的效能)
    async getVersions(brochureId: string): Promise<any[]> {
        if (!supabase) return [];
        try {
            const { data, error } = await supabase
                .from('brochure_logs')
                .select('id, brochure_id, created_at, editor_name, action_type') // 排除 data 欄位
                .eq('brochure_id', brochureId)
                .order('created_at', { ascending: false })
                .limit(50);
            
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('取得歷程清單失敗：', error);
            return [];
        }
    },

    // 取得特定版本的詳細資料 (當使用者點選該版本時才抓取)
    async getLogDetail(logId: string): Promise<any | null> {
        if (!supabase) return null;
        try {
            const { data, error } = await supabase
                .from('brochure_logs')
                .select('data')
                .eq('id', logId)
                .single();
            
            if (error) throw error;
            return data?.data || null;
        } catch (error) {
            console.error('取得版本詳情失敗：', error);
            return null;
        }
    }
};
