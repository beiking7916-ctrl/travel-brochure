import React, { useState, useEffect } from 'react';
import { storage, BrochureMeta } from '../lib/storage';
import { FileText, Plus, Copy, Trash2, Calendar, LogOut, Archive } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { auth } from '../lib/auth';
import type { BrochureData } from '../types';

interface DashboardProps {
    onSelectBrochure: (id: string) => void;
    onLogout: () => void;
}

export function Dashboard({ onSelectBrochure, onLogout }: DashboardProps) {
    const [brochures, setBrochures] = useState<BrochureMeta[]>([]);

    const loadList = async () => {
        const list = await storage.getList();
        // storage.getList 內部已經處理過雲端優先與 isDeleted 過濾
        setBrochures(list);
    };

    useEffect(() => {
        loadList();
    }, []);

    const handleCreate = async () => {
        const newId = await storage.createBrochure();
        onSelectBrochure(newId);
    };

    const handleDuplicate = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();

        // 如果是從雲端複製，我們需要先拿到最新資料
        let dataToDuplicate: BrochureData | null = null;
        if (supabase) {
            const { data } = await supabase.from('brochures').select('data').eq('id', id).single();
            if (data && data.data) {
                dataToDuplicate = data.data as BrochureData;
            }
        }

        // 如果雲端拿不到，再從本地拿
        if (!dataToDuplicate) {
            dataToDuplicate = await storage.getBrochure(id);
        }

        if (!dataToDuplicate) return;

        const newId = crypto.randomUUID();
        const duplicatedData = {
            ...dataToDuplicate,
            title: `${dataToDuplicate.title} (複製)`,
        };
        await storage.saveBrochure(newId, duplicatedData);
        await loadList(); // 重新載入列表
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (window.confirm('確定要「永久刪除」這份手冊嗎？此動作將嘗試從雲端與本機同時抹除，無法復原。')) {
            await storage.deleteBrochure(id);
            await loadList();
        }
    };

    const handleInvalidate = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (window.confirm('確定要「作廢」這份手冊嗎？作廢後手冊將從草稿清單中隱藏，但資料仍保留在雲端。')) {
            await storage.invalidateBrochure(id);
            await loadList();
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('zh-TW', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="h-16 flex items-center justify-between px-8 bg-white border-b border-gray-200 sticky top-0 z-10">
                <h1 className="text-xl font-bold flex items-center gap-2 text-gray-800">
                    <FileText size={24} className="text-blue-600" />
                    旅遊手冊主控台
                </h1>
                <div className="flex items-center gap-4">
                    <button
                        onClick={onLogout}
                        className="flex items-center gap-2 px-3 py-2 text-gray-500 hover:text-red-600 hover:bg-red-50 font-medium rounded-lg transition-colors border border-transparent"
                        title="登出系統"
                    >
                        <LogOut size={18} />
                        <span className="hidden sm:inline">登出</span>
                    </button>
                    <div className="w-px h-6 bg-gray-300 mx-2"></div>
                    <button
                        onClick={handleCreate}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                    >
                        <Plus size={18} />
                        建立新草稿
                    </button>
                </div>
            </header>

            <main className="flex-1 p-8 overflow-y-auto">
                <div className="max-w-6xl mx-auto">
                    {brochures.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300 shadow-sm mt-8">
                            <FileText size={48} className="mx-auto text-gray-300 mb-4" />
                            <h2 className="text-xl font-medium text-gray-800 mb-2">您還沒有建立任何手冊草稿</h2>
                            <p className="text-gray-500 mb-6">點擊下方按鈕開始製作您的第一本旅遊手冊，所有變更將隨螢幕停頓 20 秒自動儲存。</p>
                            <button
                                onClick={handleCreate}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
                            >
                                <Plus size={20} />
                                立即建立
                            </button>
                        </div>
                    ) : (
                        <>
                            <h2 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
                                我的草稿列表
                                <span className="text-sm font-medium bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                                    {brochures.length} 份
                                </span>
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {brochures.map((meta) => (
                                    <div
                                        key={meta.id}
                                        onClick={() => onSelectBrochure(meta.id)}
                                        className="group bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer overflow-hidden flex flex-col h-48"
                                    >
                                        <div className="flex-1 p-5">
                                            <div className="flex items-start justify-between mb-3">
                                                <h3 className="font-bold text-gray-900 text-lg leading-tight line-clamp-2">
                                                    {meta.title}
                                                </h3>
                                            </div>
                                            <p className="text-sm text-gray-500 line-clamp-1 mb-4">
                                                {meta.agency || '未設定旅行社'}
                                            </p>

                                            <div className="flex flex-col gap-1.5 mt-auto">
                                                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                                                    <Calendar size={12} />
                                                    更新：{formatDate(meta.updatedAt)}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-gray-50 px-4 py-3 border-t border-gray-100 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={(e) => handleDuplicate(e, meta.id)}
                                                className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
                                            >
                                                <Copy size={16} />
                                                複製
                                            </button>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={(e) => handleInvalidate(e, meta.id)}
                                                        className="flex items-center gap-1.5 text-sm font-medium text-amber-600 hover:text-amber-700 transition-colors p-1 hover:bg-amber-50 rounded"
                                                        title="作廢手冊"
                                                    >
                                                        <Archive size={16} />
                                                        <span className="hidden lg:inline text-xs">作廢</span>
                                                    </button>
                                                    <button
                                                        onClick={(e) => handleDelete(e, meta.id)}
                                                        className="flex items-center gap-1.5 text-sm font-medium text-red-500 hover:text-red-600 transition-colors p-1 hover:bg-red-50 rounded"
                                                        title="永久刪除"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}
