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
    isConfirming?: boolean; // 新增：是否處於等待確認階段
    onConfirm?: () => void; // 新增：確認儲存的回調
    onClose: () => void;
}

export function StatusLogModal({ isOpen, title, logs, isProcessing, isConfirming, onConfirm, onClose }: StatusLogModalProps) {
    const hasError = logs.some(l => l.level === 'error');
    const isSuccess = !isProcessing && !isConfirming && logs.some(l => l.level === 'success') && !hasError;

    // 移除自動關閉邏輯，改為手動確認

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 no-print">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">
                
                <div className="p-10 flex flex-col items-center text-center">
                    {/* 主要動畫區 */}
                    <div className="relative w-24 h-24 mb-6 flex items-center justify-center">
                        {isConfirming && (
                            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center text-blue-500 animate-pulse">
                                <AlertCircle size={48} strokeWidth={1.5} />
                            </div>
                        )}

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
                        {isConfirming ? '準備儲存' : (isProcessing ? (title === '產生 PDF' ? '正在產生' : '同步中') : (isSuccess ? '儲存成功' : '執行失敗'))}
                    </h3>
                    
                    <p className="text-gray-500 px-4">
                        {isConfirming
                            ? '即將將目前所做的所有變更同步至雲端系統，這會覆蓋之前的紀錄。'
                            : (isProcessing 
                                ? (title === '產生 PDF' ? '正在編排您的手冊 PDF 並準備下載...' : '正在將您的變更同步至雲端系統...') 
                                : (isSuccess 
                                    ? (title === '產生 PDF' ? '手冊 PDF 已產生完成，正在為您下載。' : '所有資料已安全儲存至雲端，您可以放心繼續編輯。')
                                    : '執行過程中發生錯誤，請檢查網路。'))}
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
                </div>

                {/* 按鈕區 */}
                <div className="p-5 bg-gray-50 border-t border-gray-100 flex gap-3">
                    {isConfirming ? (
                        <>
                            <button
                                onClick={onClose}
                                className="flex-1 px-4 py-2.5 rounded-xl font-bold text-sm bg-white text-gray-400 border border-gray-200 hover:bg-gray-100 transition-all"
                            >
                                取消
                            </button>
                            <button
                                onClick={onConfirm}
                                className="flex-1 px-4 py-2.5 rounded-xl font-bold text-sm bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-100 transition-all active:scale-95"
                            >
                                立即同步
                            </button>
                        </>
                    ) : (
                        (!isProcessing || hasError) && (
                            <button
                                onClick={onClose}
                                className={`w-full px-8 py-3 rounded-xl font-bold text-sm tracking-widest transition-all active:scale-95 shadow-md ${
                                    hasError 
                                        ? 'bg-red-600 text-white hover:bg-red-700 shadow-red-100' 
                                        : 'bg-gray-800 text-white hover:bg-black shadow-gray-200'
                                }`}
                            >
                                {isSuccess ? '好的，我知道了' : '返回編輯'}
                            </button>
                        )
                    )}
                </div>
            </div>
        </div>
    );
}

