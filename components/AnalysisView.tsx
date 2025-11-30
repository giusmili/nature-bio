
import React, { useState } from 'react';
import { PlantAnalysis, HealthStatus } from '../types';
import { TranslationKey } from '../translations';
import { 
  WaterIcon, 
  SunIcon, 
  ThermometerIcon, 
  LeafIcon, 
  AlertIcon, 
  CheckCircleIcon,
  CameraIcon,
  FacebookIcon,
  TwitterIcon,
  LinkedInIcon,
  LinkIcon
} from './Icons';

interface AnalysisViewProps {
  data: PlantAnalysis;
  image: string | null;
  onReset: () => void;
  t: (key: TranslationKey) => string;
}

const AnalysisView: React.FC<AnalysisViewProps> = ({ data, image, onReset, t }) => {
  const [shareMsg, setShareMsg] = useState<string | null>(null);

  const isHealthy = data.healthStatus === HealthStatus.HEALTHY;
  const isSick = data.healthStatus === HealthStatus.SICK;

  // Prepare share text
  const shareText = `I just analyzed my ${data.commonName} with BotanAI! Diagnosis: ${data.diagnosis} (${data.healthStatus}). 🌿🔍 #BotanAI #PlantHealth`;
  const shareUrl = window.location.href; // In a real app, this would be a unique link to the result

  const handleShare = (platform: 'twitter' | 'facebook' | 'linkedin' | 'copy') => {
    let url = '';
    
    switch (platform) {
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
        window.open(url, '_blank');
        break;
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        window.open(url, '_blank');
        break;
      case 'linkedin':
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
        window.open(url, '_blank');
        break;
      case 'copy':
        navigator.clipboard.writeText(`${shareText} ${shareUrl}`).then(() => {
          setShareMsg(t('share_success'));
          setTimeout(() => setShareMsg(null), 3000);
        });
        break;
    }
  };

  return (
    <div className="max-w-3xl mx-auto pb-12 animate-fade-in">
      {/* Header Card */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
        <div className="relative h-64 md:h-80 bg-gray-100">
            {image && (
                <img 
                src={image} 
                alt="Analyzed Plant" 
                className="w-full h-full object-cover"
                />
            )}
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-black/70 to-transparent"></div>
            <div className="absolute bottom-0 left-0 p-6 text-white w-full">
                <div className="flex items-center gap-2 mb-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                        isHealthy ? 'bg-green-500 text-white' : 
                        isSick ? 'bg-red-500 text-white' : 
                        'bg-yellow-500 text-white'
                    }`}>
                        {t(data.healthStatus as unknown as TranslationKey)}
                    </span>
                    <span className="text-sm opacity-80 bg-black/30 px-2 py-0.5 rounded">
                        {(data.confidence * 100).toFixed(0)}% {t('confidence')}
                    </span>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold mb-1">{data.commonName}</h1>
                <p className="text-lg italic opacity-90">{data.scientificName}</p>
            </div>
        </div>
        
        <div className="p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
                <LeafIcon className="text-green-600" />
                {t('diagnosis')}
            </h2>
            <div className={`p-4 rounded-xl border-l-4 ${
                isHealthy ? 'bg-green-50 border-green-500 text-green-800' : 
                isSick ? 'bg-red-50 border-red-500 text-red-800' : 
                'bg-yellow-50 border-yellow-500 text-yellow-800'
            }`}>
                <div className="flex items-start gap-3">
                    <div className="mt-1">
                        {isHealthy ? <CheckCircleIcon /> : isSick ? <AlertIcon /> : <LeafIcon />}
                    </div>
                    <div>
                        <h3 className="font-bold text-lg mb-1">{data.diagnosis}</h3>
                        <p className="opacity-90 leading-relaxed">{data.symptoms.length > 0 ? data.symptoms.join(", ") : t('no_symptoms')}</p>
                    </div>
                </div>
            </div>

            {isSick && data.treatment.length > 0 && (
                <div className="mt-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">{t('suggested_treatment')}</h3>
                    <ul className="space-y-2">
                        {data.treatment.map((step, idx) => (
                            <li key={idx} className="flex items-start gap-3 bg-gray-50 p-3 rounded-lg">
                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-sm">
                                    {idx + 1}
                                </span>
                                <span className="text-gray-700">{step}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
      </div>

      {/* Care Guide Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-start gap-4 hover:shadow-md transition-shadow">
            <div className="p-3 bg-blue-50 text-blue-500 rounded-xl">
                <WaterIcon className="w-6 h-6" />
            </div>
            <div>
                <h3 className="font-bold text-gray-800 mb-1">{t('watering')}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{data.careInstructions.water}</p>
            </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-start gap-4 hover:shadow-md transition-shadow">
            <div className="p-3 bg-yellow-50 text-yellow-500 rounded-xl">
                <SunIcon className="w-6 h-6" />
            </div>
            <div>
                <h3 className="font-bold text-gray-800 mb-1">{t('light')}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{data.careInstructions.light}</p>
            </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-start gap-4 hover:shadow-md transition-shadow">
            <div className="p-3 bg-orange-50 text-orange-500 rounded-xl">
                <ThermometerIcon className="w-6 h-6" />
            </div>
            <div>
                <h3 className="font-bold text-gray-800 mb-1">{t('environment')}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                    {t('temp')}: {data.careInstructions.temperature}<br/>
                    {t('humidity')}: {data.careInstructions.humidity}
                </p>
            </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-start gap-4 hover:shadow-md transition-shadow">
            <div className="p-3 bg-purple-50 text-purple-500 rounded-xl">
                <LeafIcon className="w-6 h-6" />
            </div>
            <div>
                <h3 className="font-bold text-gray-800 mb-1">{t('did_you_know')}</h3>
                <p className="text-sm text-gray-600 leading-relaxed italic">"{data.funFact}"</p>
            </div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-6">
        <button 
            onClick={onReset}
            className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-full font-semibold shadow-lg transform transition hover:scale-105 active:scale-95 flex items-center gap-2"
        >
            <CameraIcon className="w-5 h-5" />
            {t('scan_another')}
        </button>

        <div className="text-center">
            <p className="text-sm font-medium text-gray-500 mb-3 uppercase tracking-wider">{t('share_result')}</p>
            <div className="flex items-center justify-center gap-3">
                <button 
                    onClick={() => handleShare('facebook')}
                    className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center shadow hover:bg-blue-700 transition"
                >
                    <FacebookIcon className="w-5 h-5" />
                </button>
                <button 
                    onClick={() => handleShare('twitter')}
                    className="w-10 h-10 bg-sky-500 text-white rounded-full flex items-center justify-center shadow hover:bg-sky-600 transition"
                >
                    <TwitterIcon className="w-5 h-5" />
                </button>
                <button 
                    onClick={() => handleShare('linkedin')}
                    className="w-10 h-10 bg-blue-700 text-white rounded-full flex items-center justify-center shadow hover:bg-blue-800 transition"
                >
                    <LinkedInIcon className="w-5 h-5" />
                </button>
                <button 
                    onClick={() => handleShare('copy')}
                    className="w-10 h-10 bg-gray-700 text-white rounded-full flex items-center justify-center shadow hover:bg-gray-800 transition relative"
                >
                    <LinkIcon className="w-5 h-5" />
                </button>
            </div>
            {shareMsg && (
                <p className="text-green-600 text-sm mt-2 font-medium animate-fade-in">{shareMsg}</p>
            )}
        </div>
      </div>
    </div>
  );
};

export default AnalysisView;
