/**
 * 擷取指定容器內的所有手冊分頁並轉為高解析度圖片
 * @param containerSelector 選擇器，通常是 '.print-only-container'
 * @param onProgress 進度回呼
 */
export async function captureBrochurePages(
  containerSelector: string, 
  onProgress?: (current: number, total: number) => void
): Promise<string[]> {
  const container = document.querySelector(containerSelector);
  if (!container) {
    throw new Error('找不到擷取容器');
  }

  // @ts-ignore - 從 index.html CDN 載入
  const h2i = window.htmlToImage;
  if (!h2i) {
    throw new Error('html-to-image 套件尚未載入完成');
  }

  // 取得所有分頁元素
  const pages = Array.from(container.querySelectorAll('.a5-page'));
  const total = pages.length;
  const images: string[] = [];

  // 暫時確保容器是可見的但位移到螢幕外
  const originalStyle = (container as HTMLElement).style.cssText;
  (container as HTMLElement).style.cssText += '; display: block !important; position: fixed !important; left: -9999px !important; top: 0 !important; visibility: visible !important;';

  try {
    const batchSize = 2; // 分批並行處理，提升速度但避免過度佔用資源
    for (let i = 0; i < total; i += batchSize) {
        const batch = pages.slice(i, i + batchSize);
        const results = await Promise.all(batch.map(async (page, index) => {
            const actualIdx = i + index;
            // 由於併發，進度稍微估算
            if (onProgress) onProgress(actualIdx + 1, total);
            
            // 改用 toPng 確保最高清晰度 (PNG 不失真)
            return h2i.toPng(page as HTMLElement, {
                pixelRatio: 2.5, // 提升像素比至 2.5，確保文字在電子書中清晰
                backgroundColor: '#ffffff',
                skipAnimations: true,
                cacheBust: true,
            });
        }));
        
        images.push(...results);
    }
  } finally {
    // 恢復原始樣式
    (container as HTMLElement).style.cssText = originalStyle;
  }

  return images;
}
