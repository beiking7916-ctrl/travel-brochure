import { BrochureData, createDefaultData } from '../types';
import { get, set, del } from 'idb-keyval';

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
    // 取得手冊列表
    async getList(): Promise<BrochureMeta[]> {
        try {
            const list = await get(LIST_KEY);
            return list || [];
        } catch {
            return [];
        }
    },

    // 儲存手冊列表
    async saveList(list: BrochureMeta[]): Promise<void> {
        try {
            await set(LIST_KEY, list);
        } catch (error) {
            console.error('儲存列表失敗（空間不足或 IndexedDB 錯誤）：', error);
        }
    },

    // 取得單一手冊內容
    async getBrochure(id: string): Promise<BrochureData | null> {
        try {
            const data = await get(`${STORAGE_KEY_PREFIX}${id}`);
            return data || null;
        } catch {
            return null;
        }
    },

    // 儲存單一手冊內容
    async saveBrochure(id: string, data: BrochureData): Promise<void> {
        try {
            // 儲存實際資料
            await set(`${STORAGE_KEY_PREFIX}${id}`, data);
        } catch (error) {
            console.error('儲存到本機快取失敗（IndexedDB 錯誤），但不影響雲端資料：', error);
        }

        // 更新列表 Meta
        const list = await this.getList();
        const existingIndex = list.findIndex(item => item.id === id);
        const now = new Date().toISOString();

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

    // 刪除手冊
    async deleteBrochure(id: string): Promise<void> {
        // 刪除實際資料
        await del(`${STORAGE_KEY_PREFIX}${id}`);

        // 從列表移除
        const list = await this.getList();
        await this.saveList(list.filter(item => item.id !== id));
    }
};
