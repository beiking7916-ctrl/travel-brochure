import React, { useCallback } from 'react';
import { useBrochure } from '../../context/BrochureContext';
import { Building2, Plus, Trash2, Layout, LayoutPanelLeft, List, Image as ImageIcon, ChevronUp, ChevronDown } from 'lucide-react';
import { SectionSettings } from './SectionSettings';
import { useDropzone } from 'react-dropzone';
import { compressImage } from '../../lib/imageUtils';

export function HotelDetailForm() {
    const { data, updateData } = useBrochure();

    const addHotelDetail = () => {
        updateData({
            hotelDetails: [
                ...(data.hotelDetails || []),
                { id: crypto.randomUUID(), name: '', intro: '', roomType: '', facilities: [], images: [] },
            ],
        });
    };

    const removeHotelDetail = (index: number) => {
        const newHotels = [...data.hotelDetails];
        newHotels.splice(index, 1);
        updateData({ hotelDetails: newHotels });
    };

    const updateHotelDetail = (index: number, field: string, value: any) => {
        const newHotels = [...data.hotelDetails];
        newHotels[index] = { ...newHotels[index], [field]: value };
        updateData({ hotelDetails: newHotels });
    };

    const handleFacilityChange = (hotelIndex: number, facilityText: string) => {
        const facilities = facilityText.split('\n').filter(f => f.trim());
        updateHotelDetail(hotelIndex, 'facilities', facilities);
    };

    const handleImageUpload = async (hotelIndex: number, file: File) => {
        try {
            const compressedImage = await compressImage(file);
            const newHotels = [...data.hotelDetails];
            const hotel = newHotels[hotelIndex];
            hotel.images = [...hotel.images, compressedImage].slice(0, 3);
            updateData({ hotelDetails: newHotels });
        } catch (error) {
            console.error('飯店詳細圖片壓縮失敗', error);
        }
    };

    const removeImage = (hotelIndex: number, imgIndex: number, e: React.MouseEvent) => {
        e.stopPropagation();
        const newHotels = [...data.hotelDetails];
        newHotels[hotelIndex].images.splice(imgIndex, 1);
        updateData({ hotelDetails: newHotels });
    };

    const inputClassName = "w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all text-sm text-gray-700";
    const labelClassName = "block text-xs font-medium text-gray-700 mb-1.5";

    return (
        <div className="space-y-6 pb-20">
            <SectionSettings id="hotelDetail" />
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg flex items-center gap-2" style={{ color: data.theme.primary }}>
                    <Building2 size={20} />
                    飯店詳細介紹
                </h3>
                <button
                    onClick={addHotelDetail}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white rounded-lg transition-colors shadow-sm"
                    style={{ backgroundColor: data.theme.primary }}
                >
                    <Plus size={16} />
                    新增介紹
                </button>
            </div>

            <div className="space-y-6">
                {data.hotelDetails?.map((hotel, index) => (
                    <div key={hotel.id} className="p-5 bg-white border border-gray-200 rounded-xl shadow-sm relative group overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: data.theme.secondary || '#9ca3af' }} />

                        <button
                            onClick={() => removeHotelDetail(index)}
                            className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        >
                            <Trash2 size={18} />
                        </button>

                        <div className="grid md:grid-cols-2 gap-6 pl-2">
                            <div className="space-y-4">
                                <div>
                                    <label className={labelClassName}>飯店名稱</label>
                                    <input
                                        type="text"
                                        value={hotel.name}
                                        onChange={(e) => updateHotelDetail(index, 'name', e.target.value)}
                                        className={inputClassName}
                                        placeholder="例如：東京帝國飯店"
                                    />
                                </div>
                                <div>
                                    <label className={labelClassName}>房型說明</label>
                                    <input
                                        type="text"
                                        value={hotel.roomType}
                                        onChange={(e) => updateHotelDetail(index, 'roomType', e.target.value)}
                                        className={inputClassName}
                                        placeholder="例如：豪華雙人房"
                                    />
                                </div>
                                <div>
                                    <label className={labelClassName}>詳細介紹</label>
                                    <textarea
                                        value={hotel.intro}
                                        onChange={(e) => updateHotelDetail(index, 'intro', e.target.value)}
                                        className={`${inputClassName} h-24 resize-none`}
                                        placeholder="輸入飯店的詳細特色說明..."
                                    />
                                </div>
                                <div>
                                    <label className={labelClassName}>底部版面配置</label>
                                    <select
                                        value={hotel.bottomLayout || 'left-info-right-images'}
                                        onChange={(e) => updateHotelDetail(index, 'bottomLayout', e.target.value)}
                                        className={inputClassName}
                                    >
                                        <option value="left-info-right-images">左：設施介紹 | 右：圖片 2&3</option>
                                        <option value="left-images-right-info">左：圖片 2&3 | 右：設施介紹</option>
                                        <option value="full-info">全寬：僅設施介紹 (不顯示圖片 2&3)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className={labelClassName}>設施重點 (每行一項)</label>
                                    <textarea
                                        value={hotel.facilities?.join('\n') || ''}
                                        onChange={(e) => handleFacilityChange(index, e.target.value)}
                                        className={`${inputClassName} h-20 resize-none`}
                                        placeholder={`免費 Wi-Fi\n室內溫泉\n自助早餐`}
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className={labelClassName}>環境與房型圖 (最多 3 張，第 1 張為頂部大圖)</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {hotel.images.map((img, imgIdx) => (
                                        <div key={imgIdx} className="relative aspect-video rounded-lg overflow-hidden group/img border border-gray-200">
                                            <img src={img} alt="" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity">
                                                <button
                                                    onClick={(e) => removeImage(index, imgIdx, e)}
                                                    className="bg-white/90 text-red-500 p-2 rounded-full hover:scale-110"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                            <div className="absolute top-1 left-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded backdrop-blur-sm font-bold uppercase tracking-widest">
                                                Image {imgIdx + 1}
                                            </div>
                                        </div>
                                    ))}
                                    {hotel.images.length < 3 && (
                                        <ImageUploader onUpload={(file) => handleImageUpload(index, file)} />
                                    )}
                                </div>
                                <p className="text-[10px] text-gray-400 italic">
                                    註：圖片 1 會顯示在頂部全寬；圖片 2 與 3 會根據「底部版面配置」顯示在下方。
                                </p>
                            </div>
                        </div>
                    </div>
                ))}

                {(!data.hotelDetails || data.hotelDetails.length === 0) && (
                    <div className="text-center py-10 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl">
                        <Building2 size={40} className="mx-auto text-gray-300 mb-3" />
                        <p className="text-gray-500 text-sm">目前沒有飯店詳細介紹</p>
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
            <ImageIcon size={24} className={isDragActive ? 'text-blue-500' : 'text-gray-400'} />
            <span className="text-[10px] text-gray-400 mt-2">點擊、拖曳或 Ctrl+V 貼上</span>
        </div>
    );
}
