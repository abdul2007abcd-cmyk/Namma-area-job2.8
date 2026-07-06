/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from 'react';
import {
  MapPin,
  Search,
  Globe,
  PlusCircle,
  Briefcase,
  Building2,
  AlertCircle,
  HelpCircle,
  RotateCcw,
  Sparkles,
  ChevronRight,
  Map,
  X,
  Database,
  Copy,
  Check,
  RefreshCw
} from 'lucide-react';
import { Job, Language } from './types';
import { translations, CATEGORIES, AREA_MAPPINGS } from './translations';
import { SEED_JOBS } from './data/seedJobs';
import AreaSelectorModal from './components/AreaSelectorModal';
import JobCard from './components/JobCard';
import JobForm from './components/JobForm';
import { motion, AnimatePresence } from 'motion/react';
// Local storage based job notices board



// Sanitization helper to protect against Cross-Site Scripting (XSS) stored payloads
function sanitizeInput(text: string): string {
  if (!text) return '';
  return text
    .replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, '') // Remove script blocks
    .replace(/<[^>]*>/g, '') // Strip all HTML tags
    .replace(/javascript:/gi, '') // Block Javascript link injections
    .replace(/on\w+\s*=/gi, '') // Block Event handler attributes
    .trim();
}

export default function App() {
  // --- STATE ---
  const [selectedArea, setSelectedArea] = useState<string>(() => {
    return localStorage.getItem('namma-area-job-area') || 'All';
  });

  const [currentLanguage, setCurrentLanguage] = useState<Language>(() => {
    const savedLang = localStorage.getItem('namma-area-job-lang');
    return (savedLang === 'en' || savedLang === 'ta') ? savedLang : 'en';
  });

  const [userRole, setUserRole] = useState<'seeker' | 'provider' | null>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlRole = params.get('role');
      if (urlRole === 'provider' || urlRole === 'owner') {
        return 'provider';
      }
      if (urlRole === 'seeker') {
        return 'seeker';
      }
    } catch (e) {
      console.warn('URL parsing failed:', e);
    }
    const savedRole = localStorage.getItem('namma-area-user-role');
    if (savedRole === 'provider') return 'provider';
    if (savedRole === 'seeker') return 'seeker';
    return null;
  });

  const [activeTab, setActiveTab] = useState<'browse' | 'post'>('browse');
  const [providerSubTab, setProviderSubTab] = useState<'post' | 'my-listings'>('post');
  const [myPostedIds, setMyPostedIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('namma-area-posted-jobs') || '[]');
    } catch {
      return [];
    }
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showAreaModal, setShowAreaModal] = useState(false);

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const [sqlHelp, setSqlHelp] = useState<string | null>(null);
  const [showSqlGuide, setShowSqlGuide] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  // Load and clean up jobs on mount
  useEffect(() => {
    async function initJobs() {
      setLoading(true);
      try {
        const response = await fetch('/api/jobs');
        if (!response.ok) {
          throw new Error('Backend failed to load jobs');
        }
        const resData = await response.json();
        const data = resData.jobs || [];

        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const validJobs = data.filter((job: any) => new Date(job.postedAt).getTime() >= sevenDaysAgo);

        setJobs(validJobs.length > 0 ? validJobs : SEED_JOBS);
        setUsingFallback(resData.usingFallback || false);
        setDbError(resData.error || null);
        setSqlHelp(resData.sqlHelp || null);

        // Safely trigger background cleanup via backend Express router
        fetch('/api/jobs/cleanup', { method: 'POST' }).catch((err) => {
          console.warn('Background cleanup trigger failed:', err);
        });
      } catch (error) {
        console.log('Database synchronization fallback.', error);
        setJobs(SEED_JOBS);
        setUsingFallback(true);
        setDbError(error instanceof Error ? error.message : String(error));
      } finally {
        setLoading(false);
      }
    }
    initJobs();
  }, []);

  const handleSelectRole = (role: 'seeker' | 'provider') => {
    setUserRole(role);
    localStorage.setItem('namma-area-user-role', role);
    if (role === 'seeker') {
      setActiveTab('browse');
    } else {
      setActiveTab('post');
      setProviderSubTab('post');
    }
  };

  const handleSelectArea = (area: string) => {
    setSelectedArea(area);
    localStorage.setItem('namma-area-job-area', area);
    setShowAreaModal(false);
  };

  const handleLanguageToggle = () => {
    const nextLang: Language = currentLanguage === 'en' ? 'ta' : 'en';
    setCurrentLanguage(nextLang);
    localStorage.setItem('namma-area-job-lang', nextLang);
  };

  // Delete option has been disabled and posts are automatically removed after 7 days

  const handleAddJob = async (newJobData: Omit<Job, 'id' | 'postedAt' | 'isCustom'>) => {
    try {
      // Clean inputs on frontend before submission (defense in depth)
      const sanitizedJobData = {
        businessName: sanitizeInput(newJobData.businessName),
        role: sanitizeInput(newJobData.role),
        category: sanitizeInput(newJobData.category),
        salary: sanitizeInput(newJobData.salary),
        area: sanitizeInput(newJobData.area),
        location: sanitizeInput(newJobData.location || newJobData.area),
        contactNumber: newJobData.contactNumber.replace(/\D/g, ''),
        description: sanitizeInput(newJobData.description)
      };

      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sanitizedJobData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save job');
      }

      const resData = await response.json();
      const savedJob = resData.job;
      
      if (savedJob) {
        setJobs((prev) => [savedJob, ...prev]);
        const updatedIds = [...myPostedIds, savedJob.id];
        setMyPostedIds(updatedIds);
        localStorage.setItem('namma-area-posted-jobs', JSON.stringify(updatedIds));
      }
      
      // Successfully published! Stay on provider tab but view listings
      setProviderSubTab('my-listings');
      setSearchQuery(''); // Reset search
      setSelectedCategory('all'); // Reset filters
    } catch (error) {
      console.log('Syncing post action offline.', error);
      alert(currentLanguage === 'en' 
        ? `Failed to publish job vacancy: ${error instanceof Error ? error.message : 'Please check your connection.'}` 
        : `விளம்பரத்தை வெளியிட முடியவில்லை: ${error instanceof Error ? error.message : 'தயவுசெய்து மீண்டும் முயலவும்.'}`
      );
    }
  };

  const handleResetApp = async () => {
    if (confirm(currentLanguage === 'en' ? 'Reload and refresh all job listings from the cloud database?' : 'மேகக்கணி தரவுத்தளத்திலிருந்து அனைத்து வேலைகளையும் புதுப்பிக்கவா?')) {
      setLoading(true);
      try {
        const response = await fetch('/api/jobs');
        if (!response.ok) {
          throw new Error('Backend failed to load jobs');
        }
        const resData = await response.json();
        const data = resData.jobs || [];

        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const validJobs = data.filter((job: any) => new Date(job.postedAt).getTime() >= sevenDaysAgo);

        setJobs(validJobs.length > 0 ? validJobs : SEED_JOBS);
        setUsingFallback(resData.usingFallback || false);
        setActiveTab('browse');

        // Trigger safe backend cleanup
        fetch('/api/jobs/cleanup', { method: 'POST' }).catch((err) => {
          console.warn('Background cleanup trigger failed:', err);
        });
      } catch (error) {
        console.log('Syncing reload action offline.', error);
        setUsingFallback(true);
        setJobs(SEED_JOBS);
      } finally {
        setLoading(false);
      }
    }
  };


  // --- DERIVED TRANS-DATA ---
  const t = translations[currentLanguage];
  const categories = CATEGORIES[currentLanguage];

  const getRemainingTime = (postedAtStr: string, lang: Language) => {
    const postedTime = new Date(postedAtStr).getTime();
    const expiryTime = postedTime + 7 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    const diff = expiryTime - now;

    if (diff <= 0) {
      return lang === 'en' ? 'Expired' : 'காலாவதியானது';
    }

    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));

    if (days > 0) {
      return lang === 'en' 
        ? `${days}d ${hours}h left` 
        : `இன்னும் ${days}நாட்கள் ${hours}ம`;
    }
    return lang === 'en' 
      ? `${hours}h left` 
      : `இன்னும் ${hours}ம`;
  };

  const myActiveListings = useMemo(() => {
    return jobs.filter((j) => myPostedIds.includes(j.id));
  }, [jobs, myPostedIds]);

  // Area and Category filter and sorting logic
  const filteredAndSortedJobs = useMemo(() => {
    // 1. Filter by category
    let list = jobs;
    if (selectedCategory !== 'all') {
      list = list.filter((j) => j.category === selectedCategory);
    }

    // 2. Filter by selected area (if not 'All' or empty)
    if (selectedArea && selectedArea !== 'All') {
      const areaLower = selectedArea.toLowerCase();
      list = list.filter((j) => j.area.toLowerCase() === areaLower);
    }

    // 3. Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (j) =>
          j.businessName.toLowerCase().includes(q) ||
          j.role.toLowerCase().includes(q) ||
          j.area.toLowerCase().includes(q) ||
          (AREA_MAPPINGS[j.area] && AREA_MAPPINGS[j.area].toLowerCase().includes(q)) ||
          j.description.toLowerCase().includes(q)
      );
    }

    // 4. Sort by date (newest first)
    return [...list].sort((a, b) => {
      return new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime();
    });
  }, [jobs, selectedCategory, searchQuery, selectedArea]);

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col justify-between" id="namma-area-app-root">
          {/* ========================================== */}
          {/* 0. LANDING ROLE SELECTION SCREEN          */}
          {/* ========================================== */}
          {userRole === null && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="flex-grow flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full"
            >
              {/* Header inside landing */}
              <div className="flex flex-col items-center text-center space-y-6">
                {/* Language Switch */}
                <div className="w-full flex justify-end">
                  <button
                    onClick={handleLanguageToggle}
                    id="landing-lang-toggle"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 rounded-xl border border-slate-200 text-xs font-bold transition-all cursor-pointer shadow-xs"
                  >
                    <Globe className="w-4 h-4 text-blue-600" />
                    <span>{currentLanguage === 'en' ? 'தமிழ்' : 'English'}</span>
                  </button>
                </div>

                {/* Big Logo */}
                <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center text-white font-black shadow-md relative overflow-hidden">
                  <span className="text-4xl font-black select-none">ந</span>
                  {/* Subtle accent light */}
                  <div className="absolute top-0 right-0 w-8 h-8 bg-white/20 rounded-full blur-xs pointer-events-none" />
                </div>

                <div className="space-y-2">
                  <h1 className="font-sans font-black text-3xl sm:text-4xl text-slate-800 tracking-tight leading-none">
                    {currentLanguage === 'en' ? 'Namma Area Job' : 'நம்ம ஏரியா ஜாப்'}
                  </h1>
                  <p className="text-sm text-slate-500 font-sans font-medium tracking-wide max-w-md mx-auto">
                    {currentLanguage === 'en' 
                      ? 'Local shop & office jobs in your Chennai neighborhood. Direct connection, zero agents, 100% free!'
                      : 'உங்க சென்னை ஏரியாவில் உள்ள உள்ளூர் வேலைகள். இடைத்தரகர்கள் இல்லாமல் நேரடியாகத் தொடர்பு கொள்ளலாம்!'}
                  </p>
                </div>
              </div>

              {/* Roles Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
                {/* Card 1: Job Seeker */}
                <div 
                  className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-slate-150 hover:border-blue-500 transition-all duration-300 shadow-xs hover:shadow-sm flex flex-col justify-between space-y-6 group relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-3xl group-hover:bg-blue-100/50 transition-all pointer-events-none" />
                  
                  <div className="space-y-4 relative z-10">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center font-black text-xl shadow-xs group-hover:scale-110 transition-transform">
                      <Briefcase className="w-6 h-6" />
                    </div>
                    
                    <div className="space-y-1">
                      <h2 className="text-xl font-black text-slate-800 font-sans tracking-tight">
                        {currentLanguage === 'en' ? 'Job Seeker' : 'வேலை தேடுபவர்'}
                      </h2>
                      <p className="text-xs text-slate-500 font-sans font-medium leading-relaxed">
                        {currentLanguage === 'en' 
                          ? 'Are you looking for work in Chennai shops, hotels, offices, or supermarkets close to your home?'
                          : 'உங்கள் வீட்டின் அருகே உள்ள கடைகள், ஹோட்டல்கள் அல்லது அலுவலகங்களில் வேலை தேடுகிறீர்களா?'}
                      </p>
                    </div>

                    <ul className="space-y-2 text-xs font-bold text-slate-600 pt-2">
                      <li className="flex items-center gap-2">
                        <span className="text-blue-500 text-sm">✓</span>
                        <span>{currentLanguage === 'en' ? '100% Free - No fees' : '100% இலவசம் - கட்டணங்கள் இல்லை'}</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-blue-500 text-sm">✓</span>
                        <span>{currentLanguage === 'en' ? 'Direct Mobile & WhatsApp' : 'நேரடி கைப்பேசி & வாட்ஸ்அப்'}</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-blue-500 text-sm">✓</span>
                        <span>{currentLanguage === 'en' ? 'Filter by your specific area' : 'உங்கள் பகுதியைத் தேர்ந்தெடுத்துத் தேடலாம்'}</span>
                      </li>
                    </ul>
                  </div>

                  <button
                    onClick={() => handleSelectRole('seeker')}
                    id="landing-select-seeker-btn"
                    className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-sans font-black text-xs uppercase tracking-wider rounded-2xl cursor-pointer active:scale-95 transition-all shadow-md flex items-center justify-center gap-2 group-hover:shadow-lg relative z-10"
                  >
                    <span>{currentLanguage === 'en' ? 'Find Jobs Directly' : 'நேரடியாக வேலைகளைத் தேடு'}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Card 2: Business / Shop Owner */}
                <div 
                  className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-slate-150 hover:border-emerald-500 transition-all duration-300 shadow-xs hover:shadow-sm flex flex-col justify-between space-y-6 group relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-3xl group-hover:bg-emerald-100/50 transition-all pointer-events-none" />
                  
                  <div className="space-y-4 relative z-10">
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center font-black text-xl shadow-xs group-hover:scale-110 transition-transform">
                      <Building2 className="w-6 h-6" />
                    </div>
                    
                    <div className="space-y-1">
                      <h2 className="text-xl font-black text-slate-800 font-sans tracking-tight">
                        {currentLanguage === 'en' ? 'Business / Shop Owner' : 'கடை / நிறுவன உரிமையாளர்'}
                      </h2>
                      <p className="text-xs text-slate-500 font-sans font-medium leading-relaxed">
                        {currentLanguage === 'en' 
                          ? 'Need helper staff, delivery boys, sales girls, or kitchen helpers for your local Chennai business?'
                          : 'உங்கள் கடை, அலுவலகம் அல்லது நிறுவனத்திற்கு ஆட்கள் (உதவியாளர்கள், டெலிவரி பாய்ஸ், விற்பனையாளர்கள்) தேவையா?'}
                      </p>
                    </div>

                    <ul className="space-y-2 text-xs font-bold text-slate-600 pt-2">
                      <li className="flex items-center gap-2">
                        <span className="text-emerald-500 text-sm">✓</span>
                        <span>{currentLanguage === 'en' ? 'Post vacancy in 1 minute' : '1 நிமிடத்தில் விளம்பரத்தைப் போஸ்ட் செய்யலாம்'}</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-emerald-500 text-sm">✓</span>
                        <span>{currentLanguage === 'en' ? 'No account / No login required' : 'லாகின் அல்லது கணக்கு எதுவும் தேவையில்லை'}</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-emerald-500 text-sm">✓</span>
                        <span>{currentLanguage === 'en' ? 'Get direct phone calls' : 'விண்ணப்பதாரர்களின் நேரடி அழைப்புகள்'}</span>
                      </li>
                    </ul>
                  </div>

                  <button
                    onClick={() => handleSelectRole('provider')}
                    id="landing-select-provider-btn"
                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-sans font-black text-xs uppercase tracking-wider rounded-2xl cursor-pointer active:scale-95 transition-all shadow-md flex items-center justify-center gap-2 group-hover:shadow-lg relative z-10"
                  >
                    <span>{currentLanguage === 'en' ? 'Post a Job Vacancy' : 'வேலைவாய்ப்பை உடனே போஸ்ட் செய்'}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Sub-note */}
              <p className="text-[10px] text-slate-400 text-center font-bold font-sans mt-8 uppercase tracking-wide">
                📍 {currentLanguage === 'en' ? 'A Local Community Platform for Chennai Neighborhoods' : 'சென்னை மக்களுக்கான பிரத்யேக உள்ளூர் தளம்'}
              </p>
            </motion.div>
          )}

          {/* ========================================== */}
          {/* 1. JOB SEEKER PORTAL                       */}
          {/* ========================================== */}
          {userRole === 'seeker' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="flex-grow flex flex-col"
            >
              {/* Seeker Header */}
              <header className="sticky top-0 z-40 bg-white border-b-2 border-slate-100 shadow-xs">
                <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
                  {/* Brand Logo */}
                  <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setSelectedCategory('all')}>
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black shadow-xs">
                      <span className="text-xl font-black">ந</span>
                    </div>
                    <div>
                      <h1 className="font-sans font-black text-lg text-slate-800 tracking-tight leading-none">
                        {t.brandName}
                      </h1>
                    </div>
                  </div>

                  {/* Top Controls */}
                  <div className="flex items-center gap-1.5">
                    {/* Area Select Button */}
                    <button
                      onClick={() => setShowAreaModal(true)}
                      id="header-change-area-btn"
                      className="flex items-center gap-1 px-2 py-2 bg-blue-50 hover:bg-blue-100 text-blue-900 rounded-xl border-2 border-blue-200 text-[10px] sm:text-xs font-black transition-all cursor-pointer shadow-xs max-w-[90px] sm:max-w-none truncate shrink-0"
                    >
                      <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span className="truncate">
                        {selectedArea === 'All'
                          ? t.allAreas
                          : currentLanguage === 'en'
                          ? selectedArea
                          : AREA_MAPPINGS[selectedArea] || selectedArea}
                      </span>
                    </button>

                    {/* Lang Toggle */}
                    <button
                      onClick={handleLanguageToggle}
                      id="header-lang-toggle"
                      className="flex items-center justify-center w-9 h-9 rounded-xl bg-slate-50 border-2 border-slate-200 hover:bg-slate-100 text-slate-700 transition-all cursor-pointer shadow-xs shrink-0"
                      title={currentLanguage === 'en' ? 'Switch to Tamil' : 'ஆங்கிலத்திற்கு மாறவும்'}
                    >
                      <Globe className="w-4 h-4 text-blue-600" />
                    </button>
                  </div>
                </div>
              </header>

              {/* Seeker Community Notice bar */}
              <section className="bg-blue-600 text-white py-2 px-4 text-center shadow-xs">
                <div className="max-w-4xl mx-auto flex items-center justify-center gap-2">
                  <span className="text-xs font-black tracking-wide leading-relaxed font-sans uppercase">
                    📢 {currentLanguage === 'en' ? 'Find your local job directly with zero agent commission!' : 'ஏஜென்ட் கமிஷன் இல்லாமல் உங்கள் பகுதியிலேயே நேரடியாக வேலை தேடுங்கள்!'}
                  </span>
                </div>
              </section>

              {/* Seeker Main Body */}
              <main className="max-w-4xl mx-auto px-4 py-6 flex-grow w-full space-y-6">
                {/* Hero Greeting card */}
                <div className="bg-linear-to-r from-blue-50 to-indigo-50 border-2 border-blue-100 p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="space-y-1 text-center md:text-left">
                    <h2 className="text-2xl font-black text-slate-800 font-sans tracking-tight">
                      {selectedArea === 'All' 
                        ? (currentLanguage === 'en' ? 'All Active Chennai Vacancies' : 'சென்னை முழுவதும் உள்ள வேலைகள்')
                        : (currentLanguage === 'en' ? `Vacancies in ${selectedArea} & Surrounding` : `${AREA_MAPPINGS[selectedArea] || selectedArea} பகுதியின் வேலைகள்`)}
                    </h2>
                    <p className="text-xs text-slate-500 font-sans font-bold leading-relaxed">
                      {t.tagline} • {currentLanguage === 'en' ? 'No logins required' : 'லாகின் தேவையில்லை'}
                    </p>
                  </div>
                  <div className="px-4 py-2 bg-white rounded-2xl border-2 border-blue-100/50 text-center shadow-xs shrink-0">
                    <span className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">
                      {currentLanguage === 'en' ? 'Active Listings' : 'மொத்த விளம்பரங்கள்'}
                    </span>
                    <span className="text-xl font-black text-blue-600 font-mono">
                      {filteredAndSortedJobs.length}
                    </span>
                  </div>
                </div>

                {/* Filter and Search Panel */}
                <div className="bg-white p-4 rounded-2xl border-2 border-slate-100 shadow-sm space-y-4">
                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={t.searchPlaceholder}
                      className="w-full pl-10 pr-10 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl font-sans text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 focus:bg-white transition-all"
                      id="job-search-input"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3.5 top-3.5 p-0.5 rounded-full hover:bg-slate-150 text-slate-400 hover:text-slate-600"
                        title="Clear Search"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Category Chips */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs font-black text-slate-400 uppercase tracking-wider font-sans">
                      <span>{t.categoryLabel}</span>
                      {selectedCategory !== 'all' && (
                        <button
                          onClick={() => setSelectedCategory('all')}
                          id="clear-category-filter-btn"
                          className="text-[10px] text-blue-600 hover:text-blue-700 font-black cursor-pointer uppercase"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    
                    <div className="flex gap-2 overflow-x-auto pb-1.5 pt-0.5 no-scrollbar scroll-smooth">
                      {categories.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => setSelectedCategory(cat.id)}
                          id={`category-pill-${cat.id}`}
                          className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap border-2 transition-all cursor-pointer shrink-0 ${
                            selectedCategory === cat.id
                              ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                          }`}
                        >
                          {cat.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Counter & Action panel */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 px-1 text-xs text-slate-500 font-bold">
                  <div>
                    {selectedArea !== 'All' ? (
                      <span>
                        {currentLanguage === 'en' ? (
                          <>
                            Found <span className="font-black text-blue-600">{filteredAndSortedJobs.length}</span> {t.matchingJobs} in <span className="font-black text-slate-800">{selectedArea}</span>.
                          </>
                        ) : (
                          <>
                            {AREA_MAPPINGS[selectedArea] || selectedArea} பகுதியில் <span className="font-black text-blue-600">{filteredAndSortedJobs.length}</span> {t.matchingJobs} உள்ளன.
                          </>
                        )}
                      </span>
                    ) : (
                      <span>
                        {currentLanguage === 'en' ? (
                          <>Showing <span className="font-black text-blue-600">{filteredAndSortedJobs.length}</span> total Chennai vacancies.</>
                        ) : (
                          <>சென்னையில் உள்ள <span className="font-black text-blue-600">{filteredAndSortedJobs.length}</span> மொத்த வேலைகள் காட்டப்படுகின்றன.</>
                        )}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={handleResetApp}
                    id="reset-noticeboard-btn"
                    className="flex items-center gap-1 text-[10px] font-bold text-gray-400 hover:text-rose-500 transition-colors uppercase tracking-wider cursor-pointer font-sans"
                  >
                    <RotateCcw className="w-3 h-3" />
                    {currentLanguage === 'en' ? 'Reset Noticeboard' : 'அறிவிப்புகளை மீட்டமை'}
                  </button>
                </div>

                {/* Job Card Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="bg-white rounded-2xl border-2 border-slate-100 p-5 animate-pulse space-y-4">
                        <div className="flex justify-between items-center">
                          <div className="h-6 w-24 bg-slate-200 rounded-full"></div>
                          <div className="h-4 w-16 bg-slate-200 rounded"></div>
                        </div>
                        <div className="h-6 w-3/4 bg-slate-200 rounded"></div>
                        <div className="h-4 w-1/2 bg-slate-200 rounded"></div>
                        <div className="space-y-2">
                          <div className="h-4 w-full bg-slate-100 rounded"></div>
                          <div className="h-4 w-5/6 bg-slate-100 rounded"></div>
                        </div>
                        <div className="pt-4 border-t border-slate-100 flex gap-2">
                          <div className="h-10 flex-1 bg-slate-200 rounded-xl"></div>
                          <div className="h-10 flex-1 bg-slate-200 rounded-xl"></div>
                        </div>
                      </div>
                    ))
                  ) : (
                    filteredAndSortedJobs.map((job) => (
                      <JobCard
                        key={job.id}
                        job={job}
                        userArea={selectedArea}
                        currentLanguage={currentLanguage}
                      />
                    ))
                  )}
                </div>

                {/* Empty list handler */}
                {!loading && filteredAndSortedJobs.length === 0 && (
                  <div className="bg-white rounded-3xl p-12 border-2 border-slate-100 shadow-sm text-center space-y-4 max-w-md mx-auto" id="empty-results-banner">
                    <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-2 border-2 border-slate-100">
                      <AlertCircle className="w-8 h-8" />
                    </div>
                    <h3 className="text-base font-black text-slate-800 font-sans">
                      {currentLanguage === 'en' ? 'No Job Matches' : 'பொருத்தமான வேலைகள் இல்லை'}
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto font-medium">
                      {t.noJobsFound}
                    </p>
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedCategory('all');
                        setSelectedArea('All');
                      }}
                      id="clear-all-filters-btn"
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer shadow-xs"
                    >
                      {currentLanguage === 'en' ? 'Show All Chennai Jobs' : 'சென்னை முழுவதும் காட்டு'}
                    </button>
                  </div>
                )}

                {/* Help Tips section for candidate safety */}
                <div className="p-5 bg-blue-50/40 rounded-2xl border border-blue-100 space-y-2.5">
                  <h4 className="text-xs font-black uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                    💡 {currentLanguage === 'en' ? 'Job Seeker Safety & Guidelines' : 'வேலை தேடுபவர்களுக்கான வழிகாட்டுதல்கள்'}
                  </h4>
                  <ul className="text-xs font-medium text-slate-600 space-y-1.5 list-disc pl-4 leading-relaxed">
                    <li>{currentLanguage === 'en' ? 'Call shop owners politely and ask about work shifts.' : 'கடை உரிமையாளரை மரியாதையுடன் அழைத்து வேலை நேரங்களைப் பற்றி கேளுங்கள்.'}</li>
                    <li>{currentLanguage === 'en' ? 'Never pay money or deposits to get a job. Namma Area Job is 100% free.' : 'வேலைக்காக யாருக்கும் பணம் கொடுக்க வேண்டாம். நம்ம ஏரியா ஜாப் முற்றிலும் இலவசம்.'}</li>
                    <li>{currentLanguage === 'en' ? 'Double check land marks, salary details, and weekly holidays beforehand.' : 'வேலைக்குச் சேரும் முன் சம்பளம், விடுமுறை மற்றும் வேலை விவரங்களை தெளிவாகப் பேசிக் கொள்ளுங்கள்.'}</li>
                  </ul>
                </div>
              </main>
            </motion.div>
          )}

          {/* ========================================== */}
          {/* 2. SHOP OWNER PORTAL                       */}
          {/* ========================================== */}
          {userRole === 'provider' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="flex-grow flex flex-col"
            >
              {/* Owner Header */}
              <header className="sticky top-0 z-40 bg-white border-b-2 border-slate-100 shadow-xs">
                <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
                  {/* Brand Logo */}
                  <div className="flex items-center gap-2.5 cursor-pointer">
                    <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-black shadow-xs">
                      <span className="text-xl font-black">ந</span>
                    </div>
                    <div>
                      <h1 className="font-sans font-black text-lg text-slate-800 tracking-tight leading-none">
                        {t.brandName}
                      </h1>
                    </div>
                  </div>

                  {/* Top Controls */}
                  <div className="flex items-center gap-1.5">
                    {/* Language Switch */}
                    <button
                      onClick={handleLanguageToggle}
                      id="header-lang-toggle"
                      className="flex items-center justify-center w-9 h-9 rounded-xl bg-slate-50 border-2 border-slate-200 hover:bg-slate-100 text-slate-700 transition-all cursor-pointer shadow-xs shrink-0"
                      title={currentLanguage === 'en' ? 'Switch to Tamil' : 'ஆங்கிலத்திற்கு மாறவும்'}
                    >
                      <Globe className="w-4 h-4 text-emerald-600" />
                    </button>
                  </div>
                </div>
              </header>

              {/* Employer notice bar */}
              <section className="bg-emerald-600 text-white py-2 px-4 text-center shadow-xs">
                <div className="max-w-4xl mx-auto flex items-center justify-center gap-2">
                  <span className="text-xs font-black tracking-wide leading-relaxed font-sans uppercase">
                    📢 {currentLanguage === 'en' ? 'Recruit direct staff with zero commission or middleman charges!' : 'இடைத்தரகர் கட்டணம் இல்லாமல் உங்கள் கடைக்கான ஆட்களை இலவசமாகத் தேடுங்கள்!'}
                  </span>
                </div>
              </section>

              {/* Owner Main Body */}
              <main className="max-w-4xl mx-auto px-4 py-6 flex-grow w-full space-y-6">
                {/* Sub-tab Navigation for Shop Owners */}
                <div className="flex border-b border-slate-200">
                  <button
                    onClick={() => setProviderSubTab('post')}
                    id="provider-subtab-post"
                    className={`flex-1 py-3 text-center border-b-2 font-sans font-black text-xs uppercase tracking-wider transition-all cursor-pointer ${
                      providerSubTab === 'post'
                        ? 'border-emerald-600 text-emerald-700'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    📝 {currentLanguage === 'en' ? 'Post New Vacancy' : 'வேலை விளம்பரம் போடு'}
                  </button>
                  <button
                    onClick={() => setProviderSubTab('my-listings')}
                    id="provider-subtab-listings"
                    className={`flex-1 py-3 text-center border-b-2 font-sans font-black text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      providerSubTab === 'my-listings'
                        ? 'border-emerald-600 text-emerald-700'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    💼 {currentLanguage === 'en' ? 'My Shop Listings' : 'எனது விளம்பரங்கள்'}
                    <span className={`px-2 py-0.5 text-[10px] rounded-full font-black leading-none ${
                      providerSubTab === 'my-listings' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {myActiveListings.length}
                    </span>
                  </button>
                </div>

                {providerSubTab === 'post' && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Form col */}
                    <div className="lg:col-span-2">
                      <JobForm
                        currentLanguage={currentLanguage}
                        onAddJob={handleAddJob}
                        userArea={selectedArea}
                      />
                    </div>

                    {/* Info & wage guideline sidebar col */}
                    <div className="space-y-6">
                      {/* Wage Guidance Box */}
                      <div className="bg-white rounded-3xl p-6 border-2 border-slate-100 shadow-sm space-y-4">
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider font-sans border-b pb-2 border-slate-100">
                          💡 {currentLanguage === 'en' ? 'Salary Guidance (Chennai)' : 'சம்பள வழிகாட்டுதல் (சென்னை)'}
                        </h3>
                        <div className="space-y-3.5 text-xs font-bold font-sans">
                          <div className="flex justify-between items-center text-slate-600">
                            <span>🛒 Cashier / Sales</span>
                            <span className="text-emerald-600">₹12,000 - 18,000</span>
                          </div>
                          <div className="flex justify-between items-center text-slate-600">
                            <span>🛵 Delivery Boys</span>
                            <span className="text-emerald-600">₹15,000 - 20,000</span>
                          </div>
                          <div className="flex justify-between items-center text-slate-600">
                            <span>🍳 Kitchen Masters</span>
                            <span className="text-emerald-600">₹16,000 - 25,000</span>
                          </div>
                          <div className="flex justify-between items-center text-slate-600">
                            <span>👔 Office Assistants</span>
                            <span className="text-emerald-600">₹12,000 - 17,000</span>
                          </div>
                          <div className="flex justify-between items-center text-slate-600">
                            <span>🧹 Helper / Cleaning</span>
                            <span className="text-emerald-600">₹9,000 - 13,000</span>
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium leading-relaxed italic pt-1.5 border-t border-slate-50">
                          * Based on active listings in popular Chennai localities like Velachery and Anna Nagar.
                        </p>
                      </div>

                      {/* Tips for employers */}
                      <div className="bg-slate-900 text-slate-300 rounded-3xl p-6 space-y-4 shadow-md">
                        <h3 className="text-xs font-black uppercase text-emerald-400 tracking-wider">
                          🚀 {currentLanguage === 'en' ? 'Hire Staff 2x Faster' : 'வேகமாக ஆட்களைத் தேட சில வழிகள்'}
                        </h3>
                        <ul className="text-xs space-y-2.5 list-disc pl-4 font-medium leading-relaxed">
                          <li>
                            <strong>{currentLanguage === 'en' ? 'Mention food/tea' : 'உணவு/டீ வழங்கப்படுகிறதா'}</strong>:{' '}
                            {currentLanguage === 'en' ? 'Offering meals or snacks increases views by 40%.' : 'உணவு அல்லது டீ தருவதாகக் குறிப்பிட்டால் ஆட்கள் உடனே வருவார்கள்.'}
                          </li>
                          <li>
                            <strong>{currentLanguage === 'en' ? 'Be clear on shifts' : 'வேலை நேரத்தை குறிப்பிடுங்கள்'}</strong>:{' '}
                            {currentLanguage === 'en' ? 'Specify shift times clearly (e.g. 9am to 9pm).' : 'வேலை நேரத்தைத் தெளிவாகப் போடவும்.'}
                          </li>
                          <li>
                            <strong>{currentLanguage === 'en' ? 'Landmarks' : 'பக்கத்து அடையாளங்கள்'}</strong>:{' '}
                            {currentLanguage === 'en' ? 'Add land marks (near metro station, bus stand) to help seekers.' : 'பஸ் ஸ்டாண்ட் அல்லது மெட்ரோ நிலையம் அருகில் என்று போடுவது நல்லது.'}
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {providerSubTab === 'my-listings' && (
                  <div className="space-y-6">
                    {/* Explanatory 7-day auto-expiry Banner */}
                    <div className="bg-amber-50/70 border border-amber-200/60 rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row items-start gap-4 shadow-xs">
                      <div className="p-3 bg-amber-100 text-amber-800 rounded-2xl shrink-0 flex items-center justify-center">
                        <span className="text-xl">⏱️</span>
                      </div>
                      <div className="space-y-1.5">
                        <h3 className="font-sans font-black text-xs text-amber-950 tracking-wide uppercase">
                          {currentLanguage === 'en' 
                            ? '7-Day Automatic Expiration Policy' 
                            : '7 நாட்கள் தானியங்கி விளம்பர நீக்கம்'}
                        </h3>
                        <p className="text-xs text-amber-900/80 leading-relaxed font-medium">
                          {currentLanguage === 'en' 
                            ? 'To keep job seeker listings fresh, relevant, and accurate, all vacant positions automatically disappear exactly 7 days after publication. No manual deletion or login is ever required!' 
                            : 'விண்ணப்பதாரர்களுக்கு எப்போதும் புதிய மற்றும் துல்லியமான வேலைவாய்ப்பு தகவல்களைக் காட்ட, அனைத்து விளம்பரங்களும் வெளியிடப்பட்ட 7 நாட்களுக்குப் பிறகு தானாகவே நீக்கப்படும். நீங்கள் தனியாக லாகின் செய்யவோ அல்லது நீக்கவோ தேவையில்லை!'}
                        </p>
                      </div>
                    </div>

                    {/* Listings Grid */}
                    {myActiveListings.length === 0 ? (
                      <div className="bg-white rounded-3xl p-12 border-2 border-slate-100 text-center space-y-4 max-w-md mx-auto">
                        <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-2 border border-slate-100">
                          <span className="text-3xl">💼</span>
                        </div>
                        <h3 className="text-sm font-black text-slate-800 font-sans">
                          {currentLanguage === 'en' ? 'No Active Listings' : 'விளம்பரங்கள் எதுவும் இல்லை'}
                        </h3>
                        <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto font-medium">
                          {currentLanguage === 'en' 
                            ? "You haven't posted any job vacancies in this browser yet, or your previous posts have expired after 7 days." 
                            : 'நீங்கள் இன்னும் எந்த வேலைவாய்ப்பு விளம்பரங்களையும் வெளியிடவில்லை அல்லது உங்களது முந்தைய விளம்பரங்களின் காலம் முடிவடைந்திருக்கலாம்.'}
                        </p>
                        <button
                          onClick={() => setProviderSubTab('post')}
                          id="no-listings-post-btn"
                          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer shadow-xs active:scale-95 transition-all"
                        >
                          ➕ {currentLanguage === 'en' ? 'Post Your First Job' : 'விளம்பரம் வெளியிடவும்'}
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {myActiveListings.map((job) => (
                          <div 
                            key={job.id} 
                            className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-150 shadow-xs flex flex-col justify-between space-y-4 relative overflow-hidden"
                          >
                            {/* 7-Day Countdown Badge */}
                            <div className="absolute top-4 right-4 bg-amber-50 text-amber-800 px-2.5 py-1 rounded-xl text-[10px] font-black tracking-wide flex items-center gap-1 border border-amber-100">
                              <span>⏱️</span>
                              <span>{getRemainingTime(job.postedAt, currentLanguage)}</span>
                            </div>

                            <div className="space-y-2">
                              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded-lg text-[10px] font-black uppercase tracking-wider border border-emerald-100/50">
                                <span>🟢 {currentLanguage === 'en' ? 'Live & Active' : 'நேரலையில் உள்ளது'}</span>
                              </div>

                              <h4 className="text-sm font-black text-slate-800 font-sans leading-tight pr-24 pt-1">
                                {job.role}
                              </h4>
                              <p className="text-xs font-bold text-slate-600 flex items-center gap-1">
                                <span>🏢</span> {job.businessName}
                              </p>

                              <div className="grid grid-cols-2 gap-2 pt-2 text-xs font-bold text-slate-500 font-sans">
                                <div className="flex items-center gap-1">
                                  <span>📍</span> {currentLanguage === 'en' ? job.area : (AREA_MAPPINGS[job.area] || job.area)}
                                </div>
                                <div className="flex items-center gap-1 text-emerald-600">
                                  <span>💰</span> {job.salary}
                                </div>
                              </div>

                              <p className="text-xs text-slate-500 font-medium leading-relaxed bg-slate-50 p-3 rounded-2xl mt-1.5 line-clamp-2">
                                {job.description}
                              </p>
                            </div>

                            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold text-slate-400 font-sans">
                              <span>
                                {currentLanguage === 'en' ? 'Posted: ' : 'பதிவிடப்பட்டது: '}
                                {new Date(job.postedAt).toLocaleDateString(currentLanguage === 'en' ? 'en-US' : 'ta-IN', {
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </span>
                              <span className="text-emerald-600 uppercase font-black tracking-wider">
                                {currentLanguage === 'en' ? 'No action needed' : 'அமைப்பு தேவையில்லை'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </main>
            </motion.div>
          )}

          {/* Footer */}
          <footer className="bg-slate-900 text-slate-400 py-10 px-4 mt-12 border-t-2 border-slate-800 text-center space-y-4">
            <div className="max-w-4xl mx-auto space-y-4">
              <div className="flex items-center justify-center gap-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm text-white ${userRole === 'seeker' ? 'bg-blue-600' : userRole === 'provider' ? 'bg-emerald-600' : 'bg-slate-700'}`}>
                  ந
                </div>
                <span className="font-sans font-black text-white text-sm tracking-tight">
                  {t.brandName}
                </span>
              </div>
              
              <p className="text-xs max-w-sm mx-auto leading-relaxed text-slate-400">
                {t.footerText}
              </p>

              <div className="flex justify-center gap-6 text-[11px] font-bold text-slate-500">
                {userRole !== null && (
                  <>
                    <button
                      onClick={() => {
                        setUserRole(null);
                        localStorage.removeItem('namma-area-user-role');
                      }}
                      id="footer-change-role-btn"
                      className="hover:text-blue-500 transition-colors cursor-pointer"
                    >
                      👥 {currentLanguage === 'en' ? 'Change Role' : 'பயனர் மாற்றம்'}
                    </button>
                    <span>•</span>
                  </>
                )}
                <button
                  onClick={() => handleSelectArea('')}
                  id="footer-relaunch-onboarding"
                  className="hover:text-orange-500 transition-colors cursor-pointer"
                >
                  🔄 {t.changeArea}
                </button>
                <span>•</span>
                <span className="text-slate-500 font-sans">{t.madeForChennai}</span>
              </div>
            </div>
          </footer>

          {/* Change Area Modal */}
          <AnimatePresence>
            {showAreaModal && (
              <AreaSelectorModal
                currentLanguage={currentLanguage}
                onLanguageToggle={handleLanguageToggle}
                onSelectArea={handleSelectArea}
                isOpen={showAreaModal}
                onClose={() => setShowAreaModal(false)}
                isOnboarding={false}
              />
            )}
          </AnimatePresence>
    </div>
  );
}
