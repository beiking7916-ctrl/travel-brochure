import React, { useEffect, useState } from 'react';
import { BrochureProvider, useBrochure } from './context/BrochureContext';
import { EditorPanel } from './components/editor/EditorPanel';
import { PreviewPanel } from './components/preview/PreviewPanel';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { Login } from './components/Login';
import { auth } from './lib/auth';
import { supabase } from './lib/supabase';
import { storage } from './lib/storage';
import type { BrochureData } from './types';

function InnerApp({ currentId, onBackToDashboard }: { currentId: string, onBackToDashboard: () => void }) {
  const { data } = useBrochure();
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [lastSaved, setLastSaved] = useState<Date>(new Date());

  // 20秒防抖自動儲存
  useEffect(() => {
    setSaveStatus('unsaved');
    const timer = setTimeout(() => {
      setSaveStatus('saving');
      storage.saveBrochure(currentId, data);
      setLastSaved(new Date());
      setSaveStatus('saved');
    }, 20000);

    return () => clearTimeout(timer);
  }, [data, currentId]);

  return (
    <div className="h-screen flex flex-col">
      <Header
        currentId={currentId}
        onBackToDashboard={onBackToDashboard}
        saveStatus={saveStatus}
      />

      <div className="flex-1 flex overflow-hidden">
        <div className="w-2/5 no-print border-r">
          <EditorPanel />
        </div>
        <div className="w-3/5">
          <PreviewPanel />
        </div>
      </div>
    </div>
  );
}

function App() {
  const [view, setView] = useState<'login' | 'dashboard' | 'editor'>('login');
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialData, setInitialData] = useState<BrochureData | null>(null);

  useEffect(() => {
    async function loadData() {
      // 1. 檢查登入狀態 (非同步從 Supabase 取得 session)
      const currentUser = await auth.getCurrentUser();
      
      // 2. 處理網址參數
      const urlParams = new URLSearchParams(window.location.search);
      const urlId = urlParams.get('id');

      // 如果未登入，強制導向登入頁面
      if (!currentUser) {
         setView('login');
         setLoading(false);
         return;
      }
      
      // 如果已登入，且有 urlId，則載入該手冊進入 editor
      if (urlId) {
        const cloudData = await storage.getBrochure(urlId);
        if (cloudData) {
          if (cloudData.isDeleted) {
            alert('此手冊已被作廢，無法編輯。');
            setView('dashboard');
          } else {
            setInitialData(cloudData);
            setCurrentId(urlId);
            setView('editor');
          }
          setLoading(false);
          return;
        }
      }
      
      // 已登入但沒有 urlId，進入 dashboard
      setView('dashboard');
      setLoading(false);
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-gray-50 text-gray-500">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mb-4" />
        <p className="font-medium tracking-wider">載入手冊資料中...</p>
      </div>
    );
  }

  if (view === 'login') {
    return <Login onLoginSuccess={() => {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('id')) {
         // 若登入前有夾帶 id，登入後重新整理讓他走 loadData 邏輯
         window.location.reload();
      } else {
         setView('dashboard');
      }
    }} />;
  }

  if (view === 'dashboard') {
    return <Dashboard 
      onLogout={async () => {
        await auth.logout();
        setView('login');
      }}
      onSelectBrochure={async (id) => {
      setLoading(true);
      const loadedData = await storage.getBrochure(id);

      setLoading(false);

      if (loadedData) {
        setInitialData(loadedData);
        setCurrentId(id);
        setView('editor');
        // 清除網址的 ?id 除非想要保持雲端連結（點擊雲端儲存時才會再次設定）
        window.history.pushState({}, '', window.location.pathname);
      } else {
        alert('無法載入此手冊的詳細資料，可能尚未同步且本機無快取。');
      }
    }} />
  }

  return (
    <BrochureProvider initialData={initialData} key={currentId}>
      <InnerApp
        currentId={currentId!}
        onBackToDashboard={() => {
          setView('dashboard');
          setCurrentId(null);
          setInitialData(null);
          window.history.pushState({}, '', window.location.pathname);
        }}
      />
    </BrochureProvider>
  );
}

export default App;
