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

  const formatEndDate = (dateStr: string, duration: number) => {
    if (!dateStr || duration < 1) return '____ / __ / __';
    const date = new Date(dateStr);
    date.setDate(date.getDate() + duration - 1);
    return `${date.getFullYear()} . ${(date.getMonth() + 1).toString().padStart(2, '0')} . ${date.getDate().toString().padStart(2, '0')}`;
  };

  const coverStyle = data.coverStyle || 'classic';

  const renderClassic = () => {
    return (
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

          {/* Header 區塊：移除 Logo，僅留空白讓排版不會擠到頂端 */}
          <div className="flex flex-col items-center mb-12 h-16">
          </div>

          {/* Main Title & Subtitle */}
          <div className="flex-grow flex flex-col items-center justify-center text-center -mt-12">
            <div className="w-16 h-1 mb-8 rounded-full" style={{ backgroundColor: data.theme.primary }} />
            <h1
              className="text-3xl font-black mb-2 leading-tight tracking-wide whitespace-pre-wrap"
              style={{ color: data.theme.primary }}
            >
              {data.title || '旅遊說明會手冊'}
            </h1>
            {data.subTitle && (
              <h2 className="text-lg font-bold mb-4 tracking-widest opacity-80" style={{ color: data.theme.primary }}>
                {data.subTitle}
              </h2>
            )}
            <div className="w-16 h-1 mt-4 rounded-full" style={{ backgroundColor: data.theme.primary }} />
          </div>

          {/* Bottom Info Section: 日期、地點、Logo、旅行社名稱 */}
          <div className="mt-auto flex flex-col w-full pb-8">
            {/* 上方分隔線 */}
            <div className="w-full border-t border-dashed mb-6" style={{ borderColor: `${data.theme.primary}80` }} />

            {/* 日期與地點列 */}
            <div className="w-full flex justify-between items-center px-4 mb-4 text-base tracking-wider font-semibold" style={{ color: data.theme.primary }}>
              <div className="flex items-center gap-2">
                <Calendar size={18} />
                <span>{formatDate(data.startDate)}</span>
                <span className="text-gray-400 font-normal mx-2">~</span>
                <span>{formatEndDate(data.startDate, data.duration)}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={18} />
                <span>{data.destination || '未指派地點'}</span>
              </div>
            </div>

            {/* 下方分隔線 */}
            <div className="w-full border-b border-dashed mb-10" style={{ borderColor: `${data.theme.primary}80` }} />

            {/* Logo 與 旅行社名稱 (置中排列) */}
            <div className="flex flex-col items-center justify-center gap-4">
              {data.logo && (
                <div className="max-w-[160px]">
                  <img src={data.logo} alt="Logo" className="w-full h-auto object-contain max-h-16" />
                </div>
              )}
              {data.agency && data.showAgencyOnCover !== false && (
                <p className="tracking-[0.2em] font-black text-lg uppercase opacity-90" style={{ color: data.theme.primary }}>
                  {data.agency}
                </p>
              )}
            </div>
          </div>

        </div>
      </div>
    );
  };

  const renderModern = () => {
    return (
      <div className="absolute inset-0 flex flex-col p-8 justify-between">
        {/* 內嵌質感邊框 */}
        <div 
          className="absolute inset-6 border pointer-events-none z-0 rounded-lg" 
          style={{ borderColor: `${data.theme.primary}15` }} 
        />
        
        <div className="relative z-10 flex flex-col h-full justify-between p-4">
          {/* 頁首標示 */}
          <div className="flex justify-between items-center">
            <span className="text-[10px] tracking-[0.25em] font-extrabold uppercase opacity-65" style={{ color: data.theme.primary }}>
              {data.agency || 'TRAVEL PORTFOLIO'}
            </span>
            <span className="text-[10px] tracking-[0.15em] font-black opacity-60" style={{ color: data.theme.primary }}>
              {data.groupNumber ? `NO. ${data.groupNumber}` : 'MEMORIES'}
            </span>
          </div>

          {/* 主視覺排版 (雜誌拼貼) */}
          <div className="my-auto flex flex-col gap-6 items-center justify-center py-4">
            {data.coverImage ? (
              <div className="w-[85%] aspect-[16/10] overflow-hidden rounded-2xl shadow-lg border border-gray-100/50 transform hover:scale-[1.02] transition-all duration-300">
                <img src={data.coverImage} alt="Cover" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-20 h-0.5 rounded" style={{ backgroundColor: data.theme.primary }} />
            )}

            <div className="text-center space-y-3 px-6 max-w-[90%]">
              <span className="text-[10px] font-black tracking-[0.3em] opacity-50 uppercase" style={{ color: data.theme.primary }}>
                {data.destination || 'EXPLORE THE WORLD'}
              </span>
              <h1 className="text-3xl font-black tracking-wide leading-snug whitespace-pre-wrap" style={{ color: data.theme.primary }}>
                {data.title || '旅遊說明會手冊'}
              </h1>
              {data.subTitle && (
                <p className="text-sm font-semibold tracking-[0.2em] opacity-80" style={{ color: data.theme.primary }}>
                  {data.subTitle}
                </p>
              )}
            </div>
            
            <div className="w-10 h-0.5 rounded" style={{ backgroundColor: data.theme.primary }} />
          </div>

          {/* 底部精緻資訊格 */}
          <div className="flex justify-between items-end border-t pt-4" style={{ borderColor: `${data.theme.primary}20` }}>
            <div className="space-y-1">
              <div className="text-[8px] font-extrabold tracking-widest text-gray-400">ITINERARY DATES</div>
              <div className="text-xs font-bold flex items-center gap-1.5" style={{ color: data.theme.primary }}>
                <span>{formatDate(data.startDate)}</span>
                <span className="opacity-45">~</span>
                <span>{formatEndDate(data.startDate, data.duration)}</span>
              </div>
            </div>
            
            {data.logo ? (
              <div className="max-w-[100px] h-6 flex items-center">
                <img src={data.logo} alt="Logo" className="max-h-full object-contain" />
              </div>
            ) : (
              <div className="text-right space-y-1">
                <div className="text-[8px] font-extrabold tracking-widest text-gray-400">DESTINATION</div>
                <div className="text-xs font-extrabold tracking-wider" style={{ color: data.theme.primary }}>
                  {data.destination || '未指派地點'}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderSplitGradient = () => {
    return (
      <div 
        className="absolute inset-0 flex flex-col justify-between p-10 overflow-hidden" 
        style={{ 
          background: `linear-gradient(180deg, ${data.theme.primary}12 0%, ${data.theme.secondary} 100%)` 
        }}
      >
        {/* 漸層幾何發光背景 */}
        <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full blur-3xl opacity-20 pointer-events-none" style={{ backgroundColor: data.theme.primary }} />
        <div className="absolute -bottom-20 -right-20 w-72 h-72 rounded-full blur-3xl opacity-15 pointer-events-none" style={{ backgroundColor: data.theme.primary }} />

        <div className="relative z-10 flex flex-col h-full justify-between items-center text-center">
          {/* 頂部文字列 */}
          <div className="w-full flex justify-between items-center text-xs opacity-75 font-semibold" style={{ color: data.theme.primary }}>
            <span className="tracking-wider">{data.agency || '鑫囍旅行'}</span>
            <span className="tracking-widest">{data.destination || '精選行程'}</span>
          </div>

          {/* 拍立得明信片相框視覺 */}
          <div className="my-auto py-4 flex flex-col items-center">
            {data.coverImage ? (
              <div className="w-56 h-56 rounded-[2.2rem] overflow-hidden border-4 border-white shadow-xl transform rotate-[-1.5deg] hover:rotate-0 transition-transform duration-500 relative z-10">
                <img src={data.coverImage} alt="Cover" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-32 h-32 rounded-full flex items-center justify-center border-2 border-dashed border-gray-300 bg-white/40 text-gray-400 text-xs font-bold tracking-widest">
                TRAVEL
              </div>
            )}

            {/* 標題與副標 */}
            <div className="mt-8 space-y-2.5 max-w-[85%]">
              <h1 className="text-3xl font-black tracking-wide leading-snug drop-shadow-sm" style={{ color: data.theme.primary }}>
                {data.title || '旅遊說明會手冊'}
              </h1>
              {data.subTitle && (
                <p className="text-xs font-bold tracking-[0.25em] opacity-80" style={{ color: data.theme.primary }}>
                  {data.subTitle}
                </p>
              )}
            </div>
          </div>

          {/* 底部藥丸按鈕型資訊條 */}
          <div className="w-full space-y-4">
            <div 
              className="inline-flex items-center gap-4 px-6 py-3 rounded-full bg-white/75 backdrop-blur-sm border shadow-sm text-xs font-bold" 
              style={{ borderColor: `${data.theme.primary}12`, color: data.theme.primary }}
            >
              <span>{formatDate(data.startDate)}</span>
              <span className="opacity-25">|</span>
              <span>{data.duration} 天</span>
              <span className="opacity-25">|</span>
              <span>{data.destination || '未指派地點'}</span>
            </div>

            {data.logo && (
              <div className="h-8 flex items-center justify-center mt-2">
                <img src={data.logo} alt="Logo" className="h-full object-contain max-w-[120px] opacity-75" />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderPhotocentric = () => {
    return (
      <div className="absolute inset-0 flex flex-col justify-end overflow-hidden">
        {data.coverImage ? (
          <>
            <img src={data.coverImage} alt="Cover Background" className="absolute inset-0 w-full h-full object-cover" />
            {/* 深色漸層偏光罩 */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/15 z-0" />
          </>
        ) : (
          /* 預設質感色彩漸層 */
          <div 
            className="absolute inset-0 z-0" 
            style={{ 
              background: `radial-gradient(circle at 70% 30%, ${data.theme.primary}F0 0%, ${data.theme.primary} 100%)` 
            }} 
          />
        )}

        {/* 漂浮磨砂玻璃字卡 (Glassmorphism Card) */}
        <div 
          className="relative z-10 p-8 m-6 rounded-[2rem] backdrop-blur-md border shadow-2xl flex flex-col justify-between min-h-[50%]"
          style={{ 
            backgroundColor: data.coverImage ? 'rgba(255, 255, 255, 0.88)' : 'rgba(255, 255, 255, 0.94)',
            borderColor: 'rgba(255, 255, 255, 0.25)',
            color: data.theme.primary
          }}
        >
          {/* 卡片頂部 */}
          <div className="flex justify-between items-center border-b pb-4 mb-4" style={{ borderColor: `${data.theme.primary}15` }}>
            <div className="flex items-center gap-2.5">
              {data.logo && (
                <img src={data.logo} alt="Logo" className="h-6 object-contain max-w-[80px]" />
              )}
              <span className="text-xs font-black tracking-widest uppercase opacity-90">{data.agency || 'EXPLORER'}</span>
            </div>
            <span className="text-xs font-black tracking-wider bg-black/5 px-3 py-1 rounded-full">{data.destination || '特別行程'}</span>
          </div>

          {/* 卡片中部 */}
          <div className="my-auto py-2">
            <h1 className="text-3xl font-black tracking-wide leading-snug" style={{ color: data.theme.primary }}>
              {data.title || '旅遊說明會手冊'}
            </h1>
            {data.subTitle && (
              <p className="text-sm font-semibold tracking-[0.18em] mt-3 opacity-80" style={{ color: data.theme.primary }}>
                {data.subTitle}
              </p>
            )}
          </div>

          {/* 卡片底部 */}
          <div className="border-t pt-4 mt-4 flex justify-between items-center text-xs font-bold" style={{ borderColor: `${data.theme.primary}15` }}>
            <div className="flex items-center gap-1.5 opacity-85">
              <Calendar size={13} className="shrink-0" />
              <span>{formatDate(data.startDate)}</span>
              <span>~</span>
              <span>{formatEndDate(data.startDate, data.duration)}</span>
            </div>
            <div className="bg-black/5 px-3 py-1 rounded-full text-[10px] tracking-widest font-black shrink-0">
              {data.duration} 天旅程
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <PageWrapper hideHeaderFooter={true} className="cover-page">
      {coverStyle === 'modern' && renderModern()}
      {coverStyle === 'split-gradient' && renderSplitGradient()}
      {coverStyle === 'photocentric' && renderPhotocentric()}
      {coverStyle === 'classic' && renderClassic()}
    </PageWrapper>
  );
}
