import React, { useState } from 'react';
import { useBrochure } from '../../context/BrochureContext';
import { Briefcase, Plus, Trash2, Star } from 'lucide-react';
import { SectionSettings } from './SectionSettings';

export function PackingListForm() {
  const { data, addPackingItem, removePackingItem } = useBrochure();
  const [newItem, setNewItem] = useState('');
  const [isImportant, setIsImportant] = useState(false);

  const handleAdd = () => {
    if (newItem.trim()) {
      addPackingItem(newItem.trim(), isImportant);
      setNewItem('');
      setIsImportant(false);
    }
  };

  return (
    <div className="space-y-4">
      <SectionSettings id="packing" />
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-lg flex items-center gap-2" style={{ color: data.theme.primary }}>
          <Briefcase size={20} />
          行李清單
        </h3>
      </div>

      <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm space-y-4">
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
              className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all text-sm"
              placeholder="請輸入物品名稱，例如：雨傘"
            />
            <button
              onClick={() => setIsImportant(!isImportant)}
              className={`p-2 rounded-lg border transition-all flex items-center justify-center gap-1.5 ${isImportant
                  ? 'bg-amber-50 border-amber-200 text-amber-600'
                  : 'bg-gray-50 border-gray-200 text-gray-400 hover:text-gray-600'
                }`}
              title={isImportant ? "標註為特別重要" : "設為一般項目"}
            >
              <span className={`text-[10px] font-bold uppercase tracking-widest ${isImportant ? 'opacity-100' : 'opacity-40'}`}>
                Important
              </span>
            </button>
          </div>
          <button
            onClick={handleAdd}
            className="w-full py-2.5 rounded-lg flex items-center justify-center gap-2 font-black text-sm uppercase tracking-[0.1em] transition-opacity hover:opacity-90 shadow-sm"
            style={{ backgroundColor: data.theme.primary, color: 'white' }}
          >
            <Plus size={18} />
            新增至清單 (ADD TO LIST)
          </button>
        </div>

        {data.packingList.length > 0 ? (
          <div className="space-y-2 mt-4 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
            {data.packingList.map((item, index) => (
              <div
                key={index}
                className="group flex items-center justify-between px-3 py-2.5 bg-gray-50/50 border border-transparent hover:border-gray-200 hover:bg-white rounded-lg transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${item.important ? 'border-amber-400 bg-amber-50' : 'border-gray-300'}`}>
                    {item.important && <div className="w-1.5 h-1.5 bg-amber-400 rounded-full shadow-[0_0_8px_rgba(251,191,36,0.6)]"></div>}
                  </div>
                  <span className={`text-sm font-medium ${item.important ? 'text-amber-700 font-bold' : 'text-gray-700'}`}>
                    {item.text}
                  </span>
                </div>
                <button
                  onClick={() => removePackingItem(index)}
                  className="text-gray-400 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all p-1.5 hover:bg-red-50 rounded-md"
                  title="刪除"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-400 text-sm">
            清單空空如也，趕快新增一些必備物品吧！
          </div>
        )}
      </div>
    </div>
  );
}
