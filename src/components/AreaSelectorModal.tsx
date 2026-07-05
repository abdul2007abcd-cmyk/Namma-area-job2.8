/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { MapPin, Search, Globe, Building } from 'lucide-react';
import { Language } from '../types';
import { translations, AREA_MAPPINGS } from '../translations';
import { motion } from 'motion/react';

interface AreaSelectorModalProps {
  currentLanguage: Language;
  onLanguageToggle: () => void;
  onSelectArea: (area: string) => void;
  isOpen: boolean;
  onClose?: () => void;
  isOnboarding: boolean;
}

const POPULAR_AREAS = [
  'Velachery',
  'Anna Nagar',
  'T Nagar',
  'Adyar',
  'Mylapore',
  'Tambaram',
  'Guindy',
  'Nungambakkam',
  'Saidapet',
  'Porur',
  'Vadapalani',
  'Chromepet'
];

export default function AreaSelectorModal({
  currentLanguage,
  onLanguageToggle,
  onSelectArea,
  isOpen,
  onClose,
  isOnboarding
}: AreaSelectorModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const t = translations[currentLanguage];

  if (!isOpen) return null;

  const filteredAreas = POPULAR_AREAS.filter(area => {
    const areaInTamil = AREA_MAPPINGS[area] || '';
    return (
      area.toLowerCase().includes(searchQuery.toLowerCase()) ||
      areaInTamil.includes(searchQuery)
    );
  });

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Capitalize first letter of custom input
      const formatted = searchQuery.trim().charAt(0).toUpperCase() + searchQuery.trim().slice(1);
      onSelectArea(formatted);
    }
  };

  const content = (
    <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border-2 border-orange-100 overflow-hidden">
      {/* Header section with language toggle */}
      <div className="p-6 bg-orange-600 text-white flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="bg-white text-orange-600 p-2 rounded-lg font-black text-xl tracking-tight shadow-xs">
            NAJ
          </div>
          <div>
            <span className="font-sans font-black text-white text-lg tracking-tight block leading-none">
              {t.brandName}
            </span>
            <span className="block text-[10px] text-orange-200 font-mono font-bold tracking-wider uppercase mt-1">
              CHENNAI
            </span>
          </div>
        </div>
        
        {/* Language switch button */}
        <button
          onClick={onLanguageToggle}
          id="toggle-lang-onboarding"
          className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-orange-700/60 hover:bg-orange-700 text-xs font-bold text-white transition-all cursor-pointer border border-orange-500/30 shadow-xs"
        >
          <Globe className="w-3.5 h-3.5 text-orange-200" />
          {currentLanguage === 'en' ? 'தமிழ்' : 'English'}
        </button>
      </div>

      <div className="p-6">
        <h2 className="text-xl font-black text-slate-800 font-sans tracking-tight mb-1 text-center md:text-left">
          {t.welcomeTitle}
        </h2>
        <p className="text-sm text-slate-500 leading-relaxed mb-6 text-center md:text-left">
          {t.welcomeSubtitle}
        </p>

        {/* Custom area text field input */}
        <form onSubmit={handleCustomSubmit} className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.enterAreaPlaceholder}
              className="w-full pl-11 pr-28 py-3.5 bg-slate-50 border-2 border-slate-200 focus:border-orange-500 focus:bg-white rounded-xl font-sans text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden transition-all"
              id="area-onboarding-input"
              autoFocus={isOnboarding}
            />
            {searchQuery.trim() && (
              <button
                type="submit"
                id="submit-custom-area-btn"
                className="absolute right-2 top-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-sans text-xs font-bold transition-all cursor-pointer shadow-xs"
              >
                {t.setAreaButton}
              </button>
            )}
          </div>
        </form>

        {/* Grid of popular neighborhoods */}
        <div className="mb-4">
          <p className="text-xs font-bold text-slate-400 font-sans tracking-wider uppercase mb-3">
            {t.suggestedAreas}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {filteredAreas.map((area) => {
              const displayTamil = AREA_MAPPINGS[area];
              return (
                <button
                  key={area}
                  onClick={() => onSelectArea(area)}
                  id={`area-btn-${area.toLowerCase().replace(/\s+/g, '-')}`}
                  className="flex items-center gap-2 p-3 text-left bg-slate-50 hover:bg-orange-50 border-2 border-slate-150 hover:border-orange-200 rounded-xl transition-all cursor-pointer group"
                >
                  <MapPin className="w-4 h-4 text-slate-400 group-hover:text-orange-500 transition-colors shrink-0" />
                  <div className="min-w-0">
                    <span className="block text-xs font-bold text-slate-800 truncate group-hover:text-orange-900 font-sans">
                      {area}
                    </span>
                    {displayTamil && (
                      <span className="block text-[10px] text-slate-400 truncate group-hover:text-orange-700">
                        {displayTamil}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Show a helper when search yields no popular results */}
          {filteredAreas.length === 0 && (
            <div className="text-center py-6 text-slate-400 text-xs font-medium">
              Press Enter or tap "Find Jobs" to use your custom area typing: <span className="font-bold text-orange-600">"{searchQuery}"</span>
            </div>
          )}
        </div>

        {/* Option to show all areas / bypass */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex justify-between items-center">
          <button
            onClick={() => onSelectArea('All')}
            id="browse-all-areas-onboarding"
            className="text-xs font-bold text-orange-600 hover:text-orange-700 font-sans cursor-pointer flex items-center gap-1"
          >
            🗺️ {t.allAreas}
          </button>
          
          {!isOnboarding && onClose && (
            <button
              onClick={onClose}
              id="close-area-modal"
              className="text-xs font-bold text-slate-400 hover:text-slate-600 font-sans cursor-pointer"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );

  if (isOnboarding) {
    return (
      <div className="fixed inset-0 z-50 bg-gray-900/40 backdrop-blur-md flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="w-full flex justify-center"
        >
          {content}
        </motion.div>
      </div>
    );
  }

  // Regular overlay modal
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="absolute inset-0" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full flex justify-center z-10"
      >
        {content}
      </motion.div>
    </div>
  );
}
