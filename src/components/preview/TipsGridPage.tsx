import React from 'react';
import { useBrochure } from '../../context/BrochureContext';
import { Lightbulb } from 'lucide-react';
import { PageWrapper } from './PageWrapper';

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

    return (
        <PageWrapper title="貼心小叮嚀" icon={<Lightbulb size={24} />}>
            <div className="flex-grow flex flex-col justify-center w-full px-2 py-4">
                <div className="grid grid-cols-3 gap-5 h-full auto-rows-fr">
                    {sortedTips.map((tip) => (
                        <div
                            key={tip.id}
                            className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.06)] border border-gray-100 overflow-hidden flex flex-col relative"
                        >
                            <div
                                className="absolute top-0 left-0 w-24 h-10 rounded-br-3xl flex items-center pl-4 z-10"
                                style={{ backgroundColor: data.theme.primary, color: 'white' }}
                            >
                                <h3 className="font-bold text-sm tracking-widest">{tip.title}</h3>
                            </div>

                            <div className="flex-1 p-4 pt-12 flex flex-col">
                                <div className="h-24 w-full flex items-center justify-center mb-3">
                                    {tip.image ? (
                                        <img
                                            src={tip.image}
                                            alt={tip.title}
                                            className="max-h-full max-w-full object-contain filter drop-shadow hover:scale-105 transition-transform"
                                        />
                                    ) : (
                                        <div className="text-5xl opacity-80 filter drop-shadow-sm">
                                            {defaultIcons[tip.id] || '💡'}
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1 flex flex-col justify-end">
                                    <p className="text-[11px] leading-relaxed text-gray-700 whitespace-pre-wrap flex-grow-0">
                                        {tip.content}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </PageWrapper>
    );
}
