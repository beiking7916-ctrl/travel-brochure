import React from 'react';
import { useBrochure } from '../../context/BrochureContext';
import { Building2, CheckCircle2 } from 'lucide-react';
import { PageWrapper } from './PageWrapper';

export function HotelDetailPage() {
    const { data } = useBrochure();
    if (!data.hotelDetails || data.hotelDetails.length === 0) return null;

    return (
        <>
            {data.hotelDetails.map((hotel, idx) => (
                <PageWrapper key={hotel.id} title={idx === 0 ? "飯店介紹" : ""} icon={idx === 0 ? <Building2 size={24} /> : undefined}>
                    <div className="flex flex-col h-full py-2">

                        <div className="flex items-center mb-4">
                            <div
                                className="w-1.5 h-8 mr-3 rounded-full"
                                style={{ backgroundColor: data.theme.primary }}
                            />
                            <h2 className="text-2xl font-bold text-gray-800 tracking-wide flex-1">
                                {hotel.name}
                            </h2>
                        </div>

                        <div className="flex flex-col flex-1 min-h-0 space-y-6">
                            {/* 1. 頂部：房間大圖 (Image 1) */}
                            {hotel.images.length > 0 && (
                                <div className="w-full h-[240px] rounded-2xl overflow-hidden shadow-md border border-gray-200 flex-shrink-0">
                                    <img src={hotel.images[0]} alt="" className="w-full h-full object-cover" />
                                </div>
                            )}

                            {/* 2. 中間：房間介紹文字 (全寬) */}
                            <div className="bg-white/50 rounded-2xl p-6 border border-gray-100 shadow-sm">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Introduction</h3>
                                    {hotel.roomType && (
                                        <div className="flex items-center gap-2 px-2 py-1 bg-gray-50 border border-gray-100 rounded text-[11px] font-black text-gray-500">
                                            {hotel.roomType}
                                        </div>
                                    )}
                                </div>
                                <div className="prose prose-sm max-w-none text-gray-600 leading-[1.8] font-medium whitespace-pre-wrap">
                                    {hotel.intro}
                                </div>
                            </div>

                            {/* 3. 底部：分兩欄 (根據 bottomLayout 配置) */}
                            {(() => {
                                const layout = hotel.bottomLayout || 'left-info-right-images';
                                const hasBottomImages = hotel.images.length > 1 && layout !== 'full-info';

                                const InfoTab = (
                                    <div className={`${hasBottomImages ? '' : 'col-span-2'} bg-gray-50/50 rounded-2xl p-6 border border-gray-100 flex flex-col min-h-0`}>
                                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                            <CheckCircle2 size={14} style={{ color: data.theme.primary }} />
                                            Facilities & Services
                                        </h3>
                                        <div className={`grid ${hasBottomImages ? 'grid-cols-1' : 'grid-cols-2'} gap-y-2.5 overflow-y-auto custom-scrollbar pr-2`}>
                                            {hotel.facilities?.map((f, i) => (
                                                <div key={i} className="text-[13px] text-gray-600 flex items-center gap-2 leading-tight">
                                                    <div className="w-1 h-1 rounded-full bg-blue-400 flex-shrink-0" />
                                                    {f}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );

                                const ImageTab = hasBottomImages ? (
                                    <div className="flex flex-col gap-4">
                                        {hotel.images.slice(1, 3).map((img, i) => (
                                            <div key={i} className="h-[160px] rounded-2xl overflow-hidden shadow-sm border border-gray-200 flex-shrink-0">
                                                <img src={img} alt="" className="w-full h-full object-cover" />
                                            </div>
                                        ))}
                                        {hotel.images.length === 2 && (
                                            <div className="h-160px] rounded-2xl bg-gray-50/50 border-2 border-dashed border-gray-100 flex items-center justify-center text-gray-300">
                                                <Building2 size={24} className="opacity-20" />
                                            </div>
                                        )}
                                    </div>
                                ) : null;

                                return (
                                    <div className="grid grid-cols-2 gap-6 flex-1 min-h-0">
                                        {layout === 'left-images-right-info' ? (
                                            <>
                                                {ImageTab}
                                                {InfoTab}
                                            </>
                                        ) : (
                                            <>
                                                {InfoTab}
                                                {ImageTab}
                                            </>
                                        )}
                                    </div>
                                );
                            })()}
                        </div>

                    </div>
                </PageWrapper>
            ))}
        </>
    );
}
