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
      </div>
    </div>
  );
}
