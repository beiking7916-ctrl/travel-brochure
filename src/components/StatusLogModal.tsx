import React from 'react';
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
    if (!isOpen) return null;

    const getIcon = (level: LogLevel) => {
        switch (level) {
            case 'info': return <Loader2 size={16} className="text-blue-500 animate-spin" />;
            case 'success': return <CheckCircle2 size={16} className="text-green-500" />;
            case 'error': return <XCircle size={16} className="text-red-500" />;
            case 'warning': return <AlertCircle size={16} className="text-orange-500" />;
        }
    };

    const getLogStyle = (level: LogLevel) => {
        switch (level) {
            case 'info': return "bg-blue-50 text-blue-800 border-blue-100";
            case 'success': return "bg-green-50 text-green-800 border-green-100";
            case 'error': return "bg-red-50 text-red-800 border-red-100 font-medium";
            case 'warning': return "bg-orange-50 text-orange-800 border-orange-100";
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 no-print">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg flex flex-col overflow-hidden max-h-[80vh] animate-in fade-in zoom-in duration-200">

                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <div className="flex items-center gap-3">
                        {isProcessing ? (
                            <Loader2 size={20} className="text-blue-500 animate-spin" />
                        ) : (
                            logs.some(l => l.level === 'error') ? (
                                <XCircle size={20} className="text-red-500" />
                            ) : (
                                <CheckCircle2 size={20} className="text-green-500" />
                            )
                        )}
                        <h3 className="font-bold text-gray-800">{title}</h3>
                    </div>
                    {!isProcessing && (
                        <button
                            onClick={onClose}
                            className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-full transition-colors"
                        >
                            關閉
                        </button>
                    )}
                </div>

                {/* Logs Container */}
                <div className="p-6 overflow-y-auto flex-1 bg-gray-50/30 space-y-3">
                    {logs.map((log) => (
                        <div
                            key={log.id}
                            className={`flex items-start gap-3 p-3 rounded-xl border ${getLogStyle(log.level)} shadow-sm transition-all`}
                        >
                            <div className="mt-0.5 flex-shrink-0">
                                {getIcon(log.level)}
                            </div>
                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                                <p className="text-sm leading-snug break-words">{log.message}</p>
                                <div className="text-[10px] opacity-60 font-mono mt-1">
                                    {log.timestamp.toLocaleTimeString()}
                                </div>
                            </div>
                        </div>
                    ))}

                    {logs.length === 0 && (
                        <div className="h-24 flex items-center justify-center text-gray-400 text-sm">
                            準備中...
                        </div>
                    )}

                    {/* 讓滾動條保持在最下方的小塊 */}
                    <div className="h-1" ref={(el) => { if (el) el.scrollIntoView({ behavior: 'smooth' }) }} />
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 bg-white">
                    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-300 ${isProcessing ? 'bg-blue-500 w-full animate-pulse' : (logs.some(l => l.level === 'error') ? 'bg-red-500 w-full' : 'bg-green-500 w-full')}`}
                        />
                    </div>
                </div>

            </div>
        </div>
    );
}
