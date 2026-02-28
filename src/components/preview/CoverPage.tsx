import React from 'react';
import { useBrochure } from '../../context/BrochureContext';
import { MapPin, Calendar, Users, Phone } from 'lucide-react';
import { PageWrapper } from './PageWrapper';

export function CoverPage() {
  const { data } = useBrochure();

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '____ / __ / __';
    const date = new Date(dateStr);
    return `${date.getFullYear()} . ${(date.getMonth() + 1).toString().padStart(2, '0')} . ${date.getDate().toString().padStart(2, '0')}`;
  };

  return (
    <PageWrapper hideHeaderFooter={true}>
      <div className="absolute inset-0 flex flex-col pt-12">
        {/* 頂部裝飾條 */}
        <div
          className="absolute top-0 left-0 right-0 h-4"
          style={{ backgroundColor: data.theme.primary }}
        />

        {/* 封面圖片背景區塊 (如果有上傳) */}
        {data.coverImage ? (
          <div className="absolute top-4 left-0 right-0 h-[45%] z-0">
            <img
              src={data.coverImage}
              alt="Cover"
              className="w-full h-full object-cover"
            />
            {/* 漸層遮罩，讓文字更易讀 */}
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-secondary)] via-transparent to-black/20"
              style={{ '--bg-secondary': data.theme.secondary } as React.CSSProperties} />
          </div>
        ) : (
          /* 沒有圖片時的預設背景圖案 */
          <div className="absolute top-4 left-0 right-0 h-[45%] z-0 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-gray-300 via-gray-100 to-transparent" />
        )}

        {/* 內容主體區 */}
        <div className={`relative z-10 flex flex-col h-full px-16 ${data.coverImage ? 'mt-[35%]' : 'mt-12'}`}>

          {/* Header: Logo & Agency */}
          <div className="flex flex-col items-center mb-12">
            {data.logo ? (
              <div className="bg-white/90 backdrop-blur-sm p-4 rounded-2xl shadow-sm mb-6 max-w-[200px]">
                <img src={data.logo} alt="Logo" className="w-full h-auto object-contain max-h-24" />
              </div>
            ) : (
              <div className="h-16 mb-6" /> // 保留空白
            )}

            {data.agency && (
              <p className="tracking-[0.2em] font-medium text-gray-500 uppercase text-sm">
                {data.agency}
              </p>
            )}
          </div>

          {/* Main Title */}
          <div className="flex-grow flex flex-col items-center justify-center text-center -mt-12">
            <div className="w-16 h-1 mb-8 rounded-full" style={{ backgroundColor: data.theme.primary }} />
            <h1
              className="text-5xl font-black mb-8 leading-tight tracking-wide"
              style={{ color: data.theme.primary }}
            >
              {data.title || '旅遊說明會手冊'}
            </h1>
            <div className="w-16 h-1 mt-2 rounded-full" style={{ backgroundColor: data.theme.primary }} />
          </div>

          {/* Info Grid (Bottom) */}
          <div className="grid grid-cols-2 gap-8 pb-16 mt-auto">
            {/* 左欄：日期時間 */}
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-xl bg-white/50 backdrop-blur shadow-sm border border-white/40">
                <div className="p-3 rounded-full bg-white" style={{ color: data.theme.primary }}>
                  <Calendar size={24} />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Date</p>
                  <p className="font-semibold text-lg">{formatDate(data.startDate)}</p>
                  <p className="text-sm font-medium mt-0.5 text-gray-600">{data.duration} 天 {data.duration - 1} 夜</p>
                </div>
              </div>

              {(data.meetingPoint || data.meetingTime) && (
                <div className="flex items-center gap-4 p-4 rounded-xl bg-white/50 backdrop-blur shadow-sm border border-white/40">
                  <div className="p-3 rounded-full bg-white" style={{ color: data.theme.primary }}>
                    <MapPin size={24} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Meeting</p>
                    <p className="font-semibold">{data.meetingPoint || '未指定地點'}</p>
                    <p className="text-sm font-medium mt-0.5 text-gray-600">{data.meetingTime || '未指定時間'}</p>
                  </div>
                </div>
              )}
            </div>

            {/* 右欄：人員資訊 */}
            <div className="space-y-4">
              {(data.tourLeader || data.tourLeaderPhone) && (
                <div className="flex items-center gap-4 p-4 rounded-xl bg-white/50 backdrop-blur shadow-sm border border-white/40">
                  <div className="p-3 rounded-full bg-white" style={{ color: data.theme.primary }}>
                    <Users size={24} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Tour Leader</p>
                    <p className="font-semibold text-lg">{data.tourLeader || '敬請期待'}</p>
                    {data.tourLeaderPhone && (
                      <p className="text-sm font-medium mt-0.5 text-gray-600 flex items-center gap-1">
                        <Phone size={14} /> {data.tourLeaderPhone}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* 裝飾性區塊填補空白 */}
              <div className="h-full rounded-xl border-2 border-dashed border-white/50 flex items-center justify-center opacity-50">
                <MapPin size={32} style={{ color: data.theme.primary }} className="opacity-20" />
              </div>
            </div>
          </div>

        </div>
      </div>
    </PageWrapper>
  );
}
