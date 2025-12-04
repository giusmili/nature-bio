import React, { useState, useEffect } from 'react'
import { analyzePlantImage } from './services/claude'
import { PlantAnalysis, Language } from './types'
import AnalysisView from './components/AnalysisView'
import HistorySidebar from './components/HistorySidebar'
import { CommunityFeed } from './components/CommunityFeed'
import { translations, TranslationKey } from './translations'

import {
    CameraIcon,
    UploadIcon,
    LeafIcon,
    HistoryIcon,
    AlertIcon,
    WaterIcon,
    UsersIcon,
} from './components/Icons'

type LegalModalProps = {
    open: boolean
    onClose: () => void
}

// Helpers to ensure images from mobile (HEIC/HEIF) are usable as JPEG
const readAsDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(file)
    })

const estimateBase64SizeBytes = (dataUrl: string) => {
  const base64 = dataUrl.split(',')[1] ?? '';
  // longueur base64 * 3/4 ≈ bytes réels
  return Math.ceil(base64.length * 3 / 4);
};

const MAX_BYTES = 2 * 1024 * 1024; // 2 MB pour être tranquille avec Vercel + Anthropic
const MAX_DIMENSION = 1600;        // max width/height si on doit réduire

const normalizeToJpeg = async (file: File) => {
  const base64 = await readAsDataUrl(file);

  return await new Promise<string>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      // 1) première passe : voir si l'image brute est déjà "petite"
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas context missing'));
      ctx.drawImage(img, 0, 0, width, height);

      let output = canvas.toDataURL('image/jpeg', 0.8);
      let sizeBytes = estimateBase64SizeBytes(output);

      console.log('Taille initiale ~', (sizeBytes / 1024 / 1024).toFixed(2), 'MB');

      // 2) si trop gros → on réduit dimensions + qualité
      if (sizeBytes > MAX_BYTES || width > MAX_DIMENSION || height > MAX_DIMENSION) {
        // recalculer dimensions
        if (width > height && width > MAX_DIMENSION) {
          height = (height * MAX_DIMENSION) / width;
          width = MAX_DIMENSION;
        } else if (height >= width && height > MAX_DIMENSION) {
          width = (width * MAX_DIMENSION) / height;
          height = MAX_DIMENSION;
        }

        canvas.width = Math.round(width);
        canvas.height = Math.round(height);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // baisser encore un peu la qualité
        output = canvas.toDataURL('image/jpeg', 0.7);
        sizeBytes = estimateBase64SizeBytes(output);
        console.log('Taille après resize ~', (sizeBytes / 1024 / 1024).toFixed(2), 'MB');
      }

      resolve(output);
    };
    img.onerror = reject;
    img.src = base64;
  });
};

function LegalModal({ open, onClose }: LegalModalProps) {
    if (!open) return null

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="legal-title"
        >
            <div className="bg-white max-w-lg w-full rounded-2xl shadow-xl p-6 space-y-4">
                <header className="flex items-center justify-between">
                    <h2 id="legal-title" className="text-xl font-bold text-gray-900">
                        Mentions légales & RGPD
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-800"
                        aria-label="Fermer la fenêtre des mentions légales"
                    >
                        x
                    </button>
                </header>

                <section className="space-y-3 text-sm text-gray-700 leading-relaxed">
                    <p>Cette application analyse une photo de plante pour fournir un diagnostic.</p>
                    <ul className="list-disc list-inside space-y-1">
                        <li>
                            Les images peuvent etre envoyees a l'API (via votre cle) ; sinon une
                            analyse fictive locale est utilisee.
                        </li>
                        <li>
                            L'historique des analyses est enregistre uniquement sur votre appareil
                            via localStorage; aucune base de donnees externe n'est utilisee.
                        </li>
                        <li>Aucun cookie ou suivi tiers n'est implante par l'application.</li>
                        <li>
                            Vous pouvez vider l'historique en effacant les donnees du site dans
                            votre navigateur ou en reinitialisant l'application.
                        </li>
                    </ul>
                    <p>
                        Pour toute demande liee a la vie privee, utilisez votre canal de contact
                        editeur habituel (email ou formulaire).
                    </p>
                </section>

                <div className="flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        aria-label="Fermer"
                    >
                        Fermer
                    </button>
                </div>
            </div>
        </div>
    )
}

type View = 'analyze' | 'community'

