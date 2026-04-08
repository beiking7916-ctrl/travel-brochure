import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useBrochure } from '../../context/BrochureContext';
import { CoverPage } from './CoverPage';
import { TOCPage } from './TOCPage';
import { FlightPage } from './FlightPage';
import { HotelPage } from './HotelPage';
import { ItineraryPage } from './ItineraryPage';
import { AttractionPage } from './AttractionPage';
import { HotelDetailPage } from './HotelDetailPage';
import { MapPage } from './MapPage';
import { PackingPage } from './PackingPage';
import { TipsPage } from './TipsPage';
import { TipsGridPage } from './TipsGridPage';
import { NotesPage } from './NotesPage';
import { RoomingListPage } from './RoomingListPage';
import { CustomPage } from './CustomPage';
import { BackCoverPage } from './BackCoverPage';
import type { SectionId } from '../../types';
import { ChevronLeft, ChevronRight, List as ListIcon, Info, FileText } from 'lucide-react';

export function EBookView() {
  const { data } = useBrochure();
  const [currentPage, setCurrentPage] = useState(0);
  const [showTOC, setShowTOC] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const ALL_SECTION_IDS: SectionId[] = [
    'flight', 'attraction', 'hotel', 'hotelDetail', 'roomingList', 'map', 'itinerary', 'packing', 'tips', 'gridTips', 'customPage'
  ];

  const currentOrder = useMemo(() => {
    const order = data.sectionOrder || [];
    const missing = ALL_SECTION_IDS.filter(id => !order.includes(id));
    return [...order, ...missing].filter(id => ALL_SECTION_IDS.includes(id as SectionId));
  }, [data.sectionOrder]);

  const visibleSections = currentOrder.filter(id => data.tocSettings?.[id] !== false);

  const SECTION_LABELS: Record<string, string> = {
    cover: '封面',
    toc: '目錄',
    flight: '航班資訊',
    attraction: '景點介紹',
    hotel: '飯店列表',
    hotelDetail: '飯店詳情',
    roomingList: '分房表',
    map: '旅遊地圖',
    itinerary: '每日行程',
    packing: '旅遊物品',
    tips: '旅遊叮嚀',
    gridTips: '貼心提醒',
    customPage: '特別說明',
    backCover: '封底'
  };

  const pages = useMemo(() => {
    const p: { id: string; label: string; component: React.ReactNode }[] = [
      { id: 'cover', label: '封面', component: <CoverPage /> },
      { id: 'toc', label: '目錄', component: <TOCPage /> }
    ];

    visibleSections.forEach(id => {
      let component: React.ReactNode = null;
      switch (id) {
        case 'flight': component = <FlightPage />; break;
        case 'attraction': component = <AttractionPage />; break;
        case 'hotel': component = <HotelPage />; break;
        case 'hotelDetail': component = <HotelDetailPage />; break;
        case 'roomingList': component = <RoomingListPage />; break;
        case 'map': component = <MapPage />; break;
        case 'itinerary': component = <ItineraryPage />; break;
        case 'packing': component = <PackingPage />; break;
        case 'tips': component = <TipsPage />; break;
        case 'gridTips': component = <TipsGridPage />; break;
        case 'customPage': component = <CustomPage />; break;
      }
      if (component) p.push({ id, label: SECTION_LABELS[id] || id, component });
    });

    Array.from({ length: data.notesCount || 0 }).forEach((_, i) => {
      p.push({ id: `note-${i}`, label: `備註 ${i + 1}`, component: <NotesPage totalNotes={data.notesCount} /> });
    });

    p.push({ id: 'back-cover', label: '封底', component: <BackCoverPage /> });
    return p;
  }, [data, visibleSections]);

  const nextPage = () => {
    if (currentPage < pages.length - 1) {
      setCurrentPage(prev => prev + 1);
      containerRef.current?.scrollTo({ left: (currentPage + 1) * window.innerWidth, behavior: 'smooth' });
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
      containerRef.current?.scrollTo({ left: (currentPage - 1) * window.innerWidth, behavior: 'smooth' });
    }
  };

  const goToPage = (index: number) => {
    setCurrentPage(index);
    setShowTOC(false);
    containerRef.current?.scrollTo({ left: index * window.innerWidth, behavior: 'smooth' });
  };

  useEffect(() => {
    const handleScroll = () => {
      if (containerRef.current) {
        const index = Math.round(containerRef.current.scrollLeft / window.innerWidth);
        if (index !== currentPage) setCurrentPage(index);
      }
    };

    const container = containerRef.current;
    container?.addEventListener('scroll', handleScroll);
    return () => container?.removeEventListener('scroll', handleScroll);
  }, [currentPage]);

  return (
    <div className="fixed inset-0 bg-[#1a1a1a] flex flex-col overflow-hidden select-none">
      {/* 頂部工具列 */}
      <div className="h-14 bg-black/40 backdrop-blur-md flex items-center justify-between px-6 z-50 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-900/20">
            <FileText size={18} />
          </div>
          <div className="flex flex-col">
            <h1 className="text-white text-sm font-bold truncate max-w-[200px] md:max-w-md">{data.title}</h1>
            <p className="text-white/40 text-[10px] font-medium tracking-widest uppercase">E-Brochure Experience</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
           <button 
             onClick={() => setShowTOC(!showTOC)}
             className={`p-2 rounded-lg transition-all ${showTOC ? 'bg-blue-600 text-white' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
             title="查看目錄"
           >
             <ListIcon size={20} />
           </button>
        </div>
      </div>

      {/* 電子書本體 - 使用 Scroll Snap */}
      <div 
        ref={containerRef}
        className="flex-1 flex overflow-x-auto snap-x snap-mandatory no-scrollbar bg-[#2a2a2a]"
        style={{ scrollBehavior: 'smooth' }}
      >
        {pages.map((page, index) => (
          <div 
            key={`${page.id}-${index}`}
            className="w-full h-full flex-shrink-0 snap-center flex items-center justify-center p-4 md:p-8"
          >
            {/* 模擬紙張質感的容器 */}
            <div className="relative max-h-full aspect-[1/1.414] bg-white shadow-2xl rounded-sm overflow-hidden transform-gpu transition-all duration-700 w-full max-w-[min(90vw,calc(100vh*0.7))]">
               {/* 書頁陰影與紋理 */}
               <div className="absolute inset-0 pointer-events-none z-10 shadow-[inner_0_0_100px_rgba(0,0,0,0.05)] border border-black/5" />
               <div className="absolute top-0 bottom-0 left-0 w-8 bg-gradient-to-r from-black/5 to-transparent pointer-events-none z-10" />
               
               <div className="h-full w-full overflow-y-auto preview-content bg-white origin-top">
                 <div className="scale-[1.0] origin-top">
                    {page.component}
                 </div>
               </div>
            </div>
          </div>
        ))}
      </div>

      {/* 底部導覽與進度 */}
      <div className="h-16 bg-black/40 backdrop-blur-md flex items-center justify-center px-6 z-40 border-t border-white/10">
        <div className="flex items-center gap-8 text-white/80">
          <button 
            onClick={prevPage}
            disabled={currentPage === 0}
            className="p-2 hover:bg-white/10 rounded-full transition-all disabled:opacity-20 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={28} />
          </button>

          <div className="flex flex-col items-center gap-1.5 min-w-[80px]">
            <span className="text-xs font-bold font-mono tracking-tighter">
              {currentPage + 1} <span className="text-white/30 text-[10px] mx-1">/</span> {pages.length}
            </span>
            <div className="w-32 h-1 bg-white/10 rounded-full overflow-hidden">
               <div 
                 className="h-full bg-blue-500 transition-all duration-300" 
                 style={{ width: `${((currentPage + 1) / pages.length) * 100}%` }}
               />
            </div>
          </div>

          <button 
            onClick={nextPage}
            disabled={currentPage === pages.length - 1}
            className="p-2 hover:bg-white/10 rounded-full transition-all disabled:opacity-20 disabled:cursor-not-allowed"
          >
            <ChevronRight size={28} />
          </button>
        </div>
      </div>

      {/* 側邊目錄抽屜 */}
      {showTOC && (
        <div className="fixed inset-y-0 right-0 w-80 bg-[#1a1a1a] shadow-2xl z-[60] border-l border-white/10 flex flex-col animate-in slide-in-from-right duration-300">
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <h2 className="text-white font-bold flex items-center gap-2">
              <ListIcon size={18} className="text-blue-500" />
              章節導讀
            </h2>
            <button onClick={() => setShowTOC(false)} className="text-white/40 hover:text-white transition-colors">
               <ChevronRight size={24} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-1">
            {pages.map((page, index) => (
              <button
                key={`toc-item-${page.id}`}
                onClick={() => goToPage(index)}
                className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center justify-between group ${
                  currentPage === index ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'text-white/60 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span className="text-sm font-medium">{page.label}</span>
                {currentPage === index && <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
              </button>
            ))}
          </div>
          <div className="p-6 bg-black/20 text-[10px] text-white/30 flex items-center gap-2">
             <Info size={12} />
             <span>提示：點擊章節可快速跳轉，或使用滑鼠/手勢左右滑動翻頁。</span>
          </div>
        </div>
      )}

      {/* 點擊背景縮回目錄 */}
      {showTOC && (
        <div 
          className="fixed inset-0 bg-black/60 z-[55] backdrop-blur-sm"
          onClick={() => setShowTOC(false)}
        />
      )}
    </div>
  );
}
