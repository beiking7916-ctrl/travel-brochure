import React from 'react';
import { useBrochure } from '../../context/BrochureContext';
import { MapPin, Phone, Building2, Clock } from 'lucide-react';
import { PageWrapper } from './PageWrapper';

export function HotelPage() {
  const { data } = useBrochure();

  if (data.hotels.length === 0) {
    return null;
  }

  // 將飯店依據換頁標記分組
  const hotelPages: typeof data.hotels[] = [];
  let currentPage: typeof data.hotels = [];

  data.hotels.forEach((hotel, index) => {
    // 即使是第0項，如果他不需要換頁，自然就加入currentPage。但第一個項目不該觸發新增頁（因為一開始就是空頁）
    if (index > 0 && hotel.pageBreakBefore && currentPage.length > 0) {
      hotelPages.push(currentPage);
      currentPage = [];
    }
    // 帶上原始 index
    currentPage.push({ ...hotel, originalIndex: index } as any);
  });

  if (currentPage.length > 0) {
    hotelPages.push(currentPage);
  }

  return (
    <>
      {hotelPages.map((pageHotels, pageIdx) => (
        <PageWrapper key={pageIdx} title={pageIdx === 0 ? "住宿安排" : "住宿安排 (續)"} icon={<Building2 size={24} />}>
          <div className="space-y-6">
            {pageHotels.map((hotel: any) => {
              const index = hotel.originalIndex;
              return (
                <div
                  key={index}
                  className="flex flex-col bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
                >
                  {/* 標題與天數標記 */}
                  <div
                    className="px-5 py-3 flex items-center justify-between border-b border-gray-50 bg-gray-50/50"
                  >
                    <h3
                      className="text-lg font-bold flex items-center gap-2"
                      style={{ color: data.theme.primary }}
                    >
                      <div
                        className="w-1.5 h-4 rounded-full"
                        style={{ backgroundColor: data.theme.primary }}
                      />
                      第 {index + 1} 間飯店
                    </h3>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest px-2 py-1 bg-white rounded shadow-sm border border-gray-100">
                      Hotel {index + 1}
                    </span>
                  </div>

                  <div className="flex flex-col md:flex-row gap-0">
                    {/* 飯店圖片 */}
                    <div className={`md:w-1/3 relative bg-gray-50 ${hotel.image ? '' : 'flex items-center justify-center p-6'}`}>
                      {hotel.image ? (
                        <div className="absolute inset-0">
                          <img
                            src={hotel.image}
                            alt={hotel.name || `Hotel ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 border-r border-gray-100/50" />
                        </div>
                      ) : (
                        <div className="text-center">
                          <Building2 size={32} className="mx-auto text-gray-300 mb-2" />
                          <p className="text-xs font-medium text-gray-400">尚無飯店圖片</p>
                        </div>
                      )}
                      {/* 確保即使圖片為 absolute 也有最小高度 */}
                      <div className="pb-[75%] md:pb-0 md:h-full min-h-[160px]"></div>
                    </div>

                    {/* 飯店資訊 */}
                    <div className="p-5 md:w-2/3 flex flex-col justify-center space-y-4">
                      <h4 className="text-xl font-bold text-gray-900 leading-tight">
                        {hotel.name || '未指定飯店名稱'}
                      </h4>

                      <div className="space-y-2.5">
                        <div className="flex items-start gap-3 text-sm text-gray-600">
                          <MapPin size={16} className="mt-0.5 flex-shrink-0 text-gray-400" />
                          <span className="leading-relaxed">{hotel.address || '地址待確認'}</span>
                        </div>

                        <div className="flex items-center gap-3 text-sm text-gray-600">
                          <Phone size={16} className="flex-shrink-0 text-gray-400" />
                          <span>{hotel.phone || '電話待確認'}</span>
                        </div>

                        {hotel.morningCall && (
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium border border-blue-100 mt-2">
                            <Clock size={14} />
                            Morning Call: {hotel.morningCall}
                          </div>
                        )}
                        {hotel.description && (
                          <div className="mt-4 pt-3 border-t border-gray-100">
                            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{hotel.description}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </PageWrapper>
      ))}
    </>
  );
}
