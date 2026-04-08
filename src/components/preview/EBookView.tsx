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
import { ChevronLeft, ChevronRight, List as ListIcon, Info, FileText, X } from 'lucide-react';

export function EBookView() {
  const { data } = useBrochure();
  const [currentPage, setCurrentPage] = useState(0);
  const [showTOC, setShowTOC] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (data.title) {
      document.title = `${data.title} | 鑫囍探索旅行社`;
    }
  }, [data.title]);

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

  const [isFlipping, setIsFlipping] = useState<'next' | 'prev' | null>(null);

  const nextPage = () => {
    if (currentPage < pages.length - 1 && !isFlipping) {
      setIsFlipping('next');
      setTimeout(() => {
        setCurrentPage(prev => prev + 1);
        setIsFlipping(null);
        containerRef.current?.scrollTo({ left: (currentPage + 1) * window.innerWidth, behavior: 'auto' });
      }, 600);
    }
  };

  const prevPage = () => {
    if (currentPage > 0 && !isFlipping) {
      setIsFlipping('prev');
      setTimeout(() => {
        setCurrentPage(prev => prev - 1);
        setIsFlipping(null);
        containerRef.current?.scrollTo({ left: (currentPage - 1) * window.innerWidth, behavior: 'auto' });
      }, 600);
    }
  };

  const goToPage = (index: number) => {
    setCurrentPage(index);
    setShowTOC(false);
    containerRef.current?.scrollTo({ left: index * window.innerWidth, behavior: 'auto' });
  };

  useEffect(() => {
    const handleScroll = () => {
      if (containerRef.current && !isFlipping) {
        const index = Math.round(containerRef.current.scrollLeft / window.innerWidth);
        if (index !== currentPage) setCurrentPage(index);
      }
    };

    const container = containerRef.current;
    container?.addEventListener('scroll', handleScroll);
    return () => container?.removeEventListener('scroll', handleScroll);
  }, [currentPage, isFlipping]);

  return (
    <div className="fixed inset-0 bg-[#121212] flex flex-col overflow-hidden select-none perspective-2000">
      {/* 頂部工具列 */}
      <div className="h-14 bg-black/60 backdrop-blur-xl flex items-center justify-between px-6 z-50 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div 
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-lg"
            style={{ backgroundColor: data.theme.primary }}
          >
            <FileText size={18} />
          </div>
          <div className="flex flex-col">
            <h1 className="text-white text-sm font-bold truncate max-w-[160px] md:max-w-md">{data.title || '未命名手冊'}</h1>
            <p className="text-white/30 text-[9px] font-black tracking-[0.2em] uppercase">Digital Brochure</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
           <button 
             onClick={() => setShowTOC(!showTOC)}
             className={`p-2 rounded-xl transition-all ${showTOC ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
             title="查看目錄"
           >
             <ListIcon size={20} />
           </button>
        </div>
      </div>

      {/* 電子書本體 */}
      <div 
        ref={containerRef}
        className="flex-1 flex overflow-x-auto snap-x snap-mandatory no-scrollbar bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a]"
        style={{ scrollBehavior: isFlipping ? 'auto' : 'smooth' }}
      >
        {pages.map((page, index) => {
          const isActive = currentPage === index;
          const flippingClass = isFlipping === 'next' && isActive ? 'animate-flip-out' : (isFlipping === 'prev' && isActive ? 'animate-flip-in' : '');

          return (
            <div 
                key={`${page.id}-${index}`}
                className="w-full h-full flex-shrink-0 snap-center flex items-center justify-center p-2 sm:p-4 md:p-8"
            >
                {/* 3D 容器 */}
                <div className={`relative w-full max-w-[min(95vw,calc(100vh*0.65))] aspect-[1/1.414] preserve-3d transition-transform duration-700 ${flippingClass}`}>
                    
                    {/* 紙張基底 */}
                    <div className="absolute inset-0 bg-white shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] rounded-sm overflow-hidden backface-hidden">
                        
                        {/* 書頁中縫與光澤特效 */}
                        <div className="absolute inset-0 pointer-events-none z-20">
                            <div className="absolute top-0 bottom-0 left-0 w-[5%] bg-gradient-to-r from-black/20 to-transparent" />
                            <div className="absolute top-0 bottom-0 left-[2%] w-[1px] bg-black/5" />
                            <div className="absolute inset-0 shadow-[inset_0_0_80px_rgba(0,0,0,0.03)]" />
                        </div>

                        {/* 內容渲染 */}
                        <div className="h-full w-full overflow-y-auto preview-content bg-white py-2">
                             <div className="scale-[1.0] origin-top">
                                {page.component}
                             </div>
                        </div>
                    </div>

                    {/* 翻頁時的背面 (模擬另外一面) */}
                    <div className="absolute inset-0 bg-gray-100 rounded-sm backface-hidden rotate-y-180 z-0 flex items-center justify-center">
                        <div className="w-1/2 h-[2px] bg-gray-200" />
                    </div>
                </div>
            </div>
          );
        })}
      </div>

      {/* 底部導覽列 */}
      <div className="h-20 bg-black/60 backdrop-blur-xl flex flex-col items-center justify-center px-6 z-40 border-t border-white/5 space-y-2">
        <div className="flex items-center gap-10 md:gap-16 text-white/80">
          <button 
            onClick={prevPage}
            disabled={currentPage === 0 || !!isFlipping}
            className="p-3 hover:bg-white/10 rounded-full transition-all disabled:opacity-10 active:scale-90"
          >
            <ChevronLeft size={28} />
          </button>

          <div className="flex flex-col items-center gap-2">
            <span className="text-[11px] font-black font-mono tracking-widest text-blue-400">
              PAGE {String(currentPage + 1).padStart(2, '0')} <span className="text-white/20 mx-2">/</span> {String(pages.length).padStart(2, '0')}
            </span>
            <div className="w-40 sm:w-60 h-1 bg-white/10 rounded-full overflow-hidden">
               <div 
                 className="h-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-500" 
                 style={{ width: `${((currentPage + 1) / pages.length) * 100}%` }}
               />
            </div>
          </div>

          <button 
            onClick={nextPage}
            disabled={currentPage === pages.length - 1 || !!isFlipping}
            className="p-3 hover:bg-white/10 rounded-full transition-all disabled:opacity-10 active:scale-90"
          >
            <ChevronRight size={28} />
          </button>
        </div>
      </div>

      {/* 目錄側邊欄 */}
      {showTOC && (
        <div className="fixed inset-y-0 right-0 w-full sm:w-80 bg-[#161616] shadow-[0_0_50px_rgba(0,0,0,0.5)] z-[60] border-l border-white/5 flex flex-col animate-in slide-in-from-right duration-300">
          <div className="p-6 border-b border-white/5 flex items-center justify-between bg-black/20">
            <div className="flex items-center gap-2">
              <ListIcon size={18} className="text-blue-500" />
              <h2 className="text-white font-black text-sm tracking-widest">CHAPTERS</h2>
            </div>
            <button onClick={() => setShowTOC(false)} className="p-2 text-white/40 hover:text-white transition-colors">
               <X size={20} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {pages.map((page, index) => (
              <button
                key={`toc-item-${page.id}`}
                onClick={() => goToPage(index)}
                className={`w-full text-left px-5 py-4 rounded-2xl transition-all flex items-center justify-between group ${
                  currentPage === index 
                  ? 'bg-blue-600 text-white shadow-xl shadow-blue-900/40 translate-x-1' 
                  : 'text-white/40 hover:bg-white/5 hover:text-white active:scale-95'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`text-[10px] font-mono leading-none ${currentPage === index ? 'text-blue-200' : 'text-white/20'}`}>
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="text-sm font-bold">{page.label}</span>
                </div>
                {currentPage === index && <div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_white]" />}
              </button>
            ))}
          </div>
          <div className="p-6 bg-black/40 text-[9px] text-white/20 flex flex-col gap-2 uppercase tracking-tighter">
             <div className="flex items-center gap-2">
                <Info size={10} />
                <span>Tips: Use swipe gestures to turn pages</span>
             </div>
             <p>© 2024 Travel Brochure Digital Experience</p>
          </div>
        </div>
      )}

      {/* 目錄背景遮罩 */}
      {showTOC && (
        <div 
          className="fixed inset-0 bg-black/80 z-[55] backdrop-blur-md"
          onClick={() => setShowTOC(false)}
        />
      )}

      <style>{`
        .perspective-2000 { perspective: 2000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
        
        @keyframes flip-out {
          0% { transform: rotateY(0deg); opacity: 1; }
          40% { transform: rotateY(-30deg) scale(0.95); }
          100% { transform: rotateY(-180deg) translateX(-100%); opacity: 0; }
        }
        
        @keyframes flip-in {
          0% { transform: rotateY(0deg); opacity: 1; }
          40% { transform: rotateY(30deg) scale(0.95); }
          100% { transform: rotateY(180deg) translateX(100%); opacity: 0; }
        }

        .animate-flip-out {
          animation: flip-out 0.8s cubic-bezier(0.645, 0.045, 0.355, 1) forwards;
          transform-origin: left center;
        }

        .animate-flip-in {
          animation: flip-in 0.8s cubic-bezier(0.645, 0.045, 0.355, 1) forwards;
          transform-origin: right center;
        }
      `}</style>
    </div>
  );
}
