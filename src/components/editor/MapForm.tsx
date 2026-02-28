import React, { useCallback, useState } from 'react';
import { useBrochure } from '../../context/BrochureContext';
import { Map, ImagePlus, Trash2, Scissors } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { ImageCropModal } from './ImageCropModal';
import { compressImage } from '../../lib/imageUtils';

export function MapForm() {
    const { data, updateData } = useBrochure();
    const [showCrop, setShowCrop] = useState(false);

    const handleImageUpload = useCallback(async (file: File) => {
        try {
            const compressedSrc = await compressImage(file);
            updateData({ mapPage: { src: compressedSrc, caption: '', fit: data.mapPage?.fit || 'cover' } });
        } catch (error) {
            console.error('地圖圖片壓縮失敗', error);
        }
    }, [updateData, data.mapPage?.fit]);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles[0]) handleImageUpload(acceptedFiles[0]);
    }, [handleImageUpload]);

    const removeMap = (e: React.MouseEvent) => {
        e.stopPropagation();
        updateData({ mapPage: undefined });
    };

    const setFit = (fit: 'cover' | 'contain') => {
        if (!data.mapPage) return;
        updateData({ mapPage: { ...data.mapPage, fit } });
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop, accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] }, maxFiles: 1
    });

    return (
        <>
            <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2 mb-2" style={{ color: data.theme.primary }}>
                    <Map size={20} />
                    旅遊地圖
                </h3>

                <div className="p-5 bg-white border border-gray-200 rounded-xl shadow-sm">
                    <label className="block text-xs font-medium text-gray-700 mb-2">上傳地圖圖片</label>

                    {data.mapPage?.src ? (
                        <div className="space-y-3">
                            {/* 顯示方式選擇 */}
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-gray-600">顯示方式：</span>
                                <div className="flex rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                                    <button
                                        onClick={() => setFit('cover')}
                                        className={`px-3 py-1.5 text-xs font-semibold transition-colors ${(data.mapPage?.fit ?? 'cover') === 'cover'
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-white text-gray-600 hover:bg-gray-50'
                                            }`}
                                    >
                                        滿版裁切
                                    </button>
                                    <button
                                        onClick={() => setFit('contain')}
                                        className={`px-3 py-1.5 text-xs font-semibold transition-colors border-l border-gray-200 ${data.mapPage?.fit === 'contain'
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-white text-gray-600 hover:bg-gray-50'
                                            }`}
                                    >
                                        保持比例
                                    </button>
                                </div>
                                <span className="text-[10px] text-gray-400">
                                    {data.mapPage?.fit === 'contain' ? '（四周留底色）' : '（邊緣可能裁切）'}
                                </span>
                            </div>

                            {/* 圖片預覽縮圖 */}
                            <div className="relative aspect-[3/4] w-full max-w-sm mx-auto rounded-lg border-2 border-gray-200 overflow-hidden group bg-gray-100">
                                <img
                                    src={data.mapPage.src}
                                    alt="Map"
                                    className={`w-full h-full ${data.mapPage?.fit === 'contain' ? 'object-contain' : 'object-cover'}`}
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                    <button
                                        onClick={() => setShowCrop(true)}
                                        className="bg-white/90 text-blue-600 rounded-full p-2 shadow-sm hover:scale-110 transition-transform flex items-center gap-2 text-sm font-bold"
                                    >
                                        <Scissors size={16} /> 剪裁
                                    </button>
                                    <button
                                        onClick={removeMap}
                                        className="bg-white/90 text-red-500 rounded-full p-2 shadow-sm hover:scale-110 transition-transform flex items-center gap-2 text-sm font-bold"
                                    >
                                        <Trash2 size={16} /> 移除
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div
                            {...getRootProps()}
                            tabIndex={0}
                            onPaste={(e) => {
                                const items = e.clipboardData.items;
                                for (let i = 0; i < items.length; i++) {
                                    if (items[i].type.startsWith('image/')) {
                                        const file = items[i].getAsFile();
                                        if (file) { handleImageUpload(file); e.preventDefault(); break; }
                                    }
                                }
                            }}
                            className={`aspect-[3/4] w-full max-w-sm mx-auto relative border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors outline-none focus:border-blue-300 ${isDragActive ? 'border-blue-400 bg-blue-50/50' : 'border-gray-300 hover:bg-gray-50'}`}
                        >
                            <input {...getInputProps()} />
                            <div className="bg-white p-3 rounded-full shadow-sm mb-3 text-gray-400">
                                <ImagePlus size={32} />
                            </div>
                            <p className="text-sm font-medium text-gray-600">點擊、拖曳或 Ctrl+V 貼上</p>
                            <p className="text-xs text-gray-400 mt-1 px-4 text-center">支援高畫質旅遊圖、路線圖</p>
                        </div>
                    )}
                </div>
            </div>

            {/* 剪裁 Modal */}
            {showCrop && data.mapPage?.src && (
                <ImageCropModal
                    src={data.mapPage.src}
                    onConfirm={(croppedUrl) => {
                        if (data.mapPage) updateData({ mapPage: { ...data.mapPage, src: croppedUrl } });
                        setShowCrop(false);
                    }}
                    onClose={() => setShowCrop(false)}
                />
            )}
        </>
    );
}
