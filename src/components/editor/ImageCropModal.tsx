import React, { useState, useRef, useCallback } from 'react';
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { X, Scissors, RotateCcw, Check } from 'lucide-react';

interface ImageCropModalProps {
    src: string;
    aspectRatio?: number;       // 例如 3/4 = 0.75，undefined = 自由裁切
    onConfirm: (croppedDataUrl: string) => void;
    onClose: () => void;
}

function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number): Crop {
    return centerCrop(
        makeAspectCrop({ unit: '%', width: 90 }, aspect, mediaWidth, mediaHeight),
        mediaWidth,
        mediaHeight
    );
}

export function ImageCropModal({ src, aspectRatio, onConfirm, onClose }: ImageCropModalProps) {
    const imgRef = useRef<HTMLImageElement>(null);
    const [crop, setCrop] = useState<Crop>();
    const [completedCrop, setCompletedCrop] = useState<PixelCrop>();

    const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
        const { naturalWidth: width, naturalHeight: height } = e.currentTarget;
        if (aspectRatio) {
            setCrop(centerAspectCrop(width, height, aspectRatio));
        } else {
            // 預設自由裁切，初始選取 90% 區域
            setCrop(centerCrop(
                { unit: '%', x: 5, y: 5, width: 90, height: 90 },
                width, height
            ));
        }
    }, [aspectRatio]);

    const handleConfirm = useCallback(() => {
        if (!completedCrop || !imgRef.current) return;
        const canvas = document.createElement('canvas');
        const image = imgRef.current;
        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;
        canvas.width = completedCrop.width * scaleX;
        canvas.height = completedCrop.height * scaleY;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(
            image,
            completedCrop.x * scaleX,
            completedCrop.y * scaleY,
            completedCrop.width * scaleX,
            completedCrop.height * scaleY,
            0, 0,
            canvas.width,
            canvas.height
        );
        canvas.toBlob((blob) => {
            if (!blob) return;
            const reader = new FileReader();
            reader.onload = () => onConfirm(reader.result as string);
            reader.readAsDataURL(blob);
        }, 'image/jpeg', 0.95);
    }, [completedCrop, onConfirm]);

    const resetCrop = () => {
        if (!imgRef.current) return;
        const { naturalWidth: w, naturalHeight: h } = imgRef.current;
        if (aspectRatio) {
            setCrop(centerAspectCrop(w, h, aspectRatio));
        } else {
            setCrop(centerCrop({ unit: '%', x: 5, y: 5, width: 90, height: 90 }, w, h));
        }
        setCompletedCrop(undefined);
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/80">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <Scissors size={18} className="text-blue-500" />
                        剪裁圖片
                        {aspectRatio && (
                            <span className="text-xs font-normal text-gray-500 bg-white px-2 py-0.5 rounded-full border">
                                固定比例 {aspectRatio < 1 ? `3:4` : `${Math.round(aspectRatio * 4)}:4`}
                            </span>
                        )}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Crop Area */}
                <div className="flex-1 overflow-auto bg-gray-900 flex items-center justify-center p-4 min-h-0">
                    <ReactCrop
                        crop={crop}
                        onChange={(_, percentCrop) => setCrop(percentCrop)}
                        onComplete={(c) => setCompletedCrop(c)}
                        aspect={aspectRatio}
                        minWidth={20}
                        minHeight={20}
                    >
                        <img
                            ref={imgRef}
                            src={src}
                            alt="裁切"
                            onLoad={onImageLoad}
                            style={{ maxHeight: '65vh', maxWidth: '100%', objectFit: 'contain' }}
                        />
                    </ReactCrop>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-white">
                    <button
                        onClick={resetCrop}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
                    >
                        <RotateCcw size={15} />
                        重設選取
                    </button>
                    <div className="flex items-center gap-3">
                        <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors font-medium">
                            取消
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={!completedCrop?.width || !completedCrop?.height}
                            className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                        >
                            <Check size={16} />
                            確認剪裁
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
