import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { auth, AdminUser } from '../lib/auth';
import { Users, UserPlus, Trash2, Key, ArrowLeft, Shield } from 'lucide-react';
import bcrypt from 'bcryptjs';

interface AdminUsersProps {
    onBack: () => void;
}

export function AdminUsers({ onBack }: AdminUsersProps) {
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);

    // 新增/編輯表單狀態
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({ id: '', username: '', password: '' });
    const [formLoading, setFormLoading] = useState(false);
    const [formError, setFormError] = useState('');

    useEffect(() => {
        setCurrentUser(auth.getCurrentUser());
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        if (!supabase) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('admin_users')
                .select('id, username, role, created_at')
                .order('created_at', { ascending: true });
            
            if (error) throw error;
            setUsers(data || []);
        } catch (err) {
            console.error('Failed to fetch users', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string, username: string) => {
        if (currentUser?.id === id) {
            alert('您不能刪除自己目前的帳號！');
            return;
        }

        if (window.confirm(`確定要刪除管理員「${username}」嗎？此動作無法復原。`)) {
            if (!supabase) return;
            try {
                const { error } = await supabase.from('admin_users').delete().eq('id', id);
                if (error) throw error;
                fetchUsers();
            } catch (err) {
                console.error('Failed to delete user', err);
                alert('刪除失敗');
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');
        setFormLoading(true);

        if (!supabase) return;

        try {
            // Hash the password
            const salt = await bcrypt.genSalt(10);
            const password_hash = await bcrypt.hash(formData.password, salt);

            if (formData.id) {
                // 編輯密碼
                const { error } = await supabase
                    .from('admin_users')
                    .update({ password_hash })
                    .eq('id', formData.id);
                
                if (error) throw error;
            } else {
                // 新增帳號
                const { error } = await supabase
                    .from('admin_users')
                    .insert([{ username: formData.username, password_hash, role: 'admin' }]);
                
                if (error) {
                    if (error.code === '23505') { // unique violation
                        throw new Error('該帳號已存在');
                    }
                    throw error;
                }
            }

            setShowForm(false);
            setFormData({ id: '', username: '', password: '' });
            fetchUsers();
        } catch (err: any) {
            console.error('Save failed', err);
            setFormError(err.message || '儲存失敗，請重試');
        } finally {
            setFormLoading(false);
        }
    };

    const openCreateForm = () => {
        setFormData({ id: '', username: '', password: '' });
        setShowForm(true);
        setFormError('');
    };

    const openEditForm = (user: AdminUser) => {
        setFormData({ id: user.id, username: user.username, password: '' });
        setShowForm(true);
        setFormError('');
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('zh-TW', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="h-16 flex items-center justify-between px-8 bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-xl font-bold flex items-center gap-2 text-gray-800">
                        <Shield size={24} className="text-purple-600" />
                        系統人員管理
                    </h1>
                </div>
                {!showForm && (
                   <button
                       onClick={openCreateForm}
                       className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                   >
                       <UserPlus size={18} />
                       新增管理員
                   </button>
                )}
            </header>

            <main className="flex-1 p-8 overflow-y-auto">
                <div className="max-w-4xl mx-auto">
                    {showForm ? (
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-8 mt-4">
                            <h2 className="text-lg font-bold text-gray-800 mb-6 border-b pb-4">
                                {formData.id ? '重設密碼' : '新增系統管理員'}
                            </h2>
                            <form onSubmit={handleSubmit} className="space-y-6 max-w-md">
                                {formError && (
                                    <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100">
                                        {formError}
                                    </div>
                                )}
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">管理員帳號</label>
                                    <input
                                        type="text"
                                        required
                                        disabled={!!formData.id}
                                        value={formData.username}
                                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                                        placeholder="例如: admin01"
                                    />
                                    {formData.id && <p className="text-xs text-gray-500 mt-1">帳號不可修改，僅供重設密碼</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        {formData.id ? '新密碼' : '登入密碼'}
                                    </label>
                                    <input
                                        type="password"
                                        required
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
                                        placeholder="回系統所需密碼，至少6碼"
                                        minLength={6}
                                    />
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowForm(false)}
                                        className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                                    >
                                        取消
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={formLoading}
                                        className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-70"
                                    >
                                        {formLoading ? '儲存中...' : '確認儲存'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mt-4">
                            {loading ? (
                                <div className="p-12 text-center text-gray-500">載入人員名單中...</div>
                            ) : users.length === 0 ? (
                                <div className="p-12 text-center text-gray-500">
                                    <Users size={48} className="mx-auto text-gray-300 mb-4" />
                                    沒有找到任何管理員資料
                                </div>
                            ) : (
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50 border-b border-gray-200">
                                            <th className="px-6 py-4 font-semibold text-sm text-gray-600">帳號名稱</th>
                                            <th className="px-6 py-4 font-semibold text-sm text-gray-600">角色權限</th>
                                            <th className="px-6 py-4 font-semibold text-sm text-gray-600">建立時間</th>
                                            <th className="px-6 py-4 font-semibold text-sm text-gray-600 text-right">操作管理</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {users.map((user) => (
                                            <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                                                            {user.username.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div className="font-medium text-gray-900">
                                                            {user.username}
                                                            {currentUser?.id === user.id && (
                                                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                                                    目前登入
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                                                        {user.role}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500">
                                                    {formatDate(user.created_at)}
                                                </td>
                                                <td className="px-6 py-4 text-right space-x-2">
                                                    <button
                                                        onClick={() => openEditForm(user)}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                                                    >
                                                        <Key size={14} />
                                                        重設密碼
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(user.id, user.username)}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 border border-transparent rounded hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                        disabled={currentUser?.id === user.id}
                                                        title={currentUser?.id === user.id ? "無法刪除目前登入的帳號" : ""}
                                                    >
                                                        <Trash2 size={14} />
                                                        刪除
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
