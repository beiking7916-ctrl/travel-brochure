import React, { ReactNode, createContext, useContext } from 'react';
import { useBrochure } from '../../context/BrochureContext';

// 新增 Context 以便從外部控制所有 PageWrapper 的方位
export const PageSideContext = createContext<'left' | 'right'>('right');

interface PageWrapperProps {
    children: ReactNode;
    title?: string;
    icon?: ReactNode;
    hideHeaderFooter?: boolean;
    className?: string;
    sectionId?: string;
    pageSide?: 'left' | 'right'; // 保留屬性，優先權高於 Context
}

export function PageWrapper({ children, title, icon, hideHeaderFooter = false, className = '', sectionId, pageSide }: PageWrapperProps) {
    const { data } = useBrochure();
    const contextSide = useContext(PageSideContext);
    
    // 優先順序：Progs > Context > 預設值 ('right')
    const finalSide = pageSide || contextSide || 'right';

    // 取得當前頁面專屬設定，若無則用全域設定
    const specificSettings = sectionId ? data.pageSettings?.[sectionId] : undefined;
    const currentFontSize = specificSettings?.fontSize || data.contentFontSize || 14;
    const currentImageScale = specificSettings?.imageScale || data.imageHeightScale || 1.0;

    const sideClass = finalSide === 'left' ? 'page-left' : 'page-right';

    if (hideHeaderFooter) {
        return (
            <div
                className={`a5-page ${sideClass} p-6 flex flex-col relative ${className}`}
                style={{
                    backgroundColor: data.theme.secondary,
                    color: data.theme.text,
                    '--content-font-size': `${currentFontSize}px`,
                    '--image-height-scale': currentImageScale,
                    'fontFamily': data.fontFamily || "'Noto Sans TC', sans-serif"
                } as React.CSSProperties}
            >
                {children}
            </div>
        );
    }

    const customHeaderText = data.headerText || data.agency || '';
    const headerTitle = title || '';

    return (
        <div
            className={`a5-page ${sideClass} relative overflow-hidden flex flex-col pt-12 pb-12 px-6 ${className}`}
            style={{
                backgroundColor: data.theme.secondary,
                color: data.theme.text,
                '--content-font-size': `${currentFontSize}px`,
                '--image-height-scale': currentImageScale,
                'fontFamily': data.fontFamily || "'Noto Sans TC', sans-serif"
            } as React.CSSProperties}
        >
            {/* 頁首 (由 CSS .page-left/.page-right 控制 flex-direction) */}
            <div
                className="absolute top-6 left-6 right-6 flex page-header text-xs font-semibold opacity-50 gap-2 items-center"
                style={{ color: data.theme.primary }}
            >
                {/* 統一渲染：方位的 order 由 CSS 控制 */}
                {data.headerLogo && (
                    <img src={data.headerLogo} alt="Header Logo" className="h-4 object-contain" />
                )}
                <div className="flex gap-2">
                    {/* 直接渲染兩者，CSS 會幫我們排好順序與對齊方向 */}
                    {customHeaderText && <span>{customHeaderText}</span>}
                    {customHeaderText && headerTitle && <span>-</span>}
                    {headerTitle && <span>{headerTitle}</span>}
                </div>
            </div>

            {/* 頁面標題 */}
            {title && (
                <div className="flex items-center gap-2 mb-6 pb-3 border-b-2" style={{ borderColor: `${data.theme.primary}20` }}>
                    <div className="p-1.5 rounded-lg bg-white shadow-sm scale-90" style={{ color: data.theme.primary }}>
                        {icon}
                    </div>
                    <h2 className="text-2xl font-bold tracking-wider" style={{ color: data.theme.primary }}>
                        {title}
                    </h2>
                </div>
            )}

            {/* 內容區域 */}
            <div className="flex-1 min-h-0 flex flex-col relative w-full">
                {children}
            </div>

            {/* 頁尾置中頁碼 (由 CSS ::after 控制 contents) */}
            <div
                className="absolute bottom-6 left-0 right-0 text-center text-xs font-medium opacity-50 page-footer"
                style={{ color: data.theme.primary }}
            />
        </div>
    );
}
