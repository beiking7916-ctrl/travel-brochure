import React, { useCallback } from 'react';
import { useBrochure } from '../../context/BrochureContext';
import { useDropzone } from 'react-dropzone';
import { MapPin, Trash2, Upload } from 'lucide-react';
import { compressImage } from '../../lib/imageUtils';

export function ItineraryForm() {
  const { data, updateData } = useBrochure();

  const updateItinerary = (index: number, field: string, value: any) => {
    const newItineraries = [...data.itineraries];
    newItineraries[index] = { ...newItineraries[index], [field]: value };
    updateData({ itineraries: newItineraries });
  };

  const addItinerary = () => {
    updateData({
      itineraries: [
        ...data.itineraries,
        {
          title: `第 ${data.itineraries.length + 1} 天`,
          description: '',
          attractions: '',
          meals: {
            breakfast: false, breakfastText: '',
            lunch: false, lunchText: '',
            dinner: false, dinnerText: '',
          },
          hotelIndex: null,
          images: [],
        }
      ]
    });
  };

  const removeItinerary = (indexToRemove: number) => {
    updateData({
      itineraries: data.itineraries.filter((_, index) => index !== indexToRemove)
    });
  };

  const toggleMeal = (index: number, meal: 'breakfast' | 'lunch' | 'dinner') => {
    const newItineraries = [...data.itineraries];
    newItineraries[index].meals = {
      ...newItineraries[index].meals,
      [meal]: !newItineraries[index].meals[meal],
    };
    updateData({ itineraries: newItineraries });
  };

  const updateMealText = (index: number, meal: 'breakfast' | 'lunch' | 'dinner', text: string) => {
    const newItineraries = [...data.itineraries];
    newItineraries[index].meals = {
      ...newItineraries[index].meals,
      [`${meal}Text`]: text,
    };
    updateData({ itineraries: newItineraries });
  };

  const handleImagesUpload = useCallback(async (index: number, files: File[]) => {
    const spaceLeft = 3 - data.itineraries[index].images.length;
    const filesToProcess = files.slice(0, spaceLeft);
    if (filesToProcess.length === 0) return;

    try {
      const compressedImages = await Promise.all(filesToProcess.map(file => compressImage(file)));
      const newItineraries = [...data.itineraries];
      newItineraries[index].images = [
        ...newItineraries[index].images,
        ...compressedImages
      ].slice(0, 3);
      updateData({ itineraries: newItineraries });
    } catch (error) {
      console.error('行程圖片壓縮失敗', error);
    }
  }, [data.itineraries, updateData]);

  const onDrop = useCallback((index: number, acceptedFiles: File[]) => {
    handleImagesUpload(index, acceptedFiles);
  }, [handleImagesUpload]);

  // 處理從剪貼簿貼上圖片
  const handlePaste = useCallback((index: number, e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    const imageFiles: File[] = [];

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image/') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          imageFiles.push(file);
        }
      }
    }

    if (imageFiles.length > 0) {
      handleImagesUpload(index, imageFiles);
      e.preventDefault(); // 防止預設貼上行為
    }
  }, [handleImagesUpload]);

  const removeImage = (itineraryIndex: number, imageIndex: number) => {
    const newItineraries = [...data.itineraries];
    newItineraries[itineraryIndex].images = newItineraries[itineraryIndex].images.filter(
      (_, i) => i !== imageIndex
    );
    updateData({ itineraries: newItineraries });
  };

  const inputClassName = "w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all text-sm text-gray-700";
  const labelClassName = "block text-xs font-medium text-gray-700 mb-1.5";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-lg flex items-center gap-2" style={{ color: data.theme.primary }}>
          <MapPin size={20} />
          行程介紹
        </h3>
        <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
          共 {data.itineraries.length} 天行程
        </span>
      </div>

      <div className="space-y-5">
        {data.itineraries.map((day, index) => (
          <div key={index} className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow relative">
            <div className="flex items-center justify-between mb-4 border-b pb-3 border-gray-100">
              <h4 className="font-medium flex items-center gap-2" style={{ color: data.theme.primary }}>
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-50 text-blue-600 text-xs font-bold">
                  {index + 1}
                </span>
                Day {index + 1}
              </h4>
              <div className="flex items-center gap-4">
                {index > 0 && (
                  <label className="flex items-center gap-1.5 text-sm cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={day.pageBreakBefore || false}
                      onChange={(e) => updateItinerary(index, 'pageBreakBefore', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4 transition-colors"
                    />
                    <span className="text-gray-600 group-hover:text-gray-900 transition-colors relative">在此日行程前換頁</span>
                  </label>
                )}
                <button
                  onClick={() => removeItinerary(index)}
                  className="text-red-500 hover:text-red-600 text-sm font-medium flex items-center gap-1 bg-red-50 hover:bg-red-100 px-2 py-1 rounded transition-colors"
                >
                  <Trash2 size={14} /> 刪除
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className={labelClassName}>當日行程標題</label>
                <input
                  type="text"
                  value={day.title}
                  onChange={(e) => updateItinerary(index, 'title', e.target.value)}
                  className={`${inputClassName} font-medium`}
                  placeholder={`第 ${index + 1} 天`}
                />
              </div>

              <div>
                <label className={labelClassName}>行程詳細描述</label>
                <textarea
                  value={day.description}
                  onChange={(e) => updateItinerary(index, 'description', e.target.value)}
                  className={`${inputClassName} resize-y bg-gray-50/50 min-h-[60px]`}
                  placeholder="描述今天的行程內容、特點..."
                />
              </div>

              <div>
                <label className={labelClassName}>景點介紹</label>
                <textarea
                  value={day.attractions || ''}
                  onChange={(e) => updateItinerary(index, 'attractions', e.target.value)}
                  className={`${inputClassName} resize-y bg-gray-50/50 min-h-[80px]`}
                  placeholder="景點一：深入介紹...&#13;&#10;景點二：歷史背景..."
                />
              </div>

              {/* 餐食與住宿區塊 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 bg-gray-50/50 rounded-lg border border-gray-100">
                {/* Meals */}
                <div>
                  <label className={labelClassName}>餐食安排</label>
                  <div className="flex flex-col gap-2 mt-2">
                    {(['breakfast', 'lunch', 'dinner'] as const).map(mealId => {
                      const labels = { breakfast: '早餐', lunch: '午餐', dinner: '晚餐' };
                      const isChecked = day.meals[mealId];
                      const textKey = `${mealId}Text` as keyof typeof day.meals;
                      return (
                        <div key={mealId} className="flex items-center gap-2">
                          <label className="flex items-center gap-1.5 text-sm cursor-pointer group whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleMeal(index, mealId)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4 transition-colors"
                            />
                            <span className="text-gray-700 group-hover:text-gray-900 transition-colors w-10">
                              {labels[mealId]}
                            </span>
                          </label>
                          {isChecked && (
                            <input
                              type="text"
                              value={String(day.meals[textKey] || '')}
                              onChange={(e) => updateMealText(index, mealId, e.target.value)}
                              className="flex-1 px-2 py-1 text-xs border border-gray-200 rounded focus:border-blue-300 outline-none w-full"
                              placeholder={`如：飯店內用、自理、機上套餐...`}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Hotel Selection */}
                <div>
                  <label className={labelClassName}>安排住宿</label>
                  <select
                    value={day.hotelIndex === null ? '' : day.hotelIndex}
                    onChange={(e) => updateItinerary(
                      index,
                      'hotelIndex',
                      e.target.value === '' ? null : parseInt(e.target.value)
                    )}
                    className={inputClassName}
                  >
                    <option value="">無 (或不住宿)</option>
                    {data.hotels.map((hotel, hIndex) => (
                      <option key={hIndex} value={hIndex}>
                        {hotel.name || `第 ${hIndex + 2} 天飯店 (未命名)`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Images */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <label className={labelClassName}>景點圖片 (最多 3 張)</label>
                  <span className="text-[10px] text-gray-500 font-medium">
                    已上傳 {day.images.length}/3
                  </span>
                </div>

                {day.images.length > 0 && (
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    {day.images.map((img, imgIndex) => (
                      <div key={imgIndex} className="relative group rounded-lg overflow-hidden border border-gray-100 shadow-sm aspect-video">
                        <img
                          src={img}
                          alt={`Day ${index + 1} image ${imgIndex + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <button
                          onClick={() => removeImage(index, imgIndex)}
                          className="absolute top-1.5 right-1.5 bg-white/90 backdrop-blur-sm text-red-500 rounded-full p-1 shadow-sm opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {day.images.length < 3 && (
                  <ItineraryImageUploader
                    imageCount={day.images.length}
                    index={index}
                    onImageUpload={onDrop}
                    onPaste={handlePaste}
                  />
                )}
              </div>
            </div>
          </div>
        ))}

        <button
          onClick={addItinerary}
          className="w-full py-3 mt-4 border-2 border-dashed border-blue-200 text-blue-600 font-medium rounded-xl hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
        >
          <span>+</span> 新增一天行程
        </button>
      </div>
    </div>
  );
}

function ItineraryImageUploader({
  imageCount, index, onImageUpload, onPaste
}: {
  imageCount: number, index: number,
  onImageUpload: (index: number, files: File[]) => void,
  onPaste: (index: number, e: React.ClipboardEvent) => void
}) {
  const onDropLocal = useCallback((acceptedFiles: File[]) => {
    onImageUpload(index, acceptedFiles);
  }, [index, onImageUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: onDropLocal,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'] },
    maxFiles: 3 - imageCount,
  });

  return (
    <div
      {...getRootProps()}
      onPaste={(e) => onPaste(index, e)}
      tabIndex={0}
      className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors outline-none focus:border-blue-300 focus:bg-blue-50/30 ${isDragActive ? 'border-blue-400 bg-blue-50/50' : 'border-gray-300 hover:bg-gray-50'
        }`}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center gap-1.5 text-gray-400">
        <Upload size={18} strokeWidth={1.5} />
        <p className="text-xs font-medium text-gray-500">
          {isDragActive ? '放開以上傳' : <span>點擊、拖曳或 <kbd className="bg-gray-100 px-1 rounded text-[10px] mx-0.5 border border-gray-200">Ctrl+V</kbd> 貼上圖片</span>}
        </p>
      </div>
    </div>
  );
}