function App() {
    // State
    const [currentView, setCurrentView] = useState<View>('analyze')
    const [lang, setLang] = useState<Language>('fr')
    const [image, setImage] = useState<string | null>(null)
    const [analysis, setAnalysis] = useState<PlantAnalysis | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [history, setHistory] = useState<PlantAnalysis[]>([])
    const [isHistoryOpen, setIsHistoryOpen] = useState(false)
    const [isLegalOpen, setIsLegalOpen] = useState(false)

    // Translation helper
    const t = (key: TranslationKey) => translations[lang][key]

    // Load history on mount
    useEffect(() => {
        const saved = localStorage.getItem('botanai_history')
        if (saved) {
            try {
                setHistory(JSON.parse(saved))
            } catch (e) {
                console.error('Failed to parse history', e)
            }
        }
    }, [])

    // Save history on update
    useEffect(() => {
        try {
            localStorage.setItem('botanai_history', JSON.stringify(history))
        } catch (e) {
            console.error('Failed to save history', e)
        }
    }, [history])

    // Handlers
    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return
        try {
            const normalized = await normalizeToJpeg(file)
            setImage(normalized)
            handleAnalyze(normalized)
        } catch (e) {
            console.error('Image load failed', e)
            setError(t('analyze_error_detail'))
            setIsLoading(false)
        } finally {
            event.target.value = ''
        }
    }

    const handleAnalyze = async (base64Image: string) => {
        setIsLoading(true)
        setError(null)
        setAnalysis(null)
        setCurrentView('analyze')
        setImage(base64Image)

        try {
            const result = await analyzePlantImage(base64Image, lang)
            const itemWithImage = { ...result, image: base64Image }
            setAnalysis(itemWithImage)
            setHistory((prev) => [itemWithImage, ...prev])
        } catch (err: any) {
            console.error(err)
            const message =
                err instanceof Error && err.message ? err.message : t('analyze_error_detail') // fallback if no message
            setError(message)
        } finally {
            setIsLoading(false)
        }
    }

    const resetApp = () => {
        setImage(null)
        setAnalysis(null)
        setError(null)
    }

    const selectHistoryItem = (item: PlantAnalysis) => {
        setAnalysis(item)
        setCurrentView('analyze')
        setImage(item.image ?? null)
    }

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-green-200 flex flex-col">
            <header className="bg-white shadow-sm sticky top-0 z-30 flex-shrink-0">
                <nav
                    className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between"
                    aria-label="Navigation principale"
                >
                    <button
                        type="button"
                        className="flex items-center gap-2 cursor-pointer"
                        onClick={() => {
                            setCurrentView('analyze')
                            resetApp()
                        }}
                        aria-label={t('app_title')}
                    >
                        <span className="bg-green-600 text-white p-1.5 rounded-lg">
                            <LeafIcon className="w-6 h-6" />
                        </span>
                        <span className="text-xl font-bold tracking-tight text-green-900 hidden sm:block">
                            {t('app_title')}
                        </span>
                    </button>

                    <div
                        className="flex items-center bg-gray-100 rounded-full p-1 gap-1"
                        role="tablist"
                        aria-label="Changement de vue"
                    >
                        <button
                            onClick={() => setCurrentView('analyze')}
                            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${
                                currentView === 'analyze'
                                    ? 'bg-white text-green-700 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                            role="tab"
                            aria-selected={currentView === 'analyze'}
                            aria-controls="analyze-panel"
                            aria-label={t('scan')}
                        >
                            <CameraIcon className="w-4 h-4" />
                            <span className="hidden sm:inline">{t('scan')}</span>
                        </button>
                        <button
                            onClick={() => setCurrentView('community')}
                            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${
                                currentView === 'community'
                                    ? 'bg-white text-green-700 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                            role="tab"
                            aria-selected={currentView === 'community'}
                            aria-controls="community-panel"
                            aria-label={t('community')}
                        >
                            <UsersIcon className="w-4 h-4" />
                            <span className="hidden sm:inline">{t('community')}</span>
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setLang(lang === 'en' ? 'fr' : 'en')}
                            className="px-2 py-1 text-sm font-bold text-green-700 border border-green-200 rounded hover:bg-green-50 uppercase"
                            aria-label="Changer de langue"
                        >
                            {lang}
                        </button>
                        <button
                            onClick={() => setIsHistoryOpen(true)}
                            className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-full transition-colors"
                            title={t('history')}
                            aria-label={t('history')}
                        >
                            <HistoryIcon className="w-6 h-6" />
                        </button>
                    </div>
                </nav>
            </header>

            <main className="max-w-5xl mx-auto px-4 py-8 flex-grow w-full" id="contenu-principal">
                {currentView === 'community' ? (
                    <section id="community-panel" aria-label={t('community')}>
                        <CommunityFeed lang={lang} t={t} />
                    </section>
                ) : (
                    <section id="analyze-panel" aria-label={t('scan')}>
                        {error && (
                            <section
                                role="alert"
                                aria-live="assertive"
                                className="max-w-md mx-auto mb-8 bg-red-50 border-l-4 border-red-500 p-4 rounded-r shadow-sm flex justify-between items-center"
                            >
                                <div>
                                    <p className="font-bold text-red-700">{t('analyze_error')}</p>
                                    <p className="text-sm text-red-600">{error}</p>
                                </div>
                                <button
                                    onClick={resetApp}
                                    className="text-red-700 font-bold text-sm hover:underline"
                                    aria-label={t('retry')}
                                >
                                    {t('retry')}
                                </button>
                            </section>
                        )}

                        {isLoading && (
                            <section
                                role="status"
                                aria-live="polite"
                                className="flex flex-col items-center justify-center py-20 animate-fade-in"
                            >
                                <div className="relative">
                                    <div className="w-20 h-20 border-4 border-gray-200 rounded-full"></div>
                                    <div className="w-20 h-20 border-4 border-green-500 rounded-full border-t-transparent animate-spin absolute top-0 left-0"></div>
                                    <LeafIcon className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-green-500 w-8 h-8 animate-pulse" />
                                </div>
                                <h2 className="mt-8 text-2xl font-bold text-gray-800">
                                    {t('examining')}
                                </h2>
                                <p className="text-gray-500 mt-2">{t('examining_desc')}</p>
                            </section>
                        )}

                        {!isLoading && analysis && (
                            <section aria-label="Analyse de la plante">
                                <AnalysisView
                                    data={analysis}
                                    image={image}
                                    onReset={resetApp}
                                    t={t}
                                />
                            </section>
                        )}

                        {!isLoading && !analysis && (
                            <section
                                aria-labelledby="hero-title"
                                className="max-w-xl mx-auto text-center animate-fade-in pt-10"
                            >
                                <header>
                                    <h1
                                        id="hero-title"
                                        className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6 tracking-tight"
                                    >
                                        {t('hero_title')} <br />
                                        <span className="text-green-600">{t('hero_subtitle')}</span>
                                    </h1>
                                    <p className="text-lg text-gray-600 mb-10 leading-relaxed">
                                        {t('hero_desc')}
                                    </p>
                                </header>

                                <div
                                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                                    role="group"
                                    aria-label="Actions de chargement d'image"
                                >
                                    <label className="group relative flex flex-col items-center justify-center p-8 border-2 border-dashed border-green-300 rounded-2xl cursor-pointer hover:bg-green-50 hover:border-green-500 transition-all duration-300 bg-white shadow-sm">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            capture="environment"
                                            className="hidden"
                                            onChange={handleImageUpload}
                                            aria-label={t('take_photo')}
                                        />
                                        <div className="bg-green-100 text-green-600 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform">
                                            <CameraIcon className="w-8 h-8" />
                                        </div>
                                        <span className="font-bold text-gray-800 text-lg">
                                            {t('take_photo')}
                                        </span>
                                        <span className="text-sm text-gray-500 mt-1">
                                            {t('use_camera')}
                                        </span>
                                    </label>

                                    <label className="group relative flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer hover:bg-gray-50 hover:border-gray-500 transition-all duration-300 bg-white shadow-sm">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleImageUpload}
                                            aria-label={t('upload_image')}
                                        />
                                        <div className="bg-gray-100 text-gray-600 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform">
                                            <UploadIcon className="w-8 h-8" />
                                        </div>
                                        <span className="font-bold text-gray-800 text-lg">
                                            {t('upload_image')}
                                        </span>
                                        <span className="text-sm text-gray-500 mt-1">
                                            {t('from_gallery')}
                                        </span>
                                    </label>
                                </div>

                                <section
                                    className="mt-12 grid grid-cols-3 gap-4 text-center"
                                    aria-label="Points forts"
                                >
                                    <div>
                                        <div className="bg-white rounded-full w-12 h-12 flex items-center justify-center mx-auto shadow-sm mb-3 text-green-600">
                                            <LeafIcon />
                                        </div>
                                        <p className="text-sm font-semibold text-gray-700">
                                            {t('accuracy')}
                                        </p>
                                    </div>
                                    <div>
                                        <div className="bg-white rounded-full w-12 h-12 flex items-center justify-center mx-auto shadow-sm mb-3 text-green-600">
                                            <AlertIcon />
                                        </div>
                                        <p className="text-sm font-semibold text-gray-700">
                                            {t('disease_detection')}
                                        </p>
                                    </div>
                                    <div>
                                        <div className="bg-white rounded-full w-12 h-12 flex items-center justify-center mx-auto shadow-sm mb-3 text-green-600">
                                            <WaterIcon />
                                        </div>
                                        <p className="text-sm font-semibold text-gray-700">
                                            {t('care_guides')}
                                        </p>
                                    </div>
                                </section>
                            </section>
                        )}
                    </section>
                )}
            </main>

            <footer
                className="py-6 text-center text-gray-400 text-sm font-medium border-t border-gray-100 bg-white"
                aria-label="Pied de page"
            >
                <div className="flex items-center justify-center gap-4">
                    <span>&copy; Giusmili 2025</span>
                    <button
                        className="text-green-700 hover:underline font-semibold"
                        onClick={() => setIsLegalOpen(true)}
                        aria-label="Mentions légales et RGPD"
                    >
                        Mentions légales / RGPD
                    </button>
                </div>
            </footer>

            <HistorySidebar
                history={history}
                isOpen={isHistoryOpen}
                onClose={() => setIsHistoryOpen(false)}
                onSelect={selectHistoryItem}
                t={t}
            />
            <LegalModal open={isLegalOpen} onClose={() => setIsLegalOpen(false)} />
        </div>
    )
}

export default App
