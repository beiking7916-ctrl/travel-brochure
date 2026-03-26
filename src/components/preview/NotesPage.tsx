import React from 'react';
import { PageWrapper } from './PageWrapper';

import { useBrochure } from '../../context/BrochureContext';

interface NotesPageProps {
    totalNotes?: number;
}

export function NotesPage({ totalNotes }: NotesPageProps) {
    const { data } = useBrochure();

    // 建立 22 條橫線作為筆記區
    const lines = Array.from({ length: 22 }, (_, i) => i);

    return (
        <PageWrapper
            title=""
            sectionId="notes"
        >
            <div className="flex flex-col flex-1 mt-2 min-h-0">
                <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col min-h-0">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="w-1.5 h-5 rounded-full" style={{ backgroundColor: data.theme.primary }} />
                        <h2 className="text-lg font-bold text-gray-800 tracking-wider">Memo / Notes</h2>
                    </div>

                    <div className="flex-1 overflow-hidden">
                        <div className="flex flex-col">
                            {Array.from({ length: 18 }, (_, i) => i).map((line) => (
                                <div
                                    key={line}
                                    className="w-full border-b border-gray-100 border-dashed h-8"
                                />
                            ))}
                        </div>
                    </div>

                    <div className="mt-6 dynamic-text font-bold text-gray-300 uppercase tracking-[0.4em] text-center text-xs">
                        Capture your memories here
                    </div>
                </div>
            </div>
        </PageWrapper>
    );
}
