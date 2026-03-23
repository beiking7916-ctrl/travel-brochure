import React, { useState } from 'react';
import { useBrochure } from '../../context/BrochureContext';
import { Settings, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';

export function SectionSettings({ id }: { id: string }) {
    const { data, updatePageSetting, updateData } = useBrochure();
    const [isOpen, setIsOpen] = useState(false);
    
    // 取得當前專屬設定
    const settings = data.pageSettings?.[id];
    const fontSize = settings?.fontSize || data.contentFontSize || 14;
    const imageScale = settings?.imageScale || data.imageHeightScale || 1.0;

    const resetToGlobal = () => {
        const newSettings = { ...(data.pageSettings || {}) };
        delete newSettings[id];
        updateData({ pageSettings: newSettings });
    };

    return (
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm mb-4">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-4 py-2 flex items-center justify-between hover:bg-gray-50 transition-colors text-[10px] font-bold text-gray-400 uppercase tracking-widest"
            >
                <div className="flex items-center gap-2">
                    <Settings size={12} className={settings ? "text-blue-500 animate-pulse" : "text-gray-400"} />
                    <span>頁面專屬風格 {settings && <span className="text-blue-500 normal-case">(自訂中)</span>}</span>
                </div>
                {isOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>

            {isOpen && (
                <div className="p-4 border-t border-gray-50 space-y-5 bg-gray-50/10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                        {/* 字體大小 */}
                        <div className="space-y-1.5">
                            <div className="flex justify-between items-center text-[9px] font-black text-gray-400">
                                <span>頁面字體 {settings?.fontSize ? "•" : ""}</span>
                                <span className={settings?.fontSize ? "text-blue-600" : ""}>{fontSize} PX</span>
                            </div>
                            <input 
                                type="range" 
                                min="10" 
                                max="24" 
                                value={fontSize}
                                onChange={(e) => updatePageSetting(id, { fontSize: parseInt(e.target.value) })}
                                className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />
                        </div>

                        {/* 圖片比例 */}
                        <div className="space-y-1.5">
                            <div className="flex justify-between items-center text-[9px] font-black text-gray-400">
                                <span>圖片比例 {settings?.imageScale ? "•" : ""}</span>
                                <span className={settings?.imageScale ? "text-green-600" : ""}>{Math.round(imageScale * 100)} %</span>
                            </div>
                            <input 
                                type="range" 
                                min="0.5" 
                                max="1.5" 
                                step="0.05"
                                value={imageScale}
                                onChange={(e) => updatePageSetting(id, { imageScale: parseFloat(e.target.value) })}
                                className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
                            />
                        </div>
                    </div>

                    {settings && (
                        <button 
                            onClick={resetToGlobal}
                            className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[9px] text-red-400 hover:text-red-500 font-bold bg-red-50/50 rounded-lg transition-colors mt-2"
                        >
                            <RotateCcw size={10} /> 重設為全域樣式
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
