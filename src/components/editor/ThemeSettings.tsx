import React from 'react';
import { useBrochure } from '../../context/BrochureContext';
import { themes } from '../../types';

export function ThemeSettings() {
  const { data, setTheme, updateData } = useBrochure();

  const handleCustomColor = (key: 'primary' | 'secondary' | 'text', value: string) => {
    updateData({
      theme: {
        ...data.theme,
        [key]: value,
      },
    });
  };

  return (
    <div className="space-y-5">
      <h3 className="font-semibold text-lg flex items-center gap-2 mb-2" style={{ color: data.theme.primary }}>
        🌈 色系設定
      </h3>

      <div className="bg-white border border-gray-200 p-5 rounded-xl shadow-sm space-y-6">

        {/* 預設主題區 */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">選擇專業配色</h4>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(themes).map(([name, theme]) => {
              const isActive = data.theme.primary === theme.primary;
              return (
                <button
                  key={name}
                  onClick={() => setTheme(theme)}
                  className={`relative p-3 rounded-xl border-2 transition-all overflow-hidden ${isActive ? 'border-blue-500 shadow-sm ring-2 ring-blue-500/20' : 'border-gray-100 hover:border-blue-200'
                    }`}
                  style={{ backgroundColor: theme.secondary }}
                >
                  <div className="flex flex-col items-center gap-2 relative z-10">
                    <div
                      className="w-8 h-8 rounded-full shadow-sm border-2 border-white"
                      style={{ backgroundColor: theme.primary }}
                    />
                    <span className="text-sm font-bold tracking-wider" style={{ color: theme.text }}>
                      {name === 'business' && '商務深藍'}
                      {name === 'nature' && '質感森綠'}
                      {name === 'romance' && '煙燻玫瑰'}
                      {name === 'energy' && '陶土暖橘'}
                    </span>
                  </div>
                  {isActive && (
                    <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-blue-500" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 自訂顏色區 */}
        <div className="space-y-4 pt-5 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-700">進階自訂顏色</h4>
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">Expert</span>
          </div>

          <div className="space-y-3">
            {[
              { id: 'primary', label: '主色 (標題/裝飾)', val: data.theme.primary },
              { id: 'secondary', label: '輔助色 (背景)', val: data.theme.secondary },
              { id: 'text', label: '文字色 (內文)', val: data.theme.text },
            ].map((color) => (
              <label key={color.id} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg border border-gray-100 hover:bg-white transition-colors cursor-pointer group">
                <span className="text-sm font-medium text-gray-600 group-hover:text-gray-900">{color.label}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 font-mono uppercase">{color.val}</span>
                  <div className="relative w-8 h-8 rounded-md overflow-hidden shadow-sm border border-gray-200">
                    <input
                      type="color"
                      value={color.val}
                      onChange={(e) => handleCustomColor(color.id as any, e.target.value)}
                      className="absolute inset-[-10px] w-12 h-12 cursor-pointer"
                    />
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>
        {/* 字體選擇 */}
        <div className="space-y-4 pt-5 border-t border-gray-100">
          <h4 className="text-sm font-medium text-gray-700">內容字體設定</h4>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: '思源黑體', value: "'Noto Sans TC', sans-serif" },
              { label: '思源宋體', value: "'Noto Serif TC', serif" },
              { label: '微軟正黑體', value: "'Microsoft JhengHei', sans-serif" },
              { label: '楷體風格', value: "'Kaiti TC', 'STKaiti', 'KaiTi', serif" },
            ].map((font) => {
              const isActive = (data.fontFamily || "'Noto Sans TC', sans-serif") === font.value;
              return (
                <button
                  key={font.value}
                  onClick={() => updateData({ fontFamily: font.value })}
                  className={`px-3 py-2 text-xs rounded-lg border-2 transition-all text-center ${isActive
                      ? 'border-blue-500 bg-blue-50 text-blue-700 font-bold'
                      : 'border-gray-100 hover:border-blue-200 text-gray-600'
                    }`}
                  style={{ fontFamily: font.value }}
                >
                  {font.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 字體大小設定 */}
        <div className="space-y-4 pt-5 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-700">內容字體大小</h4>
            <span className="text-sm font-bold bg-blue-50 text-blue-600 px-2.5 py-1 rounded-md border border-blue-100 italic font-mono">
              {data.contentFontSize || 14} px
            </span>
          </div>

          <div className="px-1 py-1 text-gray-400">
            <input
              type="range"
              min="10"
              max="24"
              step="1"
              value={data.contentFontSize || 14}
              onChange={(e) => updateData({ contentFontSize: parseInt(e.target.value) })}
              className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between mt-2 text-[10px] font-bold uppercase tracking-widest px-1">
              <span>極小 (10px)</span>
              <span>建議 (14px)</span>
              <span>極大 (24px)</span>
            </div>
          </div>
        </div>

        {/* 圖片高度調整 */}
        <div className="space-y-4 pt-5 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-700">圖片顯示高度 (縮放比例)</h4>
            <span className="text-sm font-bold bg-green-50 text-green-600 px-2.5 py-1 rounded-md border border-green-100 italic font-mono">
              {Math.round((data.imageHeightScale || 1.0) * 100)} %
            </span>
          </div>

          <div className="px-1 py-1 text-gray-400">
            <input
              type="range"
              min="0.5"
              max="1.5"
              step="0.05"
              value={data.imageHeightScale || 1.0}
              onChange={(e) => updateData({ imageHeightScale: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
            />
            <div className="flex justify-between mt-2 text-[10px] font-bold uppercase tracking-widest px-1">
              <span>極小 (50%)</span>
              <span>適中 (100%)</span>
              <span>極大 (150%)</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
