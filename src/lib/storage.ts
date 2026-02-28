import { BrochureData, createDefaultData } from '../types';

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
    getList(): BrochureMeta[] {
        try {
            const list = localStorage.getItem(LIST_KEY);
            return list ? JSON.parse(list) : [];
        } catch {
            return [];
        }
    },

    // 儲存手冊列表
    saveList(list: BrochureMeta[]) {
        try {
            localStorage.setItem(LIST_KEY, JSON.stringify(list));
        } catch (error) {
            console.error('儲存列表失敗（空間不足）：', error);
        }
    },

    // 取得單一手冊內容
    getBrochure(id: string): BrochureData | null {
        try {
            const data = localStorage.getItem(`${STORAGE_KEY_PREFIX}${id}`);
            return data ? JSON.parse(data) : null;
        } catch {
            return null;
        }
    },

    // 儲存單一手冊內容
    saveBrochure(id: string, data: BrochureData) {
        try {
            // 儲存實際資料
            localStorage.setItem(`${STORAGE_KEY_PREFIX}${id}`, JSON.stringify(data));
        } catch (error) {
            console.error('儲存到本機快取失敗（可能容量已滿），但不影響雲端資料：', error);
        }

        // 更新列表 Meta
        const list = this.getList();
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
        this.saveList(list);
    },

    // 建立全新手冊
    createBrochure(): string {
        const newId = crypto.randomUUID();
        const defaultData = createDefaultData();
        this.saveBrochure(newId, defaultData);
        return newId;
    },

    // 複製手冊
    duplicateBrochure(id: string): string | null {
        const data = this.getBrochure(id);
        if (!data) return null;

        const newId = crypto.randomUUID();
        const duplicatedData = {
            ...data,
            title: `${data.title} (複製)`,
        };
        this.saveBrochure(newId, duplicatedData);
        return newId;
    },

    // 刪除手冊
    deleteBrochure(id: string) {
        // 刪除實際資料
        localStorage.removeItem(`${STORAGE_KEY_PREFIX}${id}`);

        // 從列表移除
        const list = this.getList();
        this.saveList(list.filter(item => item.id !== id));
    }
};
