import React from 'react';
import { useBrochure } from '../../context/BrochureContext';
import { Lightbulb, CheckSquare } from 'lucide-react';
import { PageWrapper } from './PageWrapper';
import { parseRichText } from '../../lib/textParser';

// 預設 SVG 圖示對應表 (如果使用者沒有自行上傳)
const defaultIcons: Record<string, string> = {
    clothes: '👕',
    items: '🎒',
    weather: '☀️',
    time: '⏰',
    power: '🔌',
    money: '💵',
    customs: '🛂',
    comms: '📱',
    bag: '🧳',
};

export function TipsGridPage() {
    const { data } = useBrochure();
    const sortedTips = data.gridTips; // 保持 9 宮格順序

    // 如果是單一模式，渲染一個大的置中卡片
    if (data.gridTipsSingle) {
        const tip = sortedTips[0];
        if (!tip) return null;
        return (
            <PageWrapper sectionId="gridTips" title="貼心小叮嚀" icon={<CheckSquare size={18} />}>
                <div className="flex flex-col items-center justify-center h-full py-12 px-8">
                    <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-10 w-full max-w-lg flex flex-col items-center text-center space-y-8 transform hover:scale-[1.02] transition-transform duration-500">
                        {tip.image ? (
                            <div className="w-32 h-32 rounded-2xl overflow-hidden bg-gray-50 p-2 shadow-inner">
                                <img src={tip.image} alt={tip.title} className="w-full h-full object-contain" />
                            </div>
                        ) : (
                            <div className="w-24 h-24 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                                <CheckSquare size={48} strokeWidth={1.5} />
                            </div>
                        )}
                        <div className="space-y-4 w-full">
                            <h3 className="text-2xl font-black tracking-tight" style={{ color: data.theme.primary }}>
                                {tip.title}
                            </h3>
                            <div className="w-12 h-1 bg-blue-500/20 mx-auto rounded-full" />
                            <p className="dynamic-text text-gray-700 text-lg leading-relaxed whitespace-pre-wrap font-medium">
                                {parseRichText(tip.content, data.theme.primary)}
                            </p>
                        </div>
                    </div>
                </div>
            </PageWrapper>
        );
    }

    return (
        <PageWrapper sectionId="gridTips" title="貼心小叮嚀" icon={<CheckSquare size={24} />}>
            <div className="flex-grow flex flex-col justify-center w-full px-2 py-2">
                <div className="grid grid-cols-3 gap-3 h-full auto-rows-fr">
                    {sortedTips.map((tip) => {
                        const tipSettings = data.pageSettings?.[tip.id];
                        const tipFontSize = tipSettings?.fontSize || data.contentFontSize || 14;
                        const tipImageScale = tipSettings?.imageScale || data.imageHeightScale || 1.0;
                        
                        return (
                        <div
                            key={tip.id}
                            className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.06)] border border-gray-100 overflow-hidden flex flex-col relative"
                        >
                            <div
                                className="absolute top-0 left-0 w-20 h-7 rounded-br-3xl flex items-center pl-3 z-10"
                                style={{ backgroundColor: data.theme.primary, color: 'white' }}
                            >
                                <h3 className="font-bold text-xs tracking-widest">{tip.title}</h3>
                            </div>

                            <div className="flex-1 p-3 pt-9 flex flex-col items-center">
                                <div 
                                    className="flex items-center justify-center mb-2"
                                    style={{ 
                                        width: `${56 * tipImageScale}px`, 
                                        height: `${56 * tipImageScale}px` 
                                    }}
                                >
                                    {tip.image ? (
                                        <img
                                            src={tip.image}
                                            alt={tip.title}
                                            className="w-full h-full object-contain filter drop-shadow hover:scale-105 transition-transform"
                                        />
                                    ) : (
                                        <div className="text-4xl opacity-80 filter drop-shadow-sm">
                                            {defaultIcons[tip.id] || '💡'}
                                        </div>
                                    )}
                                </div>

                                <div className="w-full flex-1 flex flex-col justify-center">
                                    <p 
                                        className="dynamic-text leading-relaxed text-gray-700 text-left whitespace-pre-wrap"
                                        style={{ fontSize: `${tipFontSize}px` }}
                                    >
                                        {parseRichText(tip.content, data.theme.primary)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )})}
                </div>
            </div>
        </PageWrapper>
    );
}
