import React from 'react';
import { useBrochure } from '../../context/BrochureContext';
import { Lightbulb, AlertCircle } from 'lucide-react';
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

const CLASSIC_TIPS_LABELS = {
  airport: '機 場 集 合 與 行 李 準 備 篇',
  security: '安 檢 規 定',
  immigration: '出 境 流 程',
  luggage: '托 運 行 李 相 關 規 定',
  destination: '目 的 地 旅 遊 注 意 事 項',
};

export function TipsPage() {
  const { data } = useBrochure();
  const sortedTips = data.gridTips; // 保持 9 宮格順序

  return (
    <PageWrapper title="旅遊注意事項" icon={<AlertCircle size={24} />}>
      <div className="flex flex-col h-full bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.06)] border border-gray-100 p-8 mt-4">
        <div className="space-y-8">
          {Object.entries(CLASSIC_TIPS_LABELS).map(([key, label]) => {
            const content = data.tips[key as keyof typeof CLASSIC_TIPS_LABELS] as string;
            const sections = key === 'destination' ? data.tips.destinationSections : [];

            if (!content && (!sections || sections.length === 0)) return null;

            return (
              <div key={key} className="flex gap-6">
                <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${data.theme.primary}15`, color: data.theme.primary }}>
                  <AlertCircle size={24} strokeWidth={1.5} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold mb-2 tracking-widest text-gray-800 border-b border-gray-100 pb-1 inline-block">{label}</h3>

                  {content && (
                    <p className="text-gray-600 leading-relaxed text-justify whitespace-pre-wrap mb-4 font-medium italic">
                      {content}
                    </p>
                  )}

                  {sections && sections.length > 0 && (
                    <div className="grid grid-cols-1 gap-4">
                      {sections.map((section, sIdx) => (
                        <div key={sIdx} className="bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                          <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            {section.title}
                          </h4>
                          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                            {section.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </PageWrapper>
  );
}
