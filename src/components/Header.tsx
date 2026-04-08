import React, { useRef, useState } from 'react';
import { Printer, Download, Upload, CloudUpload, ArrowLeft, CheckCircle2, Globe } from 'lucide-react';
import { useBrochure } from '../context/BrochureContext';
import { PublishModal } from './PublishModal';
import type { BrochureData } from '../types';
// 移除大量渲染套件，改用原生列印以最佳化效能
import { supabase } from '../lib/supabase';
import { storage } from '../lib/storage';
import { StatusLogModal, LogEntry, LogLevel } from './StatusLogModal';

export function Header({
    currentId,
    onBackToDashboard,
    saveStatus,
    onlineUsers = []
}: {
    currentId?: string,
    onBackToDashboard?: () => void,
    saveStatus?: 'saved' | 'saving' | 'unsaved',
    onlineUsers?: string[]
}) {
    const { data, updateData } = useBrochure();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    const [isSavingCloud, setIsSavingCloud] = useState(false);

    // Status Log State
    const [isLogOpen, setIsLogOpen] = useState(false);
    const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
    const [logTitle, setLogTitle] = useState('');
    const [logs, setLogs] = useState<LogEntry[]>([]);

    const addLog = (message: string, level: LogLevel = 'info') => {
        setLogs(prev => [...prev, { id: crypto.randomUUID(), message, level, timestamp: new Date() }]);
    };

    const [isConfirmingSave, setIsConfirmingSave] = useState(false);

    const handleSaveToCloud = () => {
        if (!supabase) {
            alert('系統尚未連接至雲端資料庫');
            return;
        }
        setLogTitle('同步至雲端');
        setLogs([]);
        setIsConfirmingSave(true);
        setIsLogOpen(true);
    };

    const startCloudSaveSync = async () => {
        setIsConfirmingSave(false);
        setIsSavingCloud(true);

        const urlParams = new URLSearchParams(window.location.search);
        const existingId = currentId || urlParams.get('id');
        
        if (!existingId) {
            alert('手冊 ID 遺失，無法進行雲端同步');
            return;
        }

        try {
            const dataToSave = { ...data };
            const result = await storage.saveBrochure(existingId, dataToSave);

            if (result.success) {
                setLogs([{ id: '1', message: '儲存成功', level: 'success', timestamp: new Date() }]);
            } else {
                throw new Error(result.error || '同步過程發生未知錯誤');
            }
        } catch (error: any) {
            console.error('儲存失敗:', error);
            setLogs([{ id: 'err', message: error.message || '儲存失敗，請檢查網路連線', level: 'error', timestamp: new Date() }]);
        } finally {
            setIsSavingCloud(false);
        }
    };

    const handlePrint = () => {
        // 標準 A5 直式列印
        const oldTitle = document.title;
        const now = new Date();
        const mm = (now.getMonth() + 1).toString().padStart(2, '0');
        const dd = now.getDate().toString().padStart(2, '0');
        const mmdd = `${mm}${dd}`;
        
        // 暫時修改標題以改變輸出 PDF 檔名
        document.title = `${data.title || '旅遊手冊'}－手冊${mmdd}`;

        document.body.classList.remove('print-cover-mode');
        const printStyle = document.createElement('style');
        printStyle.id = 'force-fullpage-print';
        printStyle.innerHTML = `
            @page { size: A5 portrait; margin: 0 !important; }
            @media print { html, body { margin: 0 !important; padding: 0 !important; } }
        `;
        document.head.appendChild(printStyle);
        window.print();

        setTimeout(() => {
            document.title = oldTitle;
            const el = document.getElementById('force-fullpage-print');
            if (el) el.remove();
        }, 1000);
    };

    const handlePrintCover = () => {
        // A4 橫式封面+封底跨頁列印
        const oldTitle = document.title;
        const now = new Date();
        const mm = (now.getMonth() + 1).toString().padStart(2, '0');
        const dd = now.getDate().toString().padStart(2, '0');
        const mmdd = `${mm}${dd}`;
        
        // 暫時修改標題以改變輸出 PDF 檔名
        document.title = `${data.title || '旅遊手冊'}－封面封底_${mmdd}`;

        document.body.classList.add('print-cover-mode');
        const printStyle = document.createElement('style');
        printStyle.id = 'force-spread-print';
        printStyle.innerHTML = `
            @page { size: A4 landscape; margin: 0 !important; }
            @media print { html, body { margin: 0 !important; padding: 0 !important; } }
        `;
        document.head.appendChild(printStyle);
        window.print();

        setTimeout(() => {
            document.title = oldTitle;
            document.body.classList.remove('print-cover-mode');
            const el = document.getElementById('force-spread-print');
            if (el) el.remove();
        }, 1000);
    };

    const handleExport = () => {
        // 建立可下載的 JSON 字串
        const dataStr = JSON.stringify(data, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

        const now = new Date();
        const mm = (now.getMonth() + 1).toString().padStart(2, '0');
        const dd = now.getDate().toString().padStart(2, '0');
        const mmdd = `${mm}${dd}`;
        
        // 產生預設檔名：標題＋草稿_mmdd
        const exportFileDefaultName = `${data.title || '旅遊手冊'}－草稿_${mmdd}.json`;

        // 模擬點擊下載連結
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    };

    const handleImportClick = () => {
        // 觸發隱藏的 file input
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const result = e.target?.result as string;
                const importedData = JSON.parse(result) as BrochureData;

                // 基本的結構驗證 (檢查是否有必要的欄位)
                if (importedData && typeof importedData === 'object' && 'itineraries' in importedData && 'theme' in importedData) {
                    updateData(importedData);
                    alert('資料匯入成功！');
                } else {
                    alert('匯入失敗：檔案格式不正確或缺少必要資料。');
                }
            } catch (error) {
                console.error('Error parsing JSON:', error);
                alert('匯入失敗：無法解析 JSON 檔案。');
            }

            // 清空 input，允許重複上傳相同檔案
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        };
        reader.readAsText(file);
    };

    return (
        <header
            className="h-16 flex items-center justify-between px-6 border-b no-print"
            style={{ backgroundColor: 'white', borderColor: '#e5e7eb' }}
        >
            <div className="flex items-center gap-4">
                {onBackToDashboard && (
                    <button
                        onClick={onBackToDashboard}
                        className="p-2 -ml-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        title="回主控台"
                    >
                        <ArrowLeft size={20} />
                    </button>
                )}
                <h1
                    className="text-xl font-bold"
                    style={{ color: '#1e3a5f' }}
                >
                    📖 旅遊手冊產生器
                </h1>

                {saveStatus && (
                    <div className="ml-4 flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-gray-50 text-gray-500 border border-gray-100">
                        {saveStatus === 'saving' && <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" /> 儲存中...</span>}
                        {saveStatus === 'saved' && <span className="flex items-center gap-1 text-green-600"><CheckCircle2 size={12} />已自動儲存</span>}
                        {saveStatus === 'unsaved' && <span className="flex items-center gap-1 text-amber-500">待儲存...</span>}
                    </div>
                )}

                {/* 在線協作者顯示 */}
                {onlineUsers.length > 1 && (
                    <div className="ml-2 flex items-center -space-x-2">
                        {onlineUsers.map((user, idx) => (
                            <div 
                                key={idx}
                                title={`${user} 正在編輯中`}
                                className="w-7 h-7 rounded-full border-2 border-white bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-600 cursor-help"
                                style={{ zIndex: 10 - idx }}
                            >
                                {user.substring(0, 1)}
                            </div>
                        ))}
                        <span className="ml-3 text-[10px] text-gray-400 font-medium">其他 {onlineUsers.length - 1} 人在線</span>
                    </div>
                )}
            </div>

            <div className="flex items-center gap-3">
                {/* 隱藏的檔案上傳元素 */}
                <input
                    type="file"
                    accept=".json"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                />

                <button
                    onClick={handleSaveToCloud}
                    disabled={isSavingCloud}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border font-bold transition-all active:scale-95 shadow-sm ${
                        isSavingCloud 
                            ? 'opacity-70 cursor-wait bg-blue-50 border-blue-100 text-blue-500' 
                            : saveStatus === 'unsaved'
                                ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700 hover:shadow-md animate-pulse'
                                : 'bg-white hover:bg-blue-50 text-blue-700 border-blue-200'
                    }`}
                    title="儲存草稿到 Supabase 雲端並取得分享連結"
                >
                    <CloudUpload size={18} className={isSavingCloud ? 'animate-spin' : ''} />
                    {isSavingCloud ? '正在同步...' : '強制儲存'}
                </button>

                <button
                    onClick={handleImportClick}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors hover:bg-gray-50 text-gray-700 border-gray-300"
                    title="從電腦載入之前儲存的手冊資料"
                >
                    <Upload size={18} />
                    匯入紀錄
                </button>

                <button
                    onClick={handleExport}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors hover:bg-gray-50 text-gray-700 border-gray-300"
                    title="將目前的手冊資料存成檔案下載"
                >
                    <Download size={18} />
                    儲存草稿
                </button>

                <button
                    onClick={handlePrintCover}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-blue-200 transition-colors hover:bg-blue-50 text-blue-700"
                    title="將封面與封底拼成一張 A4 橫式列印"
                >
                    <div className="flex -space-x-1">
                        <Printer size={16} />
                        <Printer size={16} className="opacity-50" />
                    </div>
                    封面跨頁 (A4)
                </button>

                <button
                    onClick={() => setIsPublishModalOpen(true)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all ml-1 hover:opacity-90 active:scale-95 ${
                        data.isPublished 
                        ? 'bg-green-600 text-white shadow-lg shadow-green-200 animate-pulse' 
                        : 'bg-blue-600 text-white shadow-lg shadow-blue-100'
                    }`}
                >
                    <Globe size={18} />
                    {data.isPublished ? '已發佈' : '發佈'}
                </button>

                <button
                    onClick={handlePrint}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-white transition-opacity ml-1 hover:opacity-90 active:scale-95"
                    style={{ backgroundColor: '#1e3a5f' }}
                >
                    <Printer size={18} />
                    手冊全文 (PDF)
                </button>
            </div>
            <StatusLogModal
                isOpen={isLogOpen}
                title={logTitle}
                logs={logs}
                isProcessing={isGeneratingPDF || isSavingCloud}
                isConfirming={isConfirmingSave}
                onConfirm={startCloudSaveSync}
                onClose={() => {
                    setIsLogOpen(false);
                    setIsConfirmingSave(false);
                }}
            />
            <PublishModal 
                isOpen={isPublishModalOpen} 
                onClose={() => setIsPublishModalOpen(false)} 
            />
        </header>
    );
}
