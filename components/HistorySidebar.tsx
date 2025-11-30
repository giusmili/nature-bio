
import React from 'react';
import { PlantAnalysis, HealthStatus } from '../types';
import { TranslationKey } from '../translations';
import { LeafIcon, AlertIcon, CheckCircleIcon } from './Icons';

interface HistorySidebarProps {
  history: PlantAnalysis[];
  onSelect: (item: PlantAnalysis) => void;
  isOpen: boolean;
  onClose: () => void;
  t: (key: TranslationKey) => string;
}

const HistorySidebar: React.FC<HistorySidebarProps> = ({ history, onSelect, isOpen, onClose, t }) => {
  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar Panel */}
      <div className={`fixed right-0 top-0 h-full w-80 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-4 border-b flex justify-between items-center bg-green-50">
          <h2 className="text-xl font-bold text-green-900 flex items-center gap-2">
            <LeafIcon className="w-5 h-5" />
            {t('my_garden')}
          </h2>
          <button 
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 focus:outline-none text-2xl"
          >
            &times;
          </button>
        </div>

        <div className="overflow-y-auto h-[calc(100%-64px)] p-4 space-y-3">
          {history.length === 0 ? (
            <div className="text-center text-gray-500 mt-10">
              <p>{t('no_plants')}</p>
              <p className="text-sm mt-2">{t('start_history')}</p>
            </div>
          ) : (
            history.map((item) => (
              <div 
                key={item.id}
                onClick={() => {
                  onSelect(item);
                  onClose();
                }}
                className="bg-white border border-gray-100 rounded-lg p-3 shadow-sm hover:shadow-md cursor-pointer transition-shadow flex items-start gap-3"
              >
                <div className={`mt-1 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  item.healthStatus === HealthStatus.HEALTHY ? 'bg-green-100 text-green-600' :
                  item.healthStatus === HealthStatus.SICK ? 'bg-red-100 text-red-600' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {item.healthStatus === HealthStatus.HEALTHY ? <CheckCircleIcon className="w-4 h-4" /> :
                   item.healthStatus === HealthStatus.SICK ? <AlertIcon className="w-4 h-4" /> :
                   <LeafIcon className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">{item.commonName}</h3>
                  <p className="text-xs text-gray-500">{new Date(item.timestamp).toLocaleDateString()}</p>
                  <p className={`text-xs mt-1 font-medium ${
                    item.healthStatus === HealthStatus.HEALTHY ? 'text-green-600' :
                    item.healthStatus === HealthStatus.SICK ? 'text-red-500' :
                    'text-gray-500'
                  }`}>
                    {t(item.healthStatus as unknown as TranslationKey)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
};

export default HistorySidebar;
