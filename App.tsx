
import React, { useState, useEffect } from 'react';
import { analyzePlantImage } from './services/geminiService';
import { PlantAnalysis, Language } from './types';
import AnalysisView from './components/AnalysisView';
import HistorySidebar from './components/HistorySidebar';
import { CommunityFeed } from './components/CommunityFeed';
import { translations, TranslationKey } from './translations';
import { 
  CameraIcon, 
  UploadIcon, 
  LeafIcon, 
  HistoryIcon, 
  AlertIcon, 
  WaterIcon,
  UsersIcon
} from './components/Icons';

type View = 'analyze' | 'community';

function App() {
  // State
  const [currentView, setCurrentView] = useState<View>('analyze');
  const [lang, setLang] = useState<Language>('en');
  const [image, setImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<PlantAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<PlantAnalysis[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Translation helper
  const t = (key: TranslationKey) => translations[lang][key];

  // Load history on mount
  useEffect(() => {
    const saved = localStorage.getItem('botanai_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  // Save history on update
  useEffect(() => {
    localStorage.setItem('botanai_history', JSON.stringify(history));
  }, [history]);

  // Handlers
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setImage(base64);
        handleAnalyze(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async (base64Image: string) => {
    setIsLoading(true);
    setError(null);
    setAnalysis(null);
    setCurrentView('analyze'); // Ensure we are on the analyze view

    try {
      const result = await analyzePlantImage(base64Image, lang);
      setAnalysis(result);
      setHistory(prev => [result, ...prev]);
    } catch (err) {
      setError(t('analyze_error_detail'));
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const resetApp = () => {
    setImage(null);
    setAnalysis(null);
    setError(null);
  };

  const selectHistoryItem = (item: PlantAnalysis) => {
    setAnalysis(item);
    setCurrentView('analyze');
    setImage(null); 
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-green-200 flex flex-col">
      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-30 flex-shrink-0">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => { setCurrentView('analyze'); resetApp(); }}>
            <div className="bg-green-600 text-white p-1.5 rounded-lg">
                <LeafIcon className="w-6 h-6" />
            </div>
            <span className="text-xl font-bold tracking-tight text-green-900 hidden sm:block">{t('app_title')}</span>
          </div>
          
          <div className="flex items-center bg-gray-100 rounded-full p-1 gap-1">
             <button 
                onClick={() => setCurrentView('analyze')}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${currentView === 'analyze' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
             >
                <CameraIcon className="w-4 h-4" />
                <span className="hidden sm:inline">{t('scan')}</span>
             </button>
             <button 
                onClick={() => setCurrentView('community')}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${currentView === 'community' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
             >
                <UsersIcon className="w-4 h-4" />
                <span className="hidden sm:inline">{t('community')}</span>
             </button>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setLang(lang === 'en' ? 'fr' : 'en')}
              className="px-2 py-1 text-sm font-bold text-green-700 border border-green-200 rounded hover:bg-green-50 uppercase"
            >
              {lang}
            </button>
            <button 
              onClick={() => setIsHistoryOpen(true)}
              className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-full transition-colors"
              title={t('history')}
            >
              <HistoryIcon className="w-6 h-6" />
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-8 flex-grow w-full">
        
        {currentView === 'community' ? (
           <CommunityFeed lang={lang} t={t} />
        ) : (
          <>
            {/* State: Error */}
            {error && (
              <div className="max-w-md mx-auto mb-8 bg-red-50 border-l-4 border-red-500 p-4 rounded-r shadow-sm flex justify-between items-center">
                <div>
                    <p className="font-bold text-red-700">{t('analyze_error')}</p>
                    <p className="text-sm text-red-600">{error}</p>
                </div>
                <button onClick={resetApp} className="text-red-700 font-bold text-sm hover:underline">{t('retry')}</button>
              </div>
            )}

            {/* State: Loading */}
            {isLoading && (
              <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
                <div className="relative">
                    <div className="w-20 h-20 border-4 border-gray-200 rounded-full"></div>
                    <div className="w-20 h-20 border-4 border-green-500 rounded-full border-t-transparent animate-spin absolute top-0 left-0"></div>
                    <LeafIcon className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-green-500 w-8 h-8 animate-pulse" />
                </div>
                <h2 className="mt-8 text-2xl font-bold text-gray-800">{t('examining')}</h2>
                <p className="text-gray-500 mt-2">{t('examining_desc')}</p>
              </div>
            )}

            {/* State: Results */}
            {!isLoading && analysis && (
                <AnalysisView data={analysis} image={image} onReset={resetApp} t={t} />
            )}

            {/* State: Idle (Upload) */}
            {!isLoading && !analysis && (
              <div className="max-w-xl mx-auto text-center animate-fade-in pt-10">
                <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6 tracking-tight">
                  {t('hero_title')} <br/>
                  <span className="text-green-600">{t('hero_subtitle')}</span>
                </h1>
                <p className="text-lg text-gray-600 mb-10 leading-relaxed">
                  {t('hero_desc')}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Camera Action */}
                  <label className="group relative flex flex-col items-center justify-center p-8 border-2 border-dashed border-green-300 rounded-2xl cursor-pointer hover:bg-green-50 hover:border-green-500 transition-all duration-300 bg-white shadow-sm">
                      <input 
                        type="file" 
                        accept="image/*" 
                        capture="environment"
                        className="hidden" 
                        onChange={handleImageUpload}
                      />
                      <div className="bg-green-100 text-green-600 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform">
                        <CameraIcon className="w-8 h-8" />
                      </div>
                      <span className="font-bold text-gray-800 text-lg">{t('take_photo')}</span>
                      <span className="text-sm text-gray-500 mt-1">{t('use_camera')}</span>
                  </label>

                  {/* Upload Action */}
                  <label className="group relative flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer hover:bg-gray-50 hover:border-gray-500 transition-all duration-300 bg-white shadow-sm">
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleImageUpload}
                      />
                      <div className="bg-gray-100 text-gray-600 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform">
                        <UploadIcon className="w-8 h-8" />
                      </div>
                      <span className="font-bold text-gray-800 text-lg">{t('upload_image')}</span>
                      <span className="text-sm text-gray-500 mt-1">{t('from_gallery')}</span>
                  </label>
                </div>

                <div className="mt-12 grid grid-cols-3 gap-4 text-center">
                    <div>
                        <div className="bg-white rounded-full w-12 h-12 flex items-center justify-center mx-auto shadow-sm mb-3 text-green-600">
                            <LeafIcon />
                        </div>
                        <p className="text-sm font-semibold text-gray-700">{t('accuracy')}</p>
                    </div>
                    <div>
                        <div className="bg-white rounded-full w-12 h-12 flex items-center justify-center mx-auto shadow-sm mb-3 text-green-600">
                            <AlertIcon />
                        </div>
                        <p className="text-sm font-semibold text-gray-700">{t('disease_detection')}</p>
                    </div>
                    <div>
                        <div className="bg-white rounded-full w-12 h-12 flex items-center justify-center mx-auto shadow-sm mb-3 text-green-600">
                            <WaterIcon />
                        </div>
                        <p className="text-sm font-semibold text-gray-700">{t('care_guides')}</p>
                    </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-gray-400 text-sm font-medium border-t border-gray-100 bg-white">
        &copy; Giusmili 2025
      </footer>

      {/* Sidebar */}
      <HistorySidebar 
        history={history} 
        isOpen={isHistoryOpen} 
        onClose={() => setIsHistoryOpen(false)}
        onSelect={selectHistoryItem}
        t={t}
      />
    </div>
  );
}

export default App;
