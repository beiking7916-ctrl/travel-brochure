import React, { useCallback, useState } from 'react';
import { useBrochure } from '../../context/BrochureContext';
import { Map, ImagePlus, Trash2, Scissors } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { ImageCropModal } from './ImageCropModal';
import { compressImage } from '../../lib/imageUtils';
import { SectionSettings } from './SectionSettings';

export function MapForm() {
    const { data, updateData } = useBrochure();
    const [isCropOpen, setIsCropOpen] = useState(false);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        if (acceptedFiles[0]) {
            try {
                const compressed = await compressImage(acceptedFiles[ acceptedFiles.length - 1 ]);
                updateData({ mapPage: { src: compressed, fit: data.mapPage?.fit || 'cover' } });
            } catch (err) {
                console.error('地圖圖片壓縮失敗', err);
            }
        }
    }, [data.mapPage, updateData]);

    const handlePaste = useCallback(async (e: React.ClipboardEvent) => {
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image/') !== -1) {
                const file = items[i].getAsFile();
                if (file) {
                    try {
                        const compressed = await compressImage(file);
                        updateData({ mapPage: { src: compressed, fit: data.mapPage?.fit || 'cover' } });
                    } catch (err) {
                        console.error('貼上圖片壓縮失敗', err);
                    }
                    e.preventDefault();
                    break;
                }
            }
        }
    }, [data.mapPage, updateData]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
        maxFiles: 1,
    });

    const removeMap = () => {
        updateData({ mapPage: undefined });
    };

    const updateFit = (fit: 'cover' | 'contain') => {
        if (data.mapPage) {
            updateData({ mapPage: { ...data.mapPage, fit } });
        }
    };

    return (
        <div className="space-y-4">
            <SectionSettings id="map" />
            <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-lg flex items-center gap-2" style={{ color: data.theme.primary }}>
                    <Map size={20} />
                    全頁地圖
                </h3>
                {data.mapPage && (
                    <button
                        onClick={removeMap}
                        className="text-red-500 hover:text-red-600 text-sm font-medium flex items-center gap-1 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors"
                    >
                        <Trash2 size={14} /> 刪除地圖
                    </button>
                )}
            </div>

            {!data.mapPage ? (
                <div
                    {...getRootProps()}
                    onPaste={handlePaste}
                    tabIndex={0}
                    className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors flex flex-col items-center justify-center min-h-[300px] outline-none ${isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                        }`}
                >
                    <input {...getInputProps()} />
                    <div className="bg-blue-50 p-4 rounded-full mb-4">
                        <ImagePlus className="text-blue-500" size={32} />
                    </div>
                    <p className="font-bold text-gray-700">點擊、拖曳或 <kbd className="bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200 text-xs">Ctrl+V</kbd> 貼上圖片</p>
                    <p className="text-sm text-gray-400 mt-1">建議解析度 1200x1700 以上</p>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden p-2">
                        <div className="relative aspect-[1/1.4] w-full max-w-[300px] mx-auto relative border border-gray-100 rounded-lg flex flex-col items-center justify-center overflow-hidden outline-none focus:border-blue-300 ${isDragActive ? 'border-blue-400 bg-blue-50/50' : 'border-gray-300 hover:bg-gray-50'}">
                            <img
                                src={data.mapPage.src}
                                alt="Map Preview"
                                className={`w-full h-full ${data.mapPage.fit === 'cover' ? 'object-cover' : 'object-contain'}`}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => updateFit('cover')}
                            className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${data.mapPage.fit === 'cover'
                                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                                    : 'border-gray-100 text-gray-500 hover:border-gray-200'
                                }`}
                        >
                            <div className="w-12 h-16 bg-gray-200 rounded border border-gray-300 relative overflow-hidden">
                                <div className="absolute inset-0 bg-blue-400 opacity-50" />
                            </div>
                            <span className="text-xs font-bold">滿版裁切 (Cover)</span>
                        </button>
                        <button
                            onClick={() => updateFit('contain')}
                            className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${data.mapPage.fit === 'contain'
                                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                                    : 'border-gray-100 text-gray-500 hover:border-gray-200'
                                }`}
                        >
                            <div className="w-12 h-16 bg-gray-200 rounded border border-gray-300 relative flex items-center justify-center p-1">
                                <div className="w-full h-3/4 bg-blue-400 opacity-50 rounded-sm" />
                            </div>
                            <span className="text-xs font-bold">保持比例 (Contain)</span>
                        </button>
                    </div>

                    <button
                        onClick={() => setIsCropOpen(true)}
                        className="w-full py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                    >
                        <Scissors size={18} /> 裁切地圖範圍
                    </button>
                </div>
            )}

            {isCropOpen && data.mapPage && (
                <ImageCropModal
                    src={data.mapPage.src}
                    aspectRatio={1 / 1.414}
                    onConfirm={(cropped) => {
                        updateData({ mapPage: { ...data.mapPage!, src: cropped } });
                        setIsCropOpen(false);
                    }}
                    onClose={() => setIsCropOpen(false)}
                />
            )}
        </div>
    );
}
