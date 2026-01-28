import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, PlayCircle, BookOpen, Mic, Search, LogOut, Settings } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { t } = useTranslation();
    const { currentUser, logout } = useAuth();
    const location = useLocation();

    // If not logged in, render simple layout (Landing Page)
    if (!currentUser) {
        return (
            <div className="min-h-screen bg-slate-950 text-slate-100 font-sans relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-96 bg-purple-900/10 blur-[120px] pointer-events-none -z-10" />
                <main className="p-8">
                    {children}
                </main>
            </div>
        );
    }

    const menuItems = [
        { icon: Home, label: t('nav.dashboard'), path: '/' },
        { icon: PlayCircle, label: t('nav.mediaHub'), path: '/media' },
        { icon: BookOpen, label: t('nav.graphBrain'), path: '/brain' },
        { icon: Mic, label: t('nav.transcription'), path: '/transcribe' },
    ];

    return (
        <div className="flex h-screen bg-slate-950 text-slate-100 font-sans">
            {/* Sidebar */}
            <aside className="w-64 border-r border-white/5 bg-slate-900/50 flex flex-col">
                <div className="p-6">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                        {t('app.title')}
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">{t('app.subtitle')}</p>
                </div>

                <nav className="flex-1 px-4 space-y-2">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                                    ? 'bg-purple-600/10 text-purple-400 font-medium'
                                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                                    }`}
                            >
                                <Icon size={20} />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-white/5 space-y-2">
                    {/* User Profile */}
                    <div className="flex items-center gap-3 px-2 py-2 mb-2">
                        {currentUser.photoURL ? (
                            <img src={currentUser.photoURL} alt="User" className="w-8 h-8 rounded-full border border-white/10" />
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-xs font-bold">
                                {currentUser.email?.[0].toUpperCase()}
                            </div>
                        )}
                        <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-medium truncate">{currentUser.displayName || 'User'}</p>
                            <p className="text-xs text-slate-500 truncate">{currentUser.email}</p>
                        </div>
                    </div>

                    <Link to="/settings" className="flex items-center gap-3 w-full px-4 py-2 text-slate-400 hover:text-slate-200 rounded-xl hover:bg-white/5 transition-all text-sm">
                        <Settings size={16} />
                        <span>{t('app.settings')}</span>
                    </Link>

                    <button
                        onClick={() => logout()}
                        className="flex items-center gap-3 w-full px-4 py-2 text-red-400 hover:text-red-300 rounded-xl hover:bg-white/5 transition-all text-sm"
                    >
                        <LogOut size={16} />
                        <span>{t('app.signOut')}</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden relative">
                {/* Top Header */}
                <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-slate-950/50 backdrop-blur-md z-10">
                    <div className="flex items-center gap-4 text-slate-400 w-96 bg-slate-900/50 px-4 py-2 rounded-lg border border-white/5">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder={t('app.searchPlaceholder')}
                            className="bg-transparent border-none outline-none w-full text-sm text-slate-200"
                        />
                    </div>
                </header>

                <div className="flex-1 overflow-auto p-8 relative">
                    {/* Background gradient blob for aesthetics */}
                    <div className="absolute top-0 left-0 w-full h-96 bg-purple-900/20 blur-[100px] pointer-events-none -z-10" />

                    {children}
                </div>
            </main>
        </div>
    );
};

export default Layout;
