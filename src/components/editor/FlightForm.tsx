import React, { useCallback, useMemo } from 'react';
import { useBrochure } from '../../context/BrochureContext';
import { Plane, ImagePlus, Trash2, Plus, ArrowDown, ChevronUp, ChevronDown, Map, Phone } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { FlightInfo } from '../../types';
import { compressImage } from '../../lib/imageUtils';

export function FlightForm() {
  const { data, updateData } = useBrochure();

  // 1. Data Migration: 將舊的物件格式轉為數組格式
  const flights = useMemo(() => {
    if (Array.isArray(data.flights)) {
      return data.flights;
    }
    // 如果是舊格式 { outbound, return }
    const oldFlights = data.flights as any;
    if (oldFlights.outbound || oldFlights.return) {
      return [
        { ...oldFlights.outbound, arrivalNextDay: false },
        { ...oldFlights.return, arrivalNextDay: false }
      ].filter(f => f.airline || f.flightNumber || f.departurePlace);
    }
    return [];
  }, [data.flights]);

  const updateFlights = (newFlights: FlightInfo[]) => {
    updateData({ flights: newFlights });
  };

  const updateSegment = (index: number, field: keyof FlightInfo, value: any) => {
    const newFlights = [...flights];
    newFlights[index] = { ...newFlights[index], [field]: value };
    updateFlights(newFlights);
  };

  const addSegment = () => {
    if (flights.length >= 4) return;
    const newFlights = [...flights, {
      airline: '',
      airlineLogo: '',
      flightNumber: '',
      date: '',
      departureTime: '',
      departurePlace: '',
      arrivalTime: '',
      arrivalPlace: '',
      arrivalNextDay: false,
      duration: '',
      flightDuration: '',
      type: 'outbound',
    }];
    updateFlights(newFlights);
  };

  const removeSegment = (index: number) => {
    const newFlights = flights.filter((_, i) => i !== index);
    updateFlights(newFlights);
  };

  const moveSegment = (index: number, direction: 'up' | 'down') => {
    const newFlights = [...flights];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= flights.length) return;

    [newFlights[index], newFlights[targetIndex]] = [newFlights[targetIndex], newFlights[index]];
    updateFlights(newFlights);
  };

  const handleImageUpload = async (index: number, file: File) => {
    try {
      const compressedImage = await compressImage(file);
      updateSegment(index, 'airlineLogo', compressedImage);
    } catch (error) {
      console.error('飛機 logo 壓縮失敗', error);
    }
  };
  const handleMapUpload = async (file: File) => {
    try {
      const compressedImage = await compressImage(file);
      updateData({ meetingMap: compressedImage });
    } catch (error) {
      console.error('地圖圖片壓縮失敗', error);
    }
  };

  const { getRootProps: getMapProps, getInputProps: getMapInputProps, isDragActive: isMapDragActive } = useDropzone({
    onDrop: (files) => files[0] && handleMapUpload(files[0]),
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
    maxFiles: 1,
  });
  const inputClassName = "w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all text-sm text-gray-700";
  const labelClassName = "block text-xs font-medium text-gray-700 mb-1.5";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-lg flex items-center gap-2" style={{ color: data.theme.primary }}>
          <Plane size={20} />
          航班航段管理
        </h3>
        <button
          onClick={addSegment}
          disabled={flights.length >= 4}
          className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Plus size={16} />
          新增航段
        </button>
      </div>

      <div className="space-y-6">
        {flights.map((flight, index) => (
          <SegmentEditor
            key={index}
            index={index}
            flight={flight}
            total={flights.length}
            updateSegment={updateSegment}
            removeSegment={removeSegment}
            moveSegment={moveSegment}
            handleImageUpload={handleImageUpload}
            inputClassName={inputClassName}
            labelClassName={labelClassName}
            themeColor={data.theme.primary}
          />
        ))}

        {flights.length === 0 && (
          <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
            <Plane size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">尚無航班資訊，請點擊「新增航段」</p>
          </div>
        )}
      </div>

      {/* 集合與緊急聯絡資訊 */}
      <div className="mt-10 pt-8 border-t border-gray-200">
        <h3 className="font-semibold text-lg flex items-center gap-2 mb-4" style={{ color: data.theme.primary }}>
          <Map size={20} />
          集合地點地圖 & 緊急聯絡人
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-gray-50/50 border border-gray-200 rounded-2xl">
          <div className="space-y-4">
            <label className={labelClassName}>機場集合地點地圖</label>
            <div
              {...getMapProps()}
              onPaste={(e) => {
                const items = e.clipboardData.items;
                for (let i = 0; i < items.length; i++) {
                  if (items[i].type.startsWith('image/')) {
                    const file = items[i].getAsFile();
                    if (file) { handleMapUpload(file); e.preventDefault(); break; }
                  }
                }
              }}
              className={`relative border-2 border-dashed rounded-xl text-center cursor-pointer transition-all h-64 flex flex-col items-center justify-center overflow-hidden outline-none ${isMapDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-blue-300 hover:bg-white'}`}
            >
              <input {...getMapInputProps()} />
              {data.meetingMap ? (
                <>
                  <img src={data.meetingMap} alt="Meeting Map" className="absolute inset-0 w-full h-full object-contain p-2 bg-white" />
                  <button
                    onClick={(e) => { e.stopPropagation(); updateData({ meetingMap: '' }); }}
                    className="absolute top-2 right-2 bg-white/90 text-red-500 rounded-full p-2 shadow-sm hover:bg-red-50 z-10"
                  >
                    <Trash2 size={16} />
                  </button>
                </>
              ) : (
                <div className="text-gray-400 flex flex-col items-center gap-2">
                  <ImagePlus size={32} />
                  <p className="text-sm font-medium">點擊或拖放上傳機場地圖</p>
                  <p className="text-xs">支持 JPG, PNG, WebP</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClassName}>旅行社名稱</label>
                <input
                  type="text"
                  value={data.agencyName || ''}
                  onChange={(e) => updateData({ agencyName: e.target.value })}
                  className={inputClassName}
                  placeholder="例如：安天旅行社"
                />
              </div>
              <div>
                <label className={labelClassName}>聯絡人姓名</label>
                <input
                  type="text"
                  value={data.emergencyContactName || ''}
                  onChange={(e) => updateData({ emergencyContactName: e.target.value })}
                  className={inputClassName}
                  placeholder="例如：林經理"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClassName}>公司市話</label>
                <input
                  type="text"
                  value={data.agencyPhone || ''}
                  onChange={(e) => updateData({ agencyPhone: e.target.value })}
                  className={inputClassName}
                  placeholder="02-1234-5678"
                />
              </div>
              <div>
                <label className={labelClassName}>緊急手機</label>
                <input
                  type="text"
                  value={data.agencyMobile || ''}
                  onChange={(e) => updateData({ agencyMobile: e.target.value })}
                  className={inputClassName}
                  placeholder="0912-345-678"
                />
              </div>
            </div>
            <div className="mt-4 p-4 bg-blue-50/50 rounded-xl">
              <p className="text-xs text-blue-600 leading-relaxed italic">
                提示：集合地圖與聯絡資訊將會顯示在航班資訊頁面的下方供旅客參考。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface SegmentEditorProps {
  index: number;
  flight: FlightInfo;
  total: number;
  updateSegment: (index: number, field: keyof FlightInfo, value: any) => void;
  removeSegment: (index: number) => void;
  moveSegment: (index: number, direction: 'up' | 'down') => void;
  handleImageUpload: (index: number, file: File) => void;
  inputClassName: string;
  labelClassName: string;
  themeColor: string;
}

