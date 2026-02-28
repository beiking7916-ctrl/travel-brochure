import { supabase } from './supabase';

export interface Country {
    code: string;
    name_en: string;
    name_zh: string;
}

export interface LibraryAttraction {
    id: string;
    country_code: string;
    title: string;
    description: string;
    layout: string;
    images: string[];
    created_at: string;
}

export const attractionApi = {
    async fetchCountries(): Promise<Country[]> {
        if (!supabase) return [];
        const { data, error } = await supabase
            .from('countries')
            .select('*')
            .order('name_zh');
        if (error) { console.error('Error fetching countries:', error); return []; }
        return data as Country[];
    },

    async fetchAttractionsByCountry(countryCode: string): Promise<LibraryAttraction[]> {
        if (!supabase) return [];
        const { data, error } = await supabase
            .from('attractions')
            .select('*')
            .eq('country_code', countryCode)
            .order('title');
        if (error) { console.error('Error fetching attractions:', error); return []; }
        return data as LibraryAttraction[];
    },

    /**
     * 儲存景點：先嘗試原生 upsert（需要 DB 有 UNIQUE(country_code, title)，1 次請求）
     * 若 DB 無 constraint 則退回兩步驟查詢。外層用 Promise.all 並行。
     */
    async saveAttractionToLibrary(
        countryCode: string,
        attraction: { title: string; description: string; layout: string; images: string[] }
    ): Promise<{ status: 'inserted' | 'updated' | 'error' }> {
        if (!supabase) return { status: 'error' };

        const payload = {
            country_code: countryCode,
            title: attraction.title,
            description: attraction.description,
            layout: attraction.layout,
            images: attraction.images,
        };

        // 先嘗試原生 upsert（有 unique constraint → 最快，1 次請求）
        const { error: upsertError } = await supabase
            .from('attractions')
            .upsert(payload, { onConflict: 'country_code,title', ignoreDuplicates: false });

        if (!upsertError) {
            return { status: 'inserted' }; // upsert 成功（不區分新增/更新）
        }

        // 退回兩步驟邏輯（無 unique constraint 時）
        console.warn('Native upsert fallback:', upsertError.message);
        const { data: existing } = await supabase
            .from('attractions')
            .select('id')
            .eq('country_code', countryCode)
            .eq('title', attraction.title)
            .maybeSingle();

        if (existing?.id) {
            const { error } = await supabase
                .from('attractions')
                .update({ description: payload.description, layout: payload.layout, images: payload.images })
                .eq('id', existing.id);
            if (error) { console.error('Error updating:', error); return { status: 'error' }; }
            return { status: 'updated' };
        } else {
            const { error } = await supabase
                .from('attractions')
                .insert(payload);
            if (error) { console.error('Error inserting:', error); return { status: 'error' }; }
            return { status: 'inserted' };
        }
    },

    /** 依 ID 更新資料庫中已存在的景點 */
    async updateAttractionInLibrary(
        id: string,
        attraction: { title: string; description: string; layout: string; images: string[] }
    ): Promise<boolean> {
        if (!supabase) return false;
        const { error } = await supabase
            .from('attractions')
            .update({
                title: attraction.title,
                description: attraction.description,
                layout: attraction.layout,
                images: attraction.images,
            })
            .eq('id', id);
        if (error) { console.error('Error updating by id:', error); return false; }
        return true;
    },

    /** 刪除資料庫中的景點 */
    async deleteAttractionFromLibrary(id: string): Promise<boolean> {
        if (!supabase) return false;
        const { error } = await supabase
            .from('attractions')
            .delete()
            .eq('id', id);
        if (error) { console.error('Error deleting:', error); return false; }
        return true;
    },

    async syncCountries(countries: Country[]): Promise<boolean> {
        if (!supabase) return false;
        const { error } = await supabase
            .from('countries')
            .upsert(countries, { onConflict: 'code' });
        if (error) { console.error('Error syncing countries:', error); return false; }
        return true;
    },
};
