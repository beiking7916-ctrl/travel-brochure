import React from 'react';
import { History, UserCircle, Clock, X } from 'lucide-react';

interface Log {
    id: string;
    editor_name: string;
    action_type: string;
    created_at: string;
}

interface HistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    logs: Log[];
}

export function HistoryModal({ isOpen, onClose, title, logs }: HistoryModalProps) {
    if (!isOpen) return null;

    const formatFullDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('zh-TW', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 no-print">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col overflow-hidden max-h-[80vh] animate-in fade-in zoom-in duration-200">
                
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <div className="flex items-center gap-3">
                        <History size={20} className="text-blue-600" />
                        <h3 className="font-bold text-gray-800">修改歷程回溯</h3>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
                        <X size={20} className="text-gray-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1 bg-gray-50/30">
                    <div className="mb-4">
                        <p className="text-sm font-medium text-gray-500 mb-1">手冊標題</p>
                        <p className="font-bold text-gray-800">{title}</p>
                    </div>

                    <div className="space-y-4">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">最近的修改活動</p>
                        {logs.length === 0 ? (
                            <div className="text-center py-10 text-gray-400 italic">尚未有任何修改紀錄</div>
                        ) : (
                            <div className="space-y-3 relative before:absolute before:inset-y-0 before:left-3 before:w-0.5 before:bg-gray-100">
                                {logs.map((log) => (
                                    <div key={log.id} className="relative pl-8 pb-1">
                                        <div className="absolute left-1.5 top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white bg-blue-500 z-10" />
                                        <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                                            <div className="flex items-center gap-2 mb-1">
                                                <UserCircle size={14} className="text-gray-400" />
                                                <span className="text-sm font-bold text-gray-700">{log.editor_name || '系統'}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                <Clock size={12} />
                                                <span>{formatFullDate(log.created_at)}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 bg-white flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-gray-800 text-white text-sm font-medium rounded-lg hover:bg-gray-900 transition-colors"
                    >
                        關閉
                    </button>
                </div>
            </div>
        </div>
    );
}
