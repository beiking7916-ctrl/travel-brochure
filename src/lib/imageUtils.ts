export async function compressImage(file: File | Blob, maxWidth = 1200): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // 等比縮小：若寬度大於上限，以寬度為準
                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }

                // 若高度還是大於上限，以高度為準
                if (height > maxWidth) {
                    width = Math.round((width * maxWidth) / height);
                    height = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    // 若無法取得 context，就原樣回傳
                    resolve(event.target?.result as string);
                    return;
                }

                // 繪製縮小後的圖片
                ctx.drawImage(img, 0, 0, width, height);

                // 轉換成 JPEG，並將畫質設為 0.75，大幅降低檔案大小
                const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.75);
                resolve(compressedDataUrl);
            };
            img.onerror = (error) => reject(error);
        };
        reader.onerror = (error) => reject(error);
    });
}
