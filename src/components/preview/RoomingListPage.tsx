import React from 'react';
import { useBrochure } from '../../context/BrochureContext';
import { Users } from 'lucide-react';
import { PageWrapper } from './PageWrapper';

export function RoomingListPage() {
    const { data } = useBrochure();

    if (!data.roomingList || data.roomingList.length === 0) {
        return null;
    }

    const hotels = data.hotels || [];
    const hasHotels = hotels.length > 0;

    const sortedList = [...(data.roomingList || [])].sort((a, b) => {
        const firstHotel = hotels[0];
        const firstHotelKey = firstHotel ? (firstHotel.name || 'hotel_0') : '';
        const valA = firstHotelKey ? (a.hotelRooms?.[firstHotelKey] || '') : (a.roomNumber || '');
        const valB = firstHotelKey ? (b.hotelRooms?.[firstHotelKey] || '') : (b.roomNumber || '');
        return valA.localeCompare(valB, undefined, { numeric: true, sensitivity: 'base' });
    });

    // 每頁顯示 7 間房，以防 A5 高度溢出
    const ROOMS_PER_PAGE = 7;
    const roomChunks: any[][] = [];
    for (let i = 0; i < sortedList.length; i += ROOMS_PER_PAGE) {
        roomChunks.push(sortedList.slice(i, i + ROOMS_PER_PAGE));
    }

    // 預先計算每一頁的起始旅客序號
    let currentIdx = 1;
    const chunksWithStartIdx = roomChunks.map(chunk => {
        const startIdx = currentIdx;
        chunk.forEach(room => {
            const namesToRender = (room.names || []).filter((n: string) => n?.trim() !== '');
            currentIdx += namesToRender.length || 1;
        });
        return { chunk, startIdx };
    });

    return (
        <>
            {chunksWithStartIdx.map(({ chunk, startIdx }, pageIdx) => {
                let globalIdx = startIdx;
                let mobileGlobalIdx = startIdx;
                const isContinuation = pageIdx > 0;

                return (
                    <PageWrapper 
                        key={pageIdx} 
                        sectionId="roomingList" 
                        title={isContinuation ? "分房表 Rooming List (續)" : "分房表 Rooming List"} 
                        icon={<Users size={24} />}
                    >
                        <div className="flex flex-col h-full bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden text-gray-800">
                            {/* Desktop View: Table */}
                            <div className="hidden md:block flex-grow overflow-hidden p-2.5">
                                <table className="w-full dynamic-text text-center border-collapse border border-gray-200 table-fixed">
                                    <thead className="bg-[#f8f9fa] text-gray-700 font-bold tracking-tight">
                                        <tr>
                                            <th className="border border-gray-200 px-1 py-1.5 w-[35px]">編號</th>
                                            <th className="border border-gray-200 px-2 py-1.5 text-left min-w-[80px]">旅客姓名</th>

                                            {hasHotels ? (
                                                hotels.map((h, i) => (
                                                    <th key={i} className="border border-gray-200 px-1 py-2 bg-blue-50/50 min-w-[80px]">
                                                        <div className="flex flex-col items-center leading-tight">
                                                            <span className="text-[8px] text-blue-600/70 font-black uppercase tracking-tighter">H{i + 1}</span>
                                                            <span className="text-[11px] font-bold break-words uppercase leading-tight mt-0.5">
                                                                {h.name || '飯店'}
                                                            </span>
                                                        </div>
                                                    </th>
                                                ))
                                            ) : (
                                                <th className="border border-gray-200 px-2 py-1.5 w-[60px]">房號</th>
                                            )}

                                            <th className="border border-gray-200 px-2 py-1.5 w-[60px] uppercase text-[9px] tracking-wider">備註</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {chunk.map((room) => {
                                            const namesToRender = (room.names || []).filter((n: string) => n?.trim() !== '');
                                            if (namesToRender.length === 0) namesToRender.push('');
                                            const peopleCount = namesToRender.length;

                                            return namesToRender.map((name: string, nameIdx: number) => {
                                                const currentSeq = globalIdx++;
                                                return (
                                                    <tr key={`${room.id}-${nameIdx}`} className="hover:bg-gray-50/50">
                                                        <td className="border border-gray-200 px-1 py-1 text-gray-500 font-mono text-[10px]">
                                                            {currentSeq}
                                                        </td>

                                                        <td className="border border-gray-200 px-2 py-1 text-left text-gray-800 dynamic-text break-words">
                                                            <div className="flex flex-col">
                                                                <span className="font-bold">{name || '-'}</span>
                                                                {(room.units?.[nameIdx] || room.titles?.[nameIdx]) && (
                                                                    <div className="text-[9px] text-gray-500 font-medium truncate leading-tight">
                                                                        {[room.units?.[nameIdx], room.titles?.[nameIdx]].filter(Boolean).join(' / ')}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>

                                                        {hasHotels ? (
                                                            hotels.map((h, hIdx) => {
                                                                const key = h.name || `hotel_${hIdx}`;
                                                                const roomNo = room.hotelRooms?.[key] || '';
                                                                if (nameIdx !== 0) return null;
                                                                return (
                                                                    <td key={hIdx} className="border border-gray-200 px-1 py-2 bg-white align-middle" rowSpan={peopleCount}>
                                                                        <div className="font-bold text-gray-800 text-[11px] tracking-tighter uppercase text-center">
                                                                            {data.showRoomNumber !== false ? (roomNo || '-') : ''}
                                                                        </div>
                                                                    </td>
                                                                );
                                                            })
                                                        ) : (
                                                            nameIdx === 0 && (
                                                                <td className="border border-gray-200 px-2 py-2 bg-white align-middle" rowSpan={peopleCount}>
                                                                    <div className="font-bold text-gray-800 text-xs tracking-widest uppercase text-center">
                                                                        {data.showRoomNumber !== false ? (room.roomNumber || '-') : ''}
                                                                    </div>
                                                                </td>
                                                            )
                                                        )}

                                                        <td className="border border-gray-200 px-2 py-2 bg-white align-middle text-left">
                                                            {(() => {
                                                                const remarkContent = room.remarksList ? room.remarksList[nameIdx] : (nameIdx === 0 ? room.remarks : '');
                                                                return remarkContent ? (
                                                                    <div className="text-[10px] text-gray-500 leading-tight break-words">
                                                                        {remarkContent}
                                                                    </div>
                                                                ) : (
                                                                    <div className="h-4" />
                                                                );
                                                            })()}
                                                        </td>
                                                    </tr>
                                                );
                                            });
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile View: Cards */}
                            <div className="md:hidden flex-grow overflow-auto p-4 space-y-3 bg-gray-50">
                                {chunk.map((room) => {
                                    const namesToRender = (room.names || []).filter((n: string) => n?.trim() !== '');
                                    if (namesToRender.length === 0) namesToRender.push('');

                                    return namesToRender.map((name: string, nameIdx: number) => {
                                        const currentSeq = mobileGlobalIdx++;
                                        return (
                                            <div key={`${room.id}-${nameIdx}`} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 relative overflow-hidden group">
                                                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500/20 group-hover:bg-blue-500 transition-colors" />
                                                
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="flex items-center gap-3">
                                                        <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-mono font-bold text-gray-400">
                                                            {currentSeq}
                                                        </span>
                                                        <div>
                                                            <h4 className="font-bold text-gray-900">{name || '-'}</h4>
                                                            {(room.units?.[nameIdx] || room.titles?.[nameIdx]) && (
                                                                <p className="text-[10px] text-gray-500 font-medium">
                                                                    {[room.units?.[nameIdx], room.titles?.[nameIdx]].filter(Boolean).join(' / ')}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    
                                                    {!hasHotels && data.showRoomNumber !== false && (
                                                        <div className="bg-blue-50 text-blue-600 px-2 py-1 rounded text-[10px] font-black uppercase">
                                                            ROOM: {room.roomNumber || '-'}
                                                        </div>
                                                    )}
                                                </div>

                                                {hasHotels && data.showRoomNumber !== false && (
                                                    <div className="grid grid-cols-2 gap-2 mb-3">
                                                        {hotels.map((h, hIdx) => {
                                                            const key = h.name || `hotel_${hIdx}`;
                                                            const roomNo = room.hotelRooms?.[key] || '';
                                                            return (
                                                                <div key={hIdx} className="bg-gray-50/50 p-2 rounded-lg border border-gray-100">
                                                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-tighter mb-0.5 line-clamp-1">{h.name || `飯店 ${hIdx+1}`}</p>
                                                                    <p className="text-xs font-bold text-gray-800">房號: {roomNo || '-'}</p>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}

                                                {(() => {
                                                    const remarkContent = room.remarksList ? room.remarksList[nameIdx] : (nameIdx === 0 ? room.remarks : '');
                                                    return remarkContent && (
                                                        <div className="mt-2 text-xs bg-amber-50/30 text-gray-600 p-2 rounded-lg border border-amber-100/50 leading-relaxed italic">
                                                            <span className="font-bold text-amber-600 not-italic mr-1">備註:</span>
                                                            {remarkContent}
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        );
                                    });
                                })}
                            </div>
                        </div>
                    </PageWrapper>
                );
            })}
        </>
    );
}
