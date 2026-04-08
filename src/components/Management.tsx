import React, { useState, useEffect } from 'react';
import { storage, BrochureMeta } from '../lib/storage';
import { 
  FileText, 
  Search, 
  Globe, 
  Lock, 
  ExternalLink, 
  Copy, 
  Calendar,
  ArrowLeft,
  Link as LinkIcon,
  CheckCircle2,
  Eye
} from 'lucide-react';
import type { BrochureData } from '../types';

interface ManagementProps {
  onBack: () => void;
  onEdit: (id: string) => void;
}

export function Management({ onBack, onEdit }: ManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [brochures, setBrochures] = useState<BrochureMeta[]>([]);
  const [loading, setLoading] = useState(true);

  const loadList = async () => {
    setLoading(true);
    const list = await storage.getList();
    setBrochures(list);
    setLoading(false);
  };

  useEffect(() => {
    loadList();
  }, []);

  const handleTogglePublish = async (e: React.MouseEvent, id: string, currentStatus: boolean) => {
    e.stopPropagation();
    const data = await storage.getBrochure(id);
    if (data) {
      const updatedData: BrochureData = {
        ...data,
        isPublished: !currentStatus
      };
      await storage.saveBrochure(id, updatedData);
      await loadList();
    }
  };

  const handleCopyShortLink = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const url = `${window.location.origin}${window.location.pathname}?mode=ebook&id=${id}`;
    navigator.clipboard.writeText(url);
    alert('已複製電子書閱讀連結至剪貼簿！');
  };

  const filteredBrochures = brochures.filter(b => 
    b.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (b.groupNumber && b.groupNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (b.agency && b.agency.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="h-16 flex items-center justify-between px-8 bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold flex items-center gap-2 text-gray-800">
            <Globe size={24} className="text-blue-600" />
            線上手冊發佈管理
          </h1>
        </div>
      </header>

      <main className="flex-1 p-8 max-w-7xl mx-auto w-full">
        {/* 工具列 */}
        <div className="mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="搜尋標題、團號或旅行社..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all shadow-sm text-sm"
            />
          </div>
          <div className="text-sm text-gray-500 font-medium">
            共 {filteredBrochures.length} 份手冊
          </div>
        </div>

        {/* 表格 */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  <th className="px-6 py-4">手冊標題 / 內部團號</th>
                  <th className="px-6 py-4">旅行社</th>
                  <th className="px-6 py-4">發佈狀態</th>
                  <th className="px-6 py-4">最後更新</th>
                  <th className="px-6 py-4 text-right">管理操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-4" colSpan={5}>
                        <div className="h-12 bg-gray-100 rounded-lg w-full"></div>
                      </td>
                    </tr>
                  ))
                ) : filteredBrochures.length === 0 ? (
                  <tr>
                    <td className="px-6 py-20 text-center text-gray-400" colSpan={5}>
                      找不到符合條件的手冊資料
                    </td>
                  </tr>
                ) : (
                  filteredBrochures.map((item) => (
                    <tr 
                      key={item.id} 
                      className="hover:bg-blue-50/30 transition-colors group cursor-pointer"
                      onClick={() => onEdit(item.id)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-900 line-clamp-1">{item.title}</span>
                          <span className="text-xs text-gray-400 mt-1 font-mono">{item.groupNumber || '--- 無內部團號 ---'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {item.agency || '---'}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={(e) => handleTogglePublish(e, item.id, !!item.isPublished)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                            item.isPublished 
                              ? 'bg-green-50 text-green-600 border border-green-100' 
                              : 'bg-gray-100 text-gray-500 border border-gray-200'
                          }`}
                        >
                          {item.isPublished ? <Globe size={12} /> : <Lock size={12} />}
                          {item.isPublished ? '已發佈' : '草稿'}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400 flex items-center gap-1.5 mt-1">
                        <Calendar size={14} />
                        {formatDate(item.updatedAt)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                             onClick={(e) => {
                               e.stopPropagation();
                               window.open(`${window.location.origin}${window.location.pathname}?mode=ebook&id=${item.id}`, '_blank');
                             }}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-white rounded-lg transition-all shadow-none hover:shadow-sm border border-transparent hover:border-gray-100"
                            title="預覽電子書"
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            onClick={(e) => handleCopyShortLink(e, item.id)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-white rounded-lg transition-all shadow-none hover:shadow-sm border border-transparent hover:border-gray-100"
                            title="複製分享連結"
                          >
                            <LinkIcon size={18} />
                          </button>
                          <div className="w-px h-4 bg-gray-200 mx-1"></div>
                          <button
                            onClick={() => onEdit(item.id)}
                            className="px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-600 hover:text-white transition-all"
                          >
                            編輯手冊
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 說明區塊 */}
        <div className="mt-8 bg-blue-50/50 rounded-2xl p-6 border border-blue-100">
           <h3 className="text-sm font-bold text-blue-900 flex items-center gap-2 mb-2">
             <CheckCircle2 size={16} />
             發佈管理說明
           </h3>
           <ul className="text-xs text-blue-700/80 space-y-1.5 leading-relaxed">
             <li>• 只有狀態為「已發佈」的手冊，才能透過短連結讓外部旅客直接開啟電子書閱讀模式。</li>
             <li>• 「團號」為內部財務或控團人員對照使用，不會顯示在手冊封面，僅出現在管理列表。</li>
             <li>• 電子書模式支援 Responsive 自適應排版，於手機、平板與電腦皆可獲得最佳閱讀體驗。</li>
           </ul>
        </div>
      </main>
    </div>
  );
}
