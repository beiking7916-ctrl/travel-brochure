import React, { useEffect } from 'react';
import { Loader2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

export type LogLevel = 'info' | 'success' | 'error' | 'warning';

export interface LogEntry {
    id: string;
    message: string;
    level: LogLevel;
    timestamp: Date;
}

interface StatusLogModalProps {
    isOpen: boolean;
    title: string;
    logs: LogEntry[];
    isProcessing: boolean;
    onClose: () => void;
}

export function StatusLogModal({ isOpen, title, logs, isProcessing, onClose }: StatusLogModalProps) {
    const hasError = logs.some(l => l.level === 'error');
    const isSuccess = !isProcessing && logs.some(l => l.level === 'success') && !hasError;

    // 成功後自動關閉
    useEffect(() => {
        if (isSuccess && isOpen) {
            const timer = setTimeout(() => {
                onClose();
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [isSuccess, isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 no-print">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">
                
                <div className="p-10 flex flex-col items-center text-center">
                    {/* 主要動畫區 */}
                    <div className="relative w-24 h-24 mb-6 flex items-center justify-center">
                        {isProcessing && (
                            <>
                                <div className="absolute inset-0 border-4 border-blue-100 rounded-full" />
                                <Loader2 size={48} className="text-blue-600 animate-spin relative z-10" />
                            </>
                        )}
                        
                        {isSuccess && (
                            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-200 animate-check">
                                <CheckCircle2 size={48} className="text-white" />
                            </div>
                        )}

                        {hasError && (
                            <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center shadow-lg shadow-red-200 animate-check">
                                <XCircle size={48} className="text-white" />
                            </div>
                        )}
                    </div>

                    {/* 狀態文字 */}
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">
                        {isProcessing ? (title === '產生 PDF' ? '正在產生' : '同步中') : (isSuccess ? '執行成功' : '執行失敗')}
                    </h3>
                    
                    <p className="text-gray-500 px-4">
                        {isProcessing 
                            ? (title === '產生 PDF' ? '正在編排您的手冊 PDF 並準備下載...' : '正在將您的變更同步至雲端系統...') 
                            : (isSuccess 
                                ? (title === '產生 PDF' ? '手冊 PDF 已產生完成，正在為您下載。' : '所有資料已安全儲存至雲端。')
                                : '執行過程中發生錯誤，請檢查網路。')}
                    </p>

                    {/* 錯誤詳情 (僅在出錯時顯示) */}
                    {hasError && (
                        <div className="mt-6 w-full text-left bg-red-50 rounded-2xl p-4 border border-red-100 max-h-32 overflow-y-auto">
                            {logs.filter(l => l.level === 'error').map(log => (
                                <p key={log.id} className="text-xs text-red-600 flex items-start gap-2">
                                    <AlertCircle size={12} className="mt-0.5 flex-shrink-0" />
                                    {log.message}
                                </p>
                            ))}
                        </div>
                    )}

                    {/* 成功後的進度條 */}
                    {isSuccess && (
                        <div className="mt-8 w-24 h-1 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-green-500 animate-[progress-pulse_2s_ease-in-out_infinite]" />
                        </div>
                    )}
                </div>

                {/* 按鈕區 (處理中不顯示，出錯時顯示) */}
                {(!isProcessing || hasError) && (
                    <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-center">
                        <button
                            onClick={onClose}
                            className={`px-8 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 ${
                                hasError ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-gray-800 text-white hover:bg-gray-900'
                            }`}
                        >
                            {isSuccess ? '完成' : '返回'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

