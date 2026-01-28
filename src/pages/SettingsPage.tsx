import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

const SettingsPage: React.FC = () => {
    const { t, i18n } = useTranslation();

    const changeLanguage = (lng: string) => {
        i18n.changeLanguage(lng);
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8 p-4">
            <h1 className="text-3xl font-bold text-white mb-6">{t('settings.title')}</h1>

            <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-6">
                    <Globe className="text-purple-400" size={24} />
                    <h2 className="text-xl font-semibold text-slate-200">{t('settings.language')}</h2>
                </div>

                <div className="space-y-2">
                    <p className="text-sm text-slate-400 mb-4">{t('settings.selectLanguage')}</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                            { code: 'en', label: 'English' },
                            { code: 'fr', label: 'Français' },
                            { code: 'pt', label: 'Português (Brasil)' }
                        ].map((lang) => (
                            <button
                                key={lang.code}
                                onClick={() => changeLanguage(lang.code)}
                                className={`px-4 py-3 rounded-xl border transition-all text-left ${i18n.language.startsWith(lang.code)
                                        ? 'bg-purple-600/20 border-purple-500 text-purple-300 ring-1 ring-purple-500'
                                        : 'bg-slate-800/50 border-white/10 text-slate-400 hover:bg-white/5 hover:text-slate-200'
                                    }`}
                            >
                                {lang.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
