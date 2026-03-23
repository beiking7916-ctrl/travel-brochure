import React, { useRef, useState } from 'react';
import { Printer, Download, Upload, CloudUpload, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useBrochure } from '../context/BrochureContext';
import type { BrochureData } from '../types';
// 移除大量渲染套件，改用原生列印以最佳化效能
import { supabase } from '../lib/supabase';
import { storage } from '../lib/storage';
import { StatusLogModal, LogEntry, LogLevel } from './StatusLogModal';

export function Header({
    currentId,
    onBackToDashboard,
    saveStatus
}: {
    currentId?: string,
    onBackToDashboard?: () => void,
    saveStatus?: 'saved' | 'saving' | 'unsaved'
}) {
    const { data, updateData } = useBrochure();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    const [isSavingCloud, setIsSavingCloud] = useState(false);

    // Status Log State
    const [isLogOpen, setIsLogOpen] = useState(false);
    const [logTitle, setLogTitle] = useState('');
    const [logs, setLogs] = useState<LogEntry[]>([]);

    const addLog = (message: string, level: LogLevel = 'info') => {
        setLogs(prev => [...prev, { id: crypto.randomUUID(), message, level, timestamp: new Date() }]);
    };

    const handleSaveToCloud = async () => {
        if (!supabase) {
            alert('請先在 .env 設定好 VITE_SUPABASE_URL 與 VITE_SUPABASE_ANON_KEY');
            return;
        }

        setLogTitle('儲存至雲端');
        setLogs([]);
        setIsLogOpen(true);
        setIsSavingCloud(true);
        addLog('開始連接 Supabase...');

        try {
            const urlParams = new URLSearchParams(window.location.search);
            // 優先使用從 App 傳下來的 currentId，避免讀取網址失敗
            const existingId = currentId || urlParams.get('id');
            const dataToSave = { ...data };

            if (existingId) {
                addLog(`找到現有 ID: ${existingId}，準備更新紀錄...`);
                // 更新現有的資料
                const { error } = await supabase
                    .from('brochures')
                    .update({ data: dataToSave, updated_at: new Date().toISOString() })
                    .eq('id', existingId);

                if (error) throw error;
                addLog('雲端更新成功！您可以繼續使用原連結分享。', 'success');
            } else {
                addLog('建立新紀錄...');
                // 新增一筆資料
                const { data: result, error } = await supabase
                    .from('brochures')
                    .insert({ data: dataToSave })
                    .select('id')
                    .single();

                if (error) throw error;

                addLog(`雲端儲存成功！獲得新 ID: ${result.id}`, 'success');

                // ⭐ 關鍵：立即把資料存進 localStorage（以 Supabase ID 為 key）
                // 這樣重載後直接從本機讀取，不需要再去 Supabase 抓取，避免重複建立新紀錄
                storage.saveBrochure(result.id, dataToSave);

                // 更新網址加上 id
                const newUrl = new URL(window.location.href);
                newUrl.searchParams.set('id', result.id);
                window.history.pushState({}, '', newUrl.toString());
                addLog('網址已更新，請複製當前網址來分享您的手冊。', 'success');
                // 重新載入以套用新的 ID
                setTimeout(() => window.location.reload(), 1500);
            }
        } catch (error: any) {
            console.error('儲存到 Supabase 失敗:', error);
            addLog(`儲存失敗：${error.message || '未知錯誤，請確認 table(brochures) 是否已建立'}`, 'error');
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
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${isSavingCloud ? 'opacity-70 cursor-wait bg-blue-50' : 'hover:bg-blue-50 text-blue-700 border-blue-200'}`}
                    title="儲存草稿到 Supabase 雲端並取得分享連結"
                >
                    <CloudUpload size={18} className={isSavingCloud ? 'animate-pulse' : ''} />
                    {isSavingCloud ? '儲存中...' : '儲存至雲端'}
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
                onClose={() => setIsLogOpen(false)}
            />
        </header>
    );
}
