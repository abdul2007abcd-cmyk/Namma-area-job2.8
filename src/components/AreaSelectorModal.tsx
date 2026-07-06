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
    <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[90vh]">
      {/* Header section with language toggle */}
      <div className="px-5 py-3.5 bg-linear-to-r from-orange-600 to-amber-500 text-white flex justify-between items-center shrink-0 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-white text-orange-600 w-8 h-8 rounded-xl font-sans font-black text-sm flex items-center justify-center tracking-tight shadow-md">
            NAJ
          </div>
          <div>
            <span className="font-sans font-black text-white text-base tracking-tight block leading-none">
              {t.brandName}
            </span>
            <span className="block text-[9px] text-orange-100 font-mono font-bold tracking-wider uppercase mt-0.5">
              CHENNAI
            </span>
          </div>
        </div>
        
        {/* Language switch button */}
        <button
          onClick={onLanguageToggle}
          id="toggle-lang-onboarding"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 text-xs font-bold text-white transition-all cursor-pointer border border-white/10 shadow-xs"
        >
          <Globe className="w-3.5 h-3.5 text-orange-100" />
          {currentLanguage === 'en' ? 'தமிழ்' : 'English'}
        </button>
      </div>

      {/* Scrollable Container for Form and Grid */}
      <div className="p-5 overflow-y-auto flex-1 space-y-5 scrollbar-thin">
        <div className="text-center sm:text-left">
          <h2 className="text-lg font-black text-slate-800 font-sans tracking-tight mb-1">
            {t.welcomeTitle}
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            {t.welcomeSubtitle}
          </p>
        </div>

        {/* Custom area text field input */}
        <form onSubmit={handleCustomSubmit} className="relative">
          <div className="relative group">
            <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.enterAreaPlaceholder}
              className="w-full pl-10 pr-24 py-3 bg-slate-50 hover:bg-slate-50/80 focus:bg-white border border-slate-200 focus:border-orange-500 rounded-2xl font-sans text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden transition-all shadow-xs"
              id="area-onboarding-input"
              autoFocus={isOnboarding}
            />
            {searchQuery.trim() && (
              <button
                type="submit"
                id="submit-custom-area-btn"
                className="absolute right-1.5 top-1.5 bottom-1.5 px-3.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-sans text-xs font-black transition-all cursor-pointer shadow-xs active:scale-95"
              >
                {t.setAreaButton}
              </button>
            )}
          </div>
        </form>

        {/* Grid of popular neighborhoods */}
        <div>
          <p className="text-[10px] font-black text-slate-400 font-sans tracking-wider uppercase mb-3">
            {t.suggestedAreas}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {filteredAreas.map((area) => {
              const displayTamil = AREA_MAPPINGS[area];
              return (
                <button
                  key={area}
                  onClick={() => onSelectArea(area)}
                  id={`area-btn-${area.toLowerCase().replace(/\s+/g, '-')}`}
                  className="flex items-center gap-2 px-3 py-2.5 text-left bg-slate-50/50 hover:bg-orange-50/60 border border-slate-150 hover:border-orange-300 rounded-2xl transition-all cursor-pointer group active:scale-[0.98] min-h-[48px]"
                >
                  <MapPin className="w-4 h-4 text-slate-400 group-hover:text-orange-500 transition-colors shrink-0" />
                  <div className="min-w-0">
                    <span className="block text-xs font-extrabold text-slate-800 leading-tight group-hover:text-orange-900 font-sans">
                      {area}
                    </span>
                    {displayTamil && (
                      <span className="block text-[10px] font-semibold text-slate-400 group-hover:text-orange-700 leading-none mt-0.5">
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
        <div className="pt-4 border-t border-slate-100 flex justify-between items-center shrink-0">
          <button
            onClick={() => onSelectArea('All')}
            id="browse-all-areas-onboarding"
            className="text-xs font-black text-orange-600 hover:text-orange-700 font-sans cursor-pointer flex items-center gap-1 active:scale-95 transition-transform"
          >
            🗺️ {t.allAreas}
          </button>
          
          {!isOnboarding && onClose && (
            <button
              onClick={onClose}
              id="close-area-modal"
              className="text-xs font-black text-slate-400 hover:text-slate-600 font-sans cursor-pointer active:scale-95 transition-transform"
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
