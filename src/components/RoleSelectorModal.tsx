/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Briefcase, Building2, Globe, Users } from 'lucide-react';
import { Language } from '../types';
import { motion } from 'motion/react';

interface RoleSelectorModalProps {
  currentLanguage: Language;
  onLanguageToggle: () => void;
  onSelectRole: (role: 'seeker' | 'provider') => void;
  isOpen: boolean;
}

export default function RoleSelectorModal({
  currentLanguage,
  onLanguageToggle,
  onSelectRole,
  isOpen
}: RoleSelectorModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/45 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="w-full max-w-lg bg-white rounded-2xl shadow-xl border-2 border-orange-100 overflow-hidden"
        id="role-selector-modal"
      >
        {/* Banner header with language switcher */}
        <div className="p-6 bg-orange-600 text-white flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-white text-orange-600 p-2 rounded-lg font-black text-xl tracking-tight shadow-xs">
              NAJ
            </div>
            <div>
              <span className="font-sans font-black text-white text-lg tracking-tight block leading-none">
                {currentLanguage === 'en' ? 'Namma Area Job' : 'நம்ம ஏரியா ஜாப்'}
              </span>
              <span className="block text-[10px] text-orange-200 font-mono font-bold tracking-wider uppercase mt-1">
                {currentLanguage === 'en' ? 'CHENNAI HYPERLOCAL' : 'சென்னை உள்ளூர் தளம்'}
              </span>
            </div>
          </div>
          
          {/* Language Switch Button */}
          <button
            onClick={onLanguageToggle}
            id="toggle-lang-role"
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-orange-700/60 hover:bg-orange-700 text-xs font-bold text-white transition-all cursor-pointer border border-orange-500/30 shadow-xs"
          >
            <Globe className="w-3.5 h-3.5 text-orange-200" />
            {currentLanguage === 'en' ? 'தமிழ்' : 'English'}
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 text-center sm:text-left">
          <div className="mb-6">
            <h2 className="text-xl font-black text-slate-800 font-sans tracking-tight mb-2">
              {currentLanguage === 'en' ? 'Welcome! Tell us who you are' : 'வரவேற்கிறோம்! நீங்கள் யார் என்று கூறுங்கள்'}
            </h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              {currentLanguage === 'en' 
                ? 'To help customize your experience, please choose one of the options below:' 
                : 'உங்களுக்கு ஏற்றவாறு தளம் இயங்க கீழே உள்ள ஒரு விருப்பத்தைத் தேர்ந்தெடுக்கவும்:'}
            </p>
          </div>

          <div className="space-y-4">
            {/* Option A: Job Seeker */}
            <button
              onClick={() => onSelectRole('seeker')}
              id="role-btn-seeker"
              className="w-full flex flex-col sm:flex-row items-center sm:items-start gap-4 p-5 bg-slate-50 hover:bg-orange-50/50 hover:border-orange-200 border-2 border-slate-150 rounded-2xl transition-all cursor-pointer group text-center sm:text-left"
            >
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-100 transition-colors shrink-0">
                <Briefcase className="w-6 h-6" />
              </div>
              <div>
                <span className="block text-base font-black text-slate-800 font-sans group-hover:text-orange-950">
                  {currentLanguage === 'en' ? 'I am a Job Seeker' : 'நான் வேலை தேடுகிறேன்'}
                </span>
                <span className="block text-xs text-slate-500 mt-1 leading-relaxed">
                  {currentLanguage === 'en' 
                    ? 'I want to browse and apply for local shop jobs and office work close to home.' 
                    : 'எனது வீட்டின் அருகே உள்ள கடைகள் மற்றும் அலுவலகங்களில் உள்ள வேலைகளைத் தேட விரும்புகிறேன்.'}
                </span>
              </div>
            </button>

            {/* Option B: Job Provider */}
            <button
              onClick={() => onSelectRole('provider')}
              id="role-btn-provider"
              className="w-full flex flex-col sm:flex-row items-center sm:items-start gap-4 p-5 bg-slate-50 hover:bg-orange-50/50 hover:border-orange-200 border-2 border-slate-150 rounded-2xl transition-all cursor-pointer group text-center sm:text-left"
            >
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-100 transition-colors shrink-0">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <span className="block text-base font-black text-slate-800 font-sans group-hover:text-orange-950">
                  {currentLanguage === 'en' ? 'I am a Job Provider / Shop Owner' : 'நான் வேலை தரும் கடை உரிமையாளர்'}
                </span>
                <span className="block text-xs text-slate-500 mt-1 leading-relaxed">
                  {currentLanguage === 'en' 
                    ? 'I want to post a free vacancy to hire staff for my shop, hotel or supermarket.' 
                    : 'எனது கடை, ஹோட்டல் அல்லது சூப்பர் மார்க்கெட்டிற்கு இலவசமாக வேலை விளம்பரம் செய்ய விரும்புகிறேன்.'}
                </span>
              </div>
            </button>
          </div>

          {/* Footer note */}
          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-center gap-1.5 text-center text-[11px] text-slate-400 font-semibold font-sans">
            <Users className="w-3.5 h-3.5 text-slate-300" />
            <span>
              {currentLanguage === 'en' 
                ? 'You can easily switch roles at any time inside the app.' 
                : 'நீங்கள் எப்போது வேண்டுமானாலும் இந்த அமைப்பை மாற்றிக்கொள்ளலாம்.'}
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
