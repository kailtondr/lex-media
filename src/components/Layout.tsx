import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, PlayCircle, BookOpen, Mic, Search, LogOut, Settings, FileText, Tag, Menu, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { t } = useTranslation();
    const { currentUser, logout } = useAuth();
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // If not logged in, render simple layout (Landing Page)
    if (!currentUser) {
        return (
            <div className="min-h-screen bg-slate-950 text-slate-100 font-sans relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-96 bg-purple-900/10 blur-[120px] pointer-events-none -z-10" />
                <main className="p-4 md:p-8">
                    {children}
                </main>
            </div>
        );
    }

    const menuItems = [
        { icon: Home, label: t('nav.dashboard'), path: '/' },
        { icon: PlayCircle, label: t('nav.mediaHub'), path: '/media' },
        { icon: FileText, label: 'Notes', path: '/notes' },
        { icon: Tag, label: 'Tags', path: '/tags' },
        { icon: BookOpen, label: t('nav.graphBrain'), path: '/brain' },
        { icon: Mic, label: t('nav.transcription'), path: '/transcribe' },
    ];

    // Mobile bottom nav items (subset for quick access)
    const mobileNavItems = [
        { icon: Home, label: 'Home', path: '/' },
        { icon: PlayCircle, label: 'Media', path: '/media' },
        { icon: FileText, label: 'Notes', path: '/notes' },
        { icon: Tag, label: 'Tags', path: '/tags' },
        { icon: Settings, label: 'More', path: '/settings' },
    ];

    return (
        <div className="flex h-screen bg-slate-950 text-slate-100 font-sans">
            {/* Desktop Sidebar - Hidden on mobile */}
            <aside className="hidden md:flex w-64 border-r border-white/5 bg-slate-900/50 flex-col">
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

            {/* Mobile Slide-out Menu */}
            {isMobileMenuOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
                        onClick={() => setIsMobileMenuOpen(false)}
                    />
                    {/* Drawer */}
                    <div className="fixed inset-y-0 left-0 w-72 bg-slate-900 border-r border-white/10 z-50 md:hidden flex flex-col animate-slide-in">
                        <div className="p-4 border-b border-white/5 flex items-center justify-between">
                            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                                {t('app.title')}
                            </h1>
                            <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-slate-400 hover:text-white">
                                <X size={24} />
                            </button>
                        </div>

                        {/* User Profile */}
                        <div className="p-4 border-b border-white/5">
                            <div className="flex items-center gap-3">
                                {currentUser.photoURL ? (
                                    <img src={currentUser.photoURL} alt="User" className="w-10 h-10 rounded-full border border-white/10" />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-sm font-bold">
                                        {currentUser.email?.[0].toUpperCase()}
                                    </div>
                                )}
                                <div className="flex-1 overflow-hidden">
                                    <p className="text-sm font-medium truncate">{currentUser.displayName || 'User'}</p>
                                    <p className="text-xs text-slate-500 truncate">{currentUser.email}</p>
                                </div>
                            </div>
                        </div>

                        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                            {menuItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = location.pathname === item.path;
                                return (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all ${isActive
                                            ? 'bg-purple-600/20 text-purple-400 font-medium'
                                            : 'text-slate-300 active:bg-white/10'
                                            }`}
                                    >
                                        <Icon size={22} />
                                        <span className="text-base">{item.label}</span>
                                    </Link>
                                );
                            })}
                        </nav>

                        <div className="p-4 border-t border-white/5 space-y-1">
                            <Link
                                to="/settings"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="flex items-center gap-3 w-full px-4 py-3 text-slate-400 rounded-xl active:bg-white/10"
                            >
                                <Settings size={20} />
                                <span>{t('app.settings')}</span>
                            </Link>
                            <button
                                onClick={() => { logout(); setIsMobileMenuOpen(false); }}
                                className="flex items-center gap-3 w-full px-4 py-3 text-red-400 rounded-xl active:bg-white/10"
                            >
                                <LogOut size={20} />
                                <span>{t('app.signOut')}</span>
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden relative">
                {/* Top Header */}
                <header className="h-14 md:h-16 border-b border-white/5 flex items-center justify-between px-4 md:px-8 bg-slate-950/50 backdrop-blur-md z-10">
                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setIsMobileMenuOpen(true)}
                        className="p-2 text-slate-400 hover:text-white md:hidden"
                    >
                        <Menu size={24} />
                    </button>

                    {/* Search Bar */}
                    <div className="flex items-center gap-2 md:gap-4 text-slate-400 flex-1 md:flex-none md:w-96 bg-slate-900/50 px-3 md:px-4 py-2 rounded-lg border border-white/5 mx-2 md:mx-0">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder={t('app.searchPlaceholder')}
                            className="bg-transparent border-none outline-none w-full text-sm text-slate-200"
                        />
                    </div>

                    {/* Mobile: User Avatar */}
                    <div className="md:hidden">
                        {currentUser.photoURL ? (
                            <img src={currentUser.photoURL} alt="User" className="w-8 h-8 rounded-full border border-white/10" />
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-xs font-bold">
                                {currentUser.email?.[0].toUpperCase()}
                            </div>
                        )}
                    </div>
                </header>

                <div className="flex-1 overflow-auto p-4 md:p-8 pb-24 md:pb-8 relative">
                    {/* Background gradient blob for aesthetics */}
                    <div className="absolute top-0 left-0 w-full h-96 bg-purple-900/20 blur-[100px] pointer-events-none -z-10" />

                    {children}
                </div>
            </main>

            {/* Mobile Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-xl border-t border-white/10 z-30 md:hidden safe-area-bottom">
                <div className="flex items-center justify-around py-2">
                    {mobileNavItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex flex-col items-center gap-1 px-3 py-2 min-w-[60px] ${isActive ? 'text-purple-400' : 'text-slate-500'
                                    }`}
                            >
                                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                                <span className="text-[10px] font-medium">{item.label}</span>
                            </Link>
                        );
                    })}
                </div>
            </nav>

            {/* CSS for animations and safe area */}
            <style>{`
                @keyframes slide-in {
                    from { transform: translateX(-100%); }
                    to { transform: translateX(0); }
                }
                .animate-slide-in {
                    animation: slide-in 0.2s ease-out;
                }
                .safe-area-bottom {
                    padding-bottom: env(safe-area-inset-bottom, 0px);
                }
            `}</style>
        </div>
    );
};

export default Layout;
