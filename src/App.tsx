import React, { useEffect, useState } from 'react';
import { BrochureProvider, useBrochure } from './context/BrochureContext';
import { EditorPanel } from './components/editor/EditorPanel';
import { PreviewPanel } from './components/preview/PreviewPanel';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { Login } from './components/Login';
import { Management } from './components/Management';
import { EBookView } from './components/preview/EBookView';
import { auth } from './lib/auth';
import { supabase } from './lib/supabase';
import { storage } from './lib/storage';
import type { BrochureData, User } from './types';

function InnerApp({ currentId, currentUser, onBackToDashboard }: { currentId: string, currentUser: User | null, onBackToDashboard: () => void }) {
  const { data } = useBrochure();
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [lastSaved, setLastSaved] = useState<Date>(new Date());
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const isFirstMount = React.useRef(true);

  // 20秒防抖自動儲存
  useEffect(() => {
    // 初始掛載時不觸發儲存
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }

    setSaveStatus('unsaved');
    const timer = setTimeout(async () => {
      setSaveStatus('saving');
      const result = await storage.saveBrochure(currentId, data);
      
      if (result.success) {
        setLastSaved(new Date());
        setSaveStatus('saved');
      } else {
        // 同步失敗時回到待儲存狀態，以便使用者再次手動觸發或重試
        console.error('自動儲存同步失敗:', result.error);
        setSaveStatus('unsaved');
      }
    }, 20000);

    return () => clearTimeout(timer);
  }, [data, currentId]);

  // 實時在線 Presence 監聽
  useEffect(() => {
    if (!supabase || !currentId || !currentUser) return;

    const channel = supabase.channel(`brochure_${currentId}`, {
      config: {
        presence: {
          key: currentUser.name || currentUser.employee_id,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        // 取得目前在線的其他使用者名稱清單
        const users = Object.keys(state);
        setOnlineUsers(users);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }, [currentId, currentUser]);

  return (
    <div className="h-screen flex flex-col">
      <Header
        currentId={currentId}
        onBackToDashboard={onBackToDashboard}
        saveStatus={saveStatus}
        onlineUsers={onlineUsers}
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
  const [view, setView] = useState<'login' | 'dashboard' | 'editor' | 'management' | 'ebook'>('login');
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialData, setInitialData] = useState<BrochureData | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    async function loadData() {
      // 1. 檢查登入狀態
      const user = await auth.getCurrentUser();
      setCurrentUser(user);
      
      // 2. 處理網址參數
      const urlParams = new URLSearchParams(window.location.search);
      const urlId = urlParams.get('id');
      const mode = urlParams.get('mode');

      // 電子書模式特殊處理 (不強制導向登入，但會檢查發佈狀態)
      if (mode === 'ebook' && urlId) {
        let cloudData = await storage.getBrochure(urlId);
        
        // 如果找不到 id，嘗試搜尋 shortId
        if (!cloudData && supabase) {
            const { data: found } = await supabase
                .from('brochures')
                .select('data')
                .eq('data->>shortId', urlId)
                .single();
            if (found) cloudData = found.data as BrochureData;
        }

        if (cloudData) {
            // 檢查是否已過期 (下架)
            const isExpired = cloudData.expiresAt && new Date(cloudData.expiresAt).getTime() < new Date().setHours(0,0,0,0);
            
            if ((cloudData.isPublished && !isExpired) || currentUser) { // 已發佈且未過期，或已登入管理者皆可看
              setInitialData(cloudData);
              setCurrentId(urlId); // 這裡雖然是 shortId 但 context 會用 initialData
              setView('ebook');
              setLoading(false);
              return;
            } else {
              alert(isExpired ? '此手冊已過期下架。' : '此手冊尚未發佈，無法線上閱讀。');
            }
        }
      }

      // 如果未登入，強制導向登入頁面
      if (!user) {
         setView('login');
         setLoading(false);
         return;
      }
      
      // 如果已登入，且有 urlId，則載入該手冊進入 editor
      if (urlId && mode !== 'ebook') {
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

    // 監聽登入狀態變更 (處理登出或 Session 失效)
    const { data: { subscription } } = supabase?.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setView('login');
        setCurrentId(null);
        setInitialData(null);
      }
    }) || { data: { subscription: null } };

    return () => {
      subscription?.unsubscribe();
    }
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
      onGoToManagement={() => setView('management')}
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

  if (view === 'management') {
    return <Management 
      onBack={() => setView('dashboard')}
      onEdit={async (id) => {
        setLoading(true);
        const loadedData = await storage.getBrochure(id);
        setLoading(false);
        if (loadedData) {
           setInitialData(loadedData);
           setCurrentId(id);
           setView('editor');
        }
      }}
    />
  }

  if (view === 'ebook') {
    return (
      <BrochureProvider initialData={initialData}>
        <EBookView />
      </BrochureProvider>
    );
  }

  return (
    <BrochureProvider initialData={initialData} key={currentId}>
      <InnerApp
        currentId={currentId!}
        currentUser={currentUser}
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
