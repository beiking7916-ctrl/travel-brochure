import React, { useCallback, useState } from 'react';
import { useBrochure } from '../../context/BrochureContext';
import { Layout, ImagePlus, Trash2, Plus, Type, MoreHorizontal, ChevronUp, ChevronDown, Check, FileText, Image as ImageIcon } from 'lucide-react';
import { SectionSettings } from './SectionSettings';
import { useDropzone } from 'react-dropzone';
import { compressImage } from '../../lib/imageUtils';

export function CustomPageForm() {
    const { data, updateData } = useBrochure();
    const pages = data.customPages || [];

    const addPage = () => {
        updateData({
            customPages: [
                ...pages,
                {
                    id: crypto.randomUUID(),
                    title: '新建自訂頁面',
                    content: '請輸入內容...',
                    images: [],
                    layout: 'single'
                }
            ]
        });
    };

    const removePage = (index: number) => {
        const newPages = [...pages];
        newPages.splice(index, 1);
        updateData({ customPages: newPages });
    };

    const updatePage = (index: number, field: string, value: any) => {
        const newPages = [...pages];
        newPages[index] = { ...newPages[index], [field]: value };
        updateData({ customPages: newPages });
    };

    const handleImageUpload = async (pageIndex: number, file: File) => {
        try {
            const compressedImage = await compressImage(file);
            const newPages = [...pages];
            newPages[pageIndex].images.push(compressedImage);
            updateData({ customPages: newPages });
        } catch (error) {
            console.error('自訂頁面圖片壓縮失敗', error);
        }
    };

    const updateImage = (pageIndex: number, imgIndex: number, val: string) => {
        const newPages = [...pages];
        newPages[pageIndex].images[imgIndex] = val;
        updateData({ customPages: newPages });
    };

    const removeImage = (pageIndex: number, imgIndex: number) => {
        const newPages = [...pages];
        newPages[pageIndex].images.splice(imgIndex, 1);
        updateData({ customPages: newPages });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="font-semibold text-lg flex items-center gap-2" style={{ color: data.theme.primary }}>
                    <FileText size={20} />
                    自訂頁面
                </h3>
                <button
                    onClick={addPage}
                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                >
                    <Plus size={16} />
                    新增頁面
                </button>
            </div>

            <div className="space-y-6">
                {pages.map((page, index) => (
                    <div key={page.id} className="p-4 bg-gray-50 rounded-xl space-y-4 border border-gray-100 relative group">
                        <SectionSettings id={page.id} />
                        <button
                            onClick={() => removePage(index)}
                            className="absolute -top-3 -right-3 p-2 bg-white text-red-500 rounded-full shadow-md hover:bg-red-50 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                        >
                            <Trash2 size={16} />
                        </button>

                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1 space-y-3">
                                {/* 頁面標題 */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">標題</label>
                                    <input
                                        type="text"
                                        value={page.title}
                                        onChange={(e) => updatePage(index, 'title', e.target.value)}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-shadow"
                                        placeholder="例：行前須知 / 公司介紹"
                                    />
                                </div>

                                {/* 版面選擇 */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                                        <Layout size={16} className="text-gray-400" />
                                        版面配置
                                    </label>
                                    <select
                                        value={page.layout}
                                        onChange={(e) => updatePage(index, 'layout', e.target.value)}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 outline-none"
                                    >
                                        <option value="single">單一圖片 (滿版或置頂)</option>
                                        <option value="top-1-bottom-2">上一圖，下兩圖</option>
                                        <option value="grid-4">四宮格</option>
                                    </select>
                                </div>
                            </div>

                            {/* 圖片管理 */}
                            <div className="flex-1 space-y-2">
                                <label className="text-sm font-medium text-gray-700 flex items-center justify-between">
                                    <span><ImageIcon size={16} className="inline mr-1 text-gray-400" />圖片管理</span>
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {page.images.map((img, imgIdx) => (
                                        <div key={imgIdx} className="relative aspect-video rounded-lg overflow-hidden group/img border border-gray-200 bg-white">
                                            <img src={img} alt="" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => removeImage(index, imgIdx)}
                                                    className="bg-white/90 text-red-500 p-1.5 rounded-full hover:scale-110"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {page.images.length < 4 && (
                                        <ImageUploader onUpload={(file) => handleImageUpload(index, file)} />
                                    )}
                                </div>
                                <p className="text-[10px] text-gray-400 italic">支援貼上圖片或拖曳上傳</p>
                            </div>
                        </div>

                        {/* 內容 Rich Text */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">內文 (支援基礎 Rich Text `**粗體**` `*藍字*`)</label>
                            <textarea
                                value={page.content}
                                onChange={(e) => updatePage(index, 'content', e.target.value)}
                                className="w-full h-32 px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-shadow resize-none"
                                placeholder="請輸入頁面內文..."
                            />
                        </div>

                    </div>
                ))}

                {pages.length === 0 && (
                    <div className="text-center py-10 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                        <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                            <FileText size={24} className="text-gray-400" />
                        </div>
                        <p className="text-gray-500 font-medium mb-1">目前沒有自訂頁面</p>
                        <p className="text-sm text-gray-400">點擊上方「新增頁面」來在手冊中插入全新內容</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function ImageUploader({ onUpload }: { onUpload: (file: File) => void }) {
    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles[0]) onUpload(acceptedFiles[0]);
    }, [onUpload]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop, accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] }, maxFiles: 1
    });

    return (
        <div
            {...getRootProps()}
            tabIndex={0}
            onPaste={(e) => {
                const items = e.clipboardData.items;
                for (let i = 0; i < items.length; i++) {
                    if (items[i].type.startsWith('image/')) {
                        const file = items[i].getAsFile();
                        if (file) { onUpload(file); e.preventDefault(); break; }
                    }
                }
            }}
            className={`relative aspect-video rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors outline-none focus:border-blue-300 ${isDragActive ? 'border-blue-400 bg-blue-50/50' : 'border-gray-300 hover:bg-gray-50'
                }`}
        >
            <input {...getInputProps()} />
            <ImagePlus size={20} className={isDragActive ? 'text-blue-500' : 'text-gray-400'} />
            <span className="text-[10px] text-gray-400 mt-1">貼上或上傳</span>
        </div>
    );
}

