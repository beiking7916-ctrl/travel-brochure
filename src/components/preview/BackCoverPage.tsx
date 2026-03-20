import React from 'react';
import { useBrochure } from '../../context/BrochureContext';
import { PageWrapper } from './PageWrapper';
import { Phone, Mail, Globe, MapPin } from 'lucide-react';

export function BackCoverPage() {
  const { data } = useBrochure();

  return (
    <PageWrapper hideHeaderFooter={true} className="back-cover-page">
      <div className="absolute inset-0 flex flex-col items-center justify-center p-16">
        {/* 頂部裝飾條 */}
        <div
          className="absolute top-0 left-0 right-0 h-4"
          style={{ backgroundColor: data.theme.primary }}
        />

        {/* 旅行社資訊區塊 */}
        <div className="flex flex-col items-center gap-8 w-full max-w-sm">
          {data.logo && (
            <div className="max-w-[200px] mb-4">
              <img src={data.logo} alt="Logo" className="w-full h-auto object-contain max-h-24" />
            </div>
          )}
          
          <div className="flex flex-col items-center gap-2 text-center">
            <h2 className="text-xl font-black tracking-widest mb-4" style={{ color: data.theme.primary }}>
              {data.agency || '旅行社名稱'}
            </h2>
            
            <div className="space-y-3 text-sm font-medium" style={{ color: `${data.theme.primary}CC` }}>
              {data.agencyPhone && (
                <div className="flex items-center gap-2 justify-center">
                  <Phone size={14} />
                  <span>{data.agencyPhone}</span>
                </div>
              )}
              {data.emergencyPhone && (
                <div className="flex items-center gap-2 justify-center">
                  <Phone size={14} className="text-red-500" />
                  <span className="text-red-600 font-bold">緊急聯絡：{data.emergencyPhone}</span>
                </div>
              )}
              {/* 這裡可以放一些固定的裝飾文字 */}
              <p className="mt-8 text-xs opacity-60 flex flex-col gap-1">
                <span>感謝您的參與，祝您旅途愉快</span>
                <span>Have a Wonderful Trip!</span>
              </p>
            </div>
          </div>
        </div>

        {/* 底部裝飾條 */}
        <div
          className="absolute bottom-0 left-0 right-0 h-4"
          style={{ backgroundColor: data.theme.primary }}
        />
      </div>
    </PageWrapper>
  );
}
