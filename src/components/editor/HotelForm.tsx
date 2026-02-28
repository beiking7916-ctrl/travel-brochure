import React, { useCallback } from 'react';
import { useBrochure } from '../../context/BrochureContext';
import { Building2, ImagePlus, Trash2 } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { compressImage } from '../../lib/imageUtils';

export function HotelForm() {
  const { data, updateData } = useBrochure();

  const updateHotel = (index: number, field: string, value: string) => {
    const newHotels = [...data.hotels];
    newHotels[index] = { ...newHotels[index], [field]: value };
    updateData({ hotels: newHotels });
  };

  const addHotel = () => {
    updateData({
      hotels: [...data.hotels, { name: '', description: '', phone: '', address: '', morningCall: '' }]
    });
  };

  const removeHotel = (indexToRemove: number) => {
    // 過濾掉被刪除的飯店
    const newHotels = data.hotels.filter((_, index) => index !== indexToRemove);

    // 同步更新所有行程中綁定的飯店索引 (hotelIndex)
    const newItineraries = data.itineraries.map(day => {
      let newHotelIndex = day.hotelIndex;
      if (newHotelIndex !== null) {
        if (newHotelIndex === indexToRemove) {
          newHotelIndex = null; // 原本綁定的飯店被刪除了
        } else if (newHotelIndex > indexToRemove) {
          newHotelIndex -= 1; // 索引往前補位
        }
      }
      return { ...day, hotelIndex: newHotelIndex };
    });

    updateData({
      hotels: newHotels,
      itineraries: newItineraries
    });
  };

  const handleImageUpload = useCallback(async (index: number, file: File) => {
    try {
      const compressedImage = await compressImage(file);
      updateHotel(index, 'image', compressedImage);
    } catch (error) {
      console.error('飯店圖片壓縮失敗', error);
    }
  }, [data.hotels, updateData]);

  const onDropImage = useCallback((index: number, acceptedFiles: File[]) => {
    if (acceptedFiles[0]) handleImageUpload(index, acceptedFiles[0]);
  }, [handleImageUpload]);

  // 處理從剪貼簿貼上圖片
  const handlePaste = useCallback((index: number, e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image/') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          handleImageUpload(index, file);
          e.preventDefault(); // 防止預設貼上行為
          break;
        }
      }
    }
  }, [handleImageUpload]);

  const removeImage = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    updateHotel(index, 'image', '');
  };

  // 共用的 Input 樣式
  const inputClassName = "w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all text-sm text-gray-700";
  const labelClassName = "block text-xs font-medium text-gray-700 mb-1";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-lg flex items-center gap-2" style={{ color: data.theme.primary }}>
          <Building2 size={20} />
          飯店資料
        </h3>
        <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
          共 {data.hotels.length} 間
        </span>
      </div>

      <div className="space-y-4">
        {data.hotels.map((hotel, index) => (
          <div key={index} className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow relative">
            <div className="flex justify-between items-center mb-4 border-b pb-3 border-gray-100">
              <h4 className="font-medium flex items-center gap-2" style={{ color: data.theme.primary }}>
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-50 text-blue-600 text-xs font-bold">
                  {index + 1}
                </span>
                第 {index + 1} 間飯店
              </h4>
              <div className="flex items-center gap-4">
                {index > 0 && (
                  <label className="flex items-center gap-1.5 text-sm cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={hotel.pageBreakBefore || false}
                      onChange={(e) => updateHotel(index, 'pageBreakBefore', e.target.checked as any)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4 transition-colors"
                    />
                    <span className="text-gray-600 group-hover:text-gray-900 transition-colors">在此間飯店前換頁</span>
                  </label>
                )}
                <button
                  onClick={() => removeHotel(index)}
                  className="text-red-500 hover:text-red-600 text-sm font-medium flex items-center gap-1 bg-red-50 hover:bg-red-100 px-2 py-1 rounded transition-colors"
                >
                  <Trash2 size={14} /> 刪除
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-4">

              {/* 左側：飯店圖片上傳 */}
              <div>
                <label className={labelClassName}>飯店圖片</label>
                <HotelImageUploader
                  image={hotel.image}
                  hotelName={hotel.name}
                  index={index}
                  onImageUpload={onDropImage}
                  onPaste={handlePaste}
                  onRemove={removeImage}
                />
              </div>

              {/* 右側：表單輸入 */}
              <div className="space-y-3">
                <div>
                  <label className={labelClassName}>飯店名稱</label>
                  <input
                    type="text"
                    value={hotel.name}
                    onChange={(e) => updateHotel(index, 'name', e.target.value)}
                    className={`${inputClassName} font-medium`}
                    placeholder="例如：大紅花渡假村"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClassName}>電話</label>
                    <input
                      type="tel"
                      value={hotel.phone}
                      onChange={(e) => updateHotel(index, 'phone', e.target.value)}
                      className={inputClassName}
                      placeholder="+886 2-12345678"
                    />
                  </div>
                  <div>
                    <label className={labelClassName}>Morning Call</label>
                    <input
                      type="time"
                      value={hotel.morningCall}
                      onChange={(e) => updateHotel(index, 'morningCall', e.target.value)}
                      className={inputClassName}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClassName}>地址</label>
                  <input
                    type="text"
                    value={hotel.address}
                    onChange={(e) => updateHotel(index, 'address', e.target.value)}
                    className={inputClassName}
                    placeholder="飯店詳細地址"
                  />
                </div>
                <div>
                  <label className={labelClassName}>飯店介紹</label>
                  <textarea
                    value={hotel.description || ''}
                    onChange={(e) => updateHotel(index, 'description', e.target.value)}
                    className={`${inputClassName} resize-y min-h-[60px]`}
                    placeholder="設施特色、鄰近景點..."
                  />
                </div>
              </div>

            </div>
          </div>
        ))}

        {data.hotels.length === 0 && (
          <div className="py-8 text-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
            <p className="text-sm text-gray-500 font-medium">
              目前無需安排住宿
            </p>
          </div>
        )}

        <button
          onClick={addHotel}
          className="w-full py-3 mt-4 border-2 border-dashed border-blue-200 text-blue-600 font-medium rounded-xl hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
        >
          <span>+</span> 新增飯店
        </button>
      </div>
    </div>
  );
}