function SegmentEditor({
  index,
  flight,
  total,
  updateSegment,
  removeSegment,
  moveSegment,
  handleImageUpload,
  inputClassName,
  labelClassName,
  themeColor
}: SegmentEditorProps) {

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles[0]) handleImageUpload(index, acceptedFiles[0]);
  }, [handleImageUpload, index]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
    maxFiles: 1,
  });

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image/') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          handleImageUpload(index, file);
          e.preventDefault();
          break;
        }
      }
    }
  };

  return (
    <div className="p-5 bg-white border border-gray-200 rounded-2xl shadow-sm relative group">
      {/* 標題與操作選單 */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-blue-600 font-bold text-sm">
            {index + 1}
          </span>
          <select
            value={flight.type || 'outbound'}
            onChange={(e) => updateSegment(index, 'type', e.target.value)}
            className="bg-transparent font-bold text-gray-800 outline-none cursor-pointer border-b border-transparent hover:border-gray-300 transition-colors py-0.5"
            style={{ appearance: 'none' }}
          >
            <option value="outbound">去程航段</option>
            <option value="middle">中轉伺候 / 國內線</option>
            <option value="return">回程航段</option>
          </select>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => moveSegment(index, 'up')}
            disabled={index === 0}
            className="p-1.5 text-gray-400 hover:text-blue-600 disabled:opacity-30"
            title="上移"
          >
            <ChevronUp size={18} />
          </button>
          <button
            onClick={() => moveSegment(index, 'down')}
            disabled={index === total - 1}
            className="p-1.5 text-gray-400 hover:text-blue-600 disabled:opacity-30"
            title="下移"
          >
            <ChevronDown size={18} />
          </button>
          <button
            onClick={() => removeSegment(index)}
            className="p-1.5 text-red-400 hover:text-red-600 ml-2"
            title="刪除航段"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-[110px_1fr] gap-6">
        {/* Logo 上傳 */}
        <div className="space-y-2">
          <label className={labelClassName}>航空 Logo</label>
          <div
            {...getRootProps()}
            onPaste={handlePaste}
            className={`relative border-2 border-dashed rounded-xl text-center cursor-pointer transition-all h-28 flex flex-col items-center justify-center overflow-hidden outline-none ${isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'}`}
          >
            <input {...getInputProps()} />
            {flight.airlineLogo ? (
              <>
                <img src={flight.airlineLogo} alt="Logo" className="absolute inset-0 w-full h-full object-contain p-2 bg-white" />
                <button
                  onClick={(e) => { e.stopPropagation(); updateSegment(index, 'airlineLogo', ''); }}
                  className="absolute top-1 right-1 bg-white/90 text-red-500 rounded-full p-1.5 shadow-sm hover:bg-red-50 z-10"
                >
                  <Trash2 size={12} />
                </button>
              </>
            ) : (
              <div className="text-gray-400 flex flex-col items-center gap-1.5">
                <ImagePlus size={20} />
                <p className="text-[10px] leading-tight font-medium">貼上圖檔</p>
              </div>
            )}
          </div>
        </div>

        {/* 航班詳細內容 */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className={labelClassName}>日期</label>
              <input
                type="date"
                value={flight.date || ''}
                onChange={(e) => updateSegment(index, 'date', e.target.value)}
                className={inputClassName}
              />
            </div>
            <div>
              <label className={labelClassName}>航空公司</label>
              <input
                type="text"
                value={flight.airline}
                onChange={(e) => updateSegment(index, 'airline', e.target.value)}
                className={inputClassName}
                placeholder="例如：長榮航空"
              />
            </div>
            <div>
              <label className={labelClassName}>班機號碼</label>
              <input
                type="text"
                value={flight.flightNumber}
                onChange={(e) => updateSegment(index, 'flightNumber', e.target.value)}
                className={`${inputClassName} font-bold tracking-wider uppercase`}
                placeholder="BR123"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-4 pt-2 border-t border-gray-100">
            {/* 起飛端 */}
            <div className="space-y-3">
              <div>
                <label className={labelClassName}>起飛地點</label>
                <input
                  type="text"
                  value={flight.departurePlace}
                  onChange={(e) => updateSegment(index, 'departurePlace', e.target.value)}
                  className={inputClassName}
                  placeholder="例如：桃園 T2"
                />
              </div>
              <div>
                <label className={labelClassName}>起飛時間</label>
                <input
                  type="time"
                  value={flight.departureTime}
                  onChange={(e) => updateSegment(index, 'departureTime', e.target.value)}
                  className={inputClassName}
                />
              </div>
            </div>

            {/* 抵達端 */}
            <div className="space-y-3">
              <div>
                <label className={labelClassName}>抵達地點</label>
                <input
                  type="text"
                  value={flight.arrivalPlace}
                  onChange={(e) => updateSegment(index, 'arrivalPlace', e.target.value)}
                  className={inputClassName}
                  placeholder="例如：成田 T1"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className={labelClassName}>抵達時間</label>
                  <label className="flex items-center gap-1.5 cursor-pointer group/cb">
                    <input
                      type="checkbox"
                      checked={flight.arrivalNextDay || false}
                      onChange={(e) => updateSegment(index, 'arrivalNextDay', e.target.checked)}
                      className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-[10px] font-bold text-orange-600">+1 天抵達</span>
                  </label>
                </div>
                <input
                  type="time"
                  value={flight.arrivalTime}
                  onChange={(e) => updateSegment(index, 'arrivalTime', e.target.value)}
                  className={inputClassName}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <label className={labelClassName}>總飛行時間 (Flight Duration)</label>
              <input
                type="text"
                value={flight.flightDuration || ''}
                onChange={(e) => updateSegment(index, 'flightDuration', e.target.value)}
                className={inputClassName}
                placeholder="例如：12h 30m"
              />
            </div>
            <div>
              <label className={labelClassName}>備註 (可選填)</label>
              <input
                type="text"
                value={flight.duration || ''}
                onChange={(e) => updateSegment(index, 'duration', e.target.value)}
                className={inputClassName}
                placeholder="例如：空中直飛"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
