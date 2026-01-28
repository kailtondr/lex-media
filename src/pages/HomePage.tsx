import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Play, Brain, Mic } from 'lucide-react';

import { useTranslation } from 'react-i18next';

const HomePage: React.FC = () => {
    const { t } = useTranslation();
    const { currentUser, loginWithGoogle } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (currentUser) {
            navigate('/media');
        }
    }, [currentUser, navigate]);

    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center text-center max-w-4xl mx-auto space-y-12">
            <div className="space-y-6">
                <div className="inline-block p-3 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-white/5 mb-4">
                    <Brain size={48} className="text-purple-400" />
                </div>
                <h1 className="text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-200 to-purple-400 tracking-tight">
                    {t('home.welcome')}
                </h1>
                <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
                    {t('home.tagline')} <br />
                    {t('home.subTagline')}
                </p>
            </div>

            <button
                onClick={() => loginWithGoogle()}
                className="group relative px-8 py-4 bg-white text-slate-900 rounded-full font-bold text-lg hover:shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] transition-all flex items-center gap-3 overflow-hidden"
            >
                <span className="relative z-10 flex items-center gap-2">
                    <span className="text-xl">G</span> {t('home.login')}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-200 to-blue-200 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full pt-12 border-t border-white/5">
                <FeatureCard
                    icon={<Play />}
                    title={t('home.features.hub.title')}
                    desc={t('home.features.hub.desc')}
                />
                <FeatureCard
                    icon={<Brain />}
                    title={t('home.features.graph.title')}
                    desc={t('home.features.graph.desc')}
                />
                <FeatureCard
                    icon={<Mic />}
                    title={t('home.features.transcribe.title')}
                    desc={t('home.features.transcribe.desc')}
                />
            </div>
        </div>
    );
};

const FeatureCard = ({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) => (
    <div className="p-6 rounded-2xl bg-slate-900/50 border border-white/5 hover:border-purple-500/30 transition-colors text-left group">
        <div className="mb-4 text-purple-500 group-hover:scale-110 transition-transform origin-left">{icon}</div>
        <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
        <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
    </div>
);

export default HomePage;