function HotelImageUploader({
  image, hotelName, index, onImageUpload, onPaste, onRemove
}: {
  image?: string, hotelName: string, index: number,
  onImageUpload: (index: number, files: File[]) => void,
  onPaste: (index: number, e: React.ClipboardEvent) => void,
  onRemove: (index: number, e: React.MouseEvent) => void
}) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    onImageUpload(index, acceptedFiles);
  }, [index, onImageUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
    maxFiles: 1,
  });

  return (
    <div
      {...getRootProps()}
      onPaste={(e) => onPaste(index, e)}
      tabIndex={0}
      className={`relative border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors h-32 flex flex-col items-center justify-center overflow-hidden outline-none focus:border-blue-300 focus:bg-blue-50/30 ${isDragActive ? 'border-blue-400 bg-blue-50/50' : 'border-gray-300 hover:bg-gray-50'
        }`}
    >
      <input {...getInputProps()} />
      {image ? (
        <>
          <img src={image} alt={hotelName || "Hotel"} className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/10 transition-opacity hover:bg-black/20" />
          <button
            onClick={(e) => onRemove(index, e)}
            className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm text-red-500 rounded-full p-1.5 shadow-sm hover:bg-red-50 transition-colors"
          >
            <Trash2 size={12} />
          </button>
        </>
      ) : (
        <div className="text-gray-400 flex flex-col items-center gap-1.5">
          <ImagePlus size={20} strokeWidth={1.5} />
          <p className="text-[10px] font-medium leading-tight">點擊、拖曳或<br /><kbd className="bg-gray-100 px-1 rounded mx-0.5 border border-gray-200 mt-1 inline-block">Ctrl+V</kbd> 貼上</p>
        </div>
      )}
    </div>
  );
}
