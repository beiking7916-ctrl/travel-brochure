import React from 'react';
import ReactDOM from 'react-dom';
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
import type { SectionId } from '../../types';

export function PreviewPanel() {
  const { data } = useBrochure();

  // 確保舊資料也有預設值
  const currentOrder = data.sectionOrder || [
    'flight',
    'attraction',
    'hotel',
    'hotelDetail',
    'map',
    'itinerary',
    'packing',
    'tips',
    'gridTips'
  ];

  const renderSection = (sectionId: SectionId) => {
    switch (sectionId) {
      case 'flight':
        return <FlightPage key="flight" />;
      case 'attraction':
        return <AttractionPage key="attraction" />;
      case 'hotel':
        return <HotelPage key="hotel" />;
      case 'hotelDetail':
        return <HotelDetailPage key="hotelDetail" />;
      case 'map':
        return <MapPage key="map" />;
      case 'itinerary':
        return <ItineraryPage key="itinerary" />;
      case 'packing':
        return <PackingPage key="packing" />;
      case 'tips':
        return <TipsPage key="tips" />;
      case 'gridTips':
        return <TipsGridPage key="gridTips" />;
      default:
        return null;
    }
  };

  // 過濾掉使用者在目錄設定中取消勾選的頁面
  const visibleSections = currentOrder.filter(id => data.tocSettings?.[id] !== false);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(`preview-section-${id}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const SECTION_LABELS: Record<string, string> = {
    cover: '封面',
    toc: '目錄',
    flight: '航班',
    attraction: '景點',
    hotel: '住宿',
    hotelDetail: '細節',
    map: '地圖',
    itinerary: '行程',
    packing: '攜帶',
    tips: '注意',
    gridTips: '提醒',
  };

  const PageContainer = ({ children, title, id }: { children: React.ReactNode, title: string, id: string }) => (
    <div id={`preview-section-${id}`} className="flex flex-col items-center gap-2 group scroll-mt-20">
      <span className="text-[11px] font-bold text-gray-400/80 uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        {title}
      </span>
      <div className="relative">
        {children}
      </div>
    </div>
  );

  return (
    <div className="relative h-full overflow-hidden bg-[#ccd5e0]">
      {/* 頂部快速導覽列 (Sticky Navigation) */}
      <div className="absolute top-0 left-0 right-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-200/50 flex items-center justify-center py-2 gap-1 px-4 overflow-x-auto no-print">
        <button
          onClick={() => scrollToSection('cover')}
          className="px-3 py-1.5 rounded-lg text-xs font-black text-gray-500 hover:bg-white hover:text-blue-600 transition-all hover:shadow-sm uppercase tracking-widest whitespace-nowrap"
        >
          {SECTION_LABELS.cover}
        </button>
        <button
          onClick={() => scrollToSection('toc')}
          className="px-3 py-1.5 rounded-lg text-xs font-black text-gray-500 hover:bg-white hover:text-blue-600 transition-all hover:shadow-sm uppercase tracking-widest whitespace-nowrap"
        >
          {SECTION_LABELS.toc}
        </button>
        <div className="w-px h-3 bg-gray-200 mx-1" />
        {visibleSections.map((sectionId) => (
          <button
            key={sectionId}
            onClick={() => scrollToSection(sectionId)}
            className="px-3 py-1.5 rounded-lg text-xs font-black text-gray-500 hover:bg-white transition-all hover:shadow-sm uppercase tracking-widest whitespace-nowrap"
            style={{ color: data.theme.primary === sectionId ? data.theme.primary : undefined }}
          >
            {SECTION_LABELS[sectionId] || sectionId}
          </button>
        ))}
      </div>

      {/* 螢幕預覽容器（列印時隱藏） */}
      <div className="h-full overflow-y-auto pt-20 p-12 custom-scrollbar no-print">
        <div className="preview-container flex flex-col items-center gap-16 pb-32">
          <PageContainer id="cover" title="Cover Page">
            <CoverPage />
          </PageContainer>

          <PageContainer id="toc" title="Table of Contents">
            <TOCPage />
          </PageContainer>

          {visibleSections.map((sectionId) => (
            <PageContainer key={sectionId} id={sectionId} title={`${sectionId.charAt(0).toUpperCase() + sectionId.slice(1)} Page`}>
              {renderSection(sectionId)}
            </PageContainer>
          ))}
        </div>
      </div>

      {/* 列印專用容器（透過 Portal 掛到 body，脫離 w-3/5 容器限制） */}
      {ReactDOM.createPortal(
        <div className="print-only-container">
          <CoverPage />
          <TOCPage />
          {visibleSections.map((sectionId) => renderSection(sectionId))}
        </div>,
        document.body
      )}
    </div>
  );
}
