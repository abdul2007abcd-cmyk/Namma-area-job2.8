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
import RoleSelectorModal from './components/RoleSelectorModal';
import JobCard from './components/JobCard';
import JobForm from './components/JobForm';
import { motion, AnimatePresence } from 'motion/react';
// Local storage based job notices board



export default function App() {
  // --- STATE ---
  const [selectedArea, setSelectedArea] = useState<string>(() => {
    return localStorage.getItem('namma-area-job-area') || '';
  });

  const [currentLanguage, setCurrentLanguage] = useState<Language>(() => {
    const savedLang = localStorage.getItem('namma-area-job-lang');
    return (savedLang === 'en' || savedLang === 'ta') ? savedLang : 'en';
  });

  const [userRole, setUserRole] = useState<'seeker' | 'provider' | null>(() => {
    return (localStorage.getItem('namma-area-user-role') as 'seeker' | 'provider' | null) || null;
  });

  const [activeTab, setActiveTab] = useState<'browse' | 'post'>('browse');
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
        // Clean up expired custom job postings
        await fetch('/api/jobs/cleanup', { method: 'POST' }).catch(() => {});
        
        // Fetch all jobs
        const res = await fetch('/api/jobs');
        const data = await res.json();
        setJobs(data.jobs || SEED_JOBS);
        setUsingFallback(!!data.usingFallback);
        setDbError(data.error || null);
        setSqlHelp(data.sqlHelp || null);
      } catch (error) {
        console.log('Database synchronization fallback.');
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
    setActiveTab(role === 'seeker' ? 'browse' : 'post');
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

  const handleDeleteJob = async (id: string) => {
    if (confirm(currentLanguage === 'en' ? 'Are you sure you want to delete this job vacancy listing?' : 'இந்த வேலைவாய்ப்பு விளம்பரத்தை நிச்சயமாக நீக்க வேண்டுமா?')) {
      try {
        const res = await fetch(`/api/jobs/${id}`, { method: 'DELETE' });
        if (res.ok) {
          setJobs((prev) => prev.filter((j) => j.id !== id));
        } else {
          throw new Error('Deletion failed');
        }
      } catch (error) {
        console.log('Syncing delete action offline.');
        alert(currentLanguage === 'en' ? 'Failed to delete listing from the database.' : 'தரவுத்தளத்திலிருந்து விளம்பரத்தை நீக்க முடியவில்லை.');
      }
    }
  };

  const handleAddJob = async (newJobData: Omit<Job, 'id' | 'postedAt' | 'isCustom'>) => {
    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newJobData)
      });
      const data = await res.json();
      
      if (data.job) {
        setJobs((prev) => [data.job, ...prev]);
      } else {
        throw new Error('Failed to create job');
      }
      
      if (userRole === 'provider') {
         setUserRole('seeker');
         localStorage.setItem('namma-area-user-role', 'seeker');
      }
      setActiveTab('browse');
      setSearchQuery(''); // Reset search
      setSelectedCategory('all'); // Reset filters
    } catch (error) {
      console.log('Syncing post action offline.');
      alert(currentLanguage === 'en' ? 'Failed to publish job vacancy. Please try again.' : 'விளம்பரத்தை வெளியிட முடியவில்லை. மீண்டும் முயலவும்.');
    }
  };

  const handleResetApp = async () => {
    if (confirm(currentLanguage === 'en' ? 'Reload and refresh all job listings from the cloud database?' : 'மேகக்கணி தரவுத்தளத்திலிருந்து அனைத்து வேலைகளையும் புதுப்பிக்கவா?')) {
      setLoading(true);
      try {
        const res = await fetch('/api/jobs');
        const data = await res.json();
        setJobs(data.jobs || SEED_JOBS);
        setUsingFallback(!!data.usingFallback);
        setDbError(data.error || null);
        setSqlHelp(data.sqlHelp || null);
        setActiveTab('browse');
      } catch (error) {
        console.log('Syncing reload action offline.');
      } finally {
        setLoading(false);
      }
    }
  };


  // --- DERIVED TRANS-DATA ---
  const t = translations[currentLanguage];
  const categories = CATEGORIES[currentLanguage];

  // Proximity filter and sorting logic
  const filteredAndSortedJobs = useMemo(() => {
    // 1. Filter by category
    let list = jobs;
    if (selectedCategory !== 'all') {
      list = list.filter((j) => j.category === selectedCategory);
    }

    // 2. Filter by search query
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

    // 3. Sort/Group: selected area first, then others. Within each, sorted by date (newest first)
    const areaLower = selectedArea.toLowerCase();

    return [...list].sort((a, b) => {
      const isANearby = selectedArea !== 'All' && a.area.toLowerCase() === areaLower;
      const isBNearby = selectedArea !== 'All' && b.area.toLowerCase() === areaLower;

      if (isANearby && !isBNearby) return -1;
      if (!isANearby && isBNearby) return 1;

      // Secondary sort: newest first
      return new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime();
    });
  }, [jobs, selectedCategory, searchQuery, selectedArea]);

  // Statistics for active area vs surrounding areas
  const stats = useMemo(() => {
    const areaLower = selectedArea.toLowerCase();
    const inAreaCount = jobs.filter(
      (j) => selectedArea !== 'All' && j.area.toLowerCase() === areaLower
    ).length;
    const totalCount = jobs.length;
    return {
      inArea: inAreaCount,
      total: totalCount,
      surrounding: totalCount - inAreaCount
    };
  }, [jobs, selectedArea]);

  // Determine if onboarding overlay is needed
  const isRoleOnboarding = userRole === null;
  const isAreaOnboarding = !isRoleOnboarding && selectedArea === '';
  const isOnboarding = isRoleOnboarding || isAreaOnboarding;

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col justify-between" id="namma-area-app-root">
      {/* A. Role Selector Onboarding */}
      <RoleSelectorModal
        currentLanguage={currentLanguage}
        onLanguageToggle={handleLanguageToggle}
        onSelectRole={handleSelectRole}
        isOpen={isRoleOnboarding}
      />

      {/* B. Area Selector Onboarding */}
      <AreaSelectorModal
        currentLanguage={currentLanguage}
        onLanguageToggle={handleLanguageToggle}
        onSelectArea={handleSelectArea}
        isOpen={isAreaOnboarding}
        isOnboarding={true}
      />

      {/* 2. Main Page content if onboarded */}
      {!isOnboarding && (
        <>
          {/* ========================================== */}
          {/* 1. JOB SEEKER PORTAL                       */}
          {/* ========================================== */}
          {userRole === 'seeker' && (
            <div className="flex-grow flex flex-col">
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
                  <div className="flex items-center gap-2">
                    {/* Area Select Button */}
                    <button
                      onClick={() => setShowAreaModal(true)}
                      id="header-change-area-btn"
                      className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-900 rounded-xl border-2 border-blue-200 text-xs font-black transition-all cursor-pointer shadow-xs max-w-[120px] sm:max-w-none truncate shrink-0"
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
                    📢 {t.communityNotice}
                  </span>
                </div>
              </section>

              {/* Seeker Main Body */}
              <main className="max-w-4xl mx-auto px-4 py-6 flex-grow w-full space-y-6">
                {/* Prominent Mode Selector In Front */}
                <div className="bg-white p-4 rounded-3xl border-2 border-slate-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-center sm:text-left space-y-0.5">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                      {currentLanguage === 'en' ? 'Platform Mode' : 'தளத்தின் நிலை'}
                    </span>
                    <span className="text-sm font-black text-slate-700">
                      {currentLanguage === 'en' ? '🔍 Looking for Job Vacancies' : '🔍 வேலைகளைத் தேடுகிறீர்கள்'}
                    </span>
                  </div>
                  
                  <div className="p-1 bg-slate-100 rounded-2xl flex w-full sm:w-auto border border-slate-200">
                    <button
                      onClick={() => handleSelectRole('seeker')}
                      id="front-toggle-seeker"
                      className="flex-1 sm:flex-none px-4 py-2.5 text-xs font-black font-sans uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 bg-blue-600 text-white shadow-xs"
                    >
                      <Briefcase className="w-3.5 h-3.5" />
                      <span>{currentLanguage === 'en' ? 'Job Seeker' : 'வேலை தேடுபவர்'}</span>
                    </button>
                    <button
                      onClick={() => handleSelectRole('provider')}
                      id="front-toggle-provider"
                      className="flex-1 sm:flex-none px-4 py-2.5 text-xs font-black font-sans uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-50/50"
                    >
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>{currentLanguage === 'en' ? 'Shop Owner' : 'கடை உரிமையாளர்'}</span>
                    </button>
                  </div>
                </div>

                {/* Supabase Status Alert Banner */}
                {usingFallback && (
                  <div className="bg-amber-50/70 border-2 border-amber-200 rounded-3xl p-4 sm:p-5 shadow-xs space-y-3" id="supabase-status-banner">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-amber-100 text-amber-800 rounded-xl shrink-0">
                        <Database className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-sans font-black text-sm text-slate-800 tracking-tight flex items-center gap-2">
                          {currentLanguage === 'en' ? 'Supabase Connection Fallback' : 'Supabase இணைப்பு வரம்பு'}
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] uppercase font-black tracking-wider rounded-md">
                            {currentLanguage === 'en' ? 'Local Demo Mode' : 'உள்ளூர் டெமோ முறை'}
                          </span>
                        </h3>
                        <p className="text-xs text-slate-600 font-sans leading-relaxed">
                          {currentLanguage === 'en' 
                            ? 'The app is perfectly running in local fallback memory with seed jobs. Connection to Supabase failed or has not been fully configured yet.' 
                            : 'விண்ணப்பம் உள்ளூர் நினைவகத்தில் சரியாக இயங்குகிறது. Supabase தரவுத்தள இணைப்பு வரம்புக்கு உட்பட்டது.'}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 pt-1.5 border-t border-amber-200/50">
                      <button
                        onClick={() => setShowSqlGuide(!showSqlGuide)}
                        className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                      >
                        <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
                        <span>
                          {showSqlGuide 
                            ? (currentLanguage === 'en' ? 'Hide Setup Guide' : 'அமைவு வழிகாட்டியை மறை') 
                            : (currentLanguage === 'en' ? 'Show Setup Guide & SQL' : 'வழிகாட்டி மற்றும் SQL காண்க')}
                        </span>
                      </button>

                      <button
                        onClick={async () => {
                          setLoading(true);
                          try {
                            const res = await fetch('/api/jobs');
                            const data = await res.json();
                            setJobs(data.jobs || SEED_JOBS);
                            setUsingFallback(!!data.usingFallback);
                            setDbError(data.error || null);
                          } catch (e) {}
                          setLoading(false);
                        }}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>{currentLanguage === 'en' ? 'Retry Connection' : 'மீண்டும் இணைக்கவும்'}</span>
                      </button>
                    </div>

                    {showSqlGuide && (
                      <div className="bg-slate-900 text-slate-100 rounded-2xl p-4 text-xs font-mono space-y-3 border border-slate-800 animate-fadeIn">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                          <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                            👉 Step 1: Execute SQL in Supabase Dashboard
                          </span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(sqlHelp || '');
                              setCopiedSql(true);
                              setTimeout(() => setCopiedSql(false), 2000);
                            }}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition-all flex items-center gap-1 cursor-pointer"
                            title="Copy SQL Script"
                          >
                            {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedSql ? 'Copied!' : 'Copy SQL'}</span>
                          </button>
                        </div>
                        <pre className="overflow-x-auto text-[11px] leading-relaxed text-blue-300 p-2 bg-slate-950 rounded-lg">
                          {sqlHelp || `CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  "businessName" TEXT NOT NULL,
  role TEXT NOT NULL,
  category TEXT NOT NULL,
  salary TEXT NOT NULL,
  location TEXT NOT NULL,
  area TEXT NOT NULL,
  "contactNumber" TEXT NOT NULL,
  description TEXT NOT NULL,
  "postedAt" TEXT NOT NULL,
  "isCustom" BOOLEAN NOT NULL DEFAULT FALSE
);`}
                        </pre>
                        <div className="text-slate-400 leading-relaxed font-sans text-xs pt-1 space-y-1">
                          <p className="font-bold text-slate-300">👉 Step 2: Configure Environment Secrets</p>
                          <p>
                            Configure <strong>SUPABASE_URL</strong> and <strong>SUPABASE_ANON_KEY</strong> in the Secrets Settings menu of Google AI Studio with your personal Supabase credentials!
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

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
                            Found <span className="font-black text-blue-600">{filteredAndSortedJobs.length}</span> {t.matchingJobs}.{' '}
                            {stats.inArea > 0 ? (
                              <>
                                <span className="font-black text-slate-800">{stats.inArea}</span> directly in {selectedArea}, and others nearby.
                              </>
                            ) : (
                              <>No listings directly in {selectedArea} right now; displaying other Chennai areas below.</>
                            )}
                          </>
                        ) : (
                          <>
                            <span className="font-black text-blue-600">{filteredAndSortedJobs.length}</span> {t.matchingJobs}.{' '}
                            {stats.inArea > 0 ? (
                              <>
                                <span className="font-black text-slate-800">{stats.inArea}</span> வேலைகள் {AREA_MAPPINGS[selectedArea] || selectedArea}-இல் உள்ளன.
                              </>
                            ) : (
                              <>{AREA_MAPPINGS[selectedArea] || selectedArea} பகுதியில் தற்போது வேலைகள் எதுவும் இல்லை; மற்ற பகுதிகள் கீழே உள்ளன.</>
                            )}
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
                        onDelete={job.isCustom ? handleDeleteJob : undefined}
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
            </div>
          )}

          {/* ========================================== */}
          {/* 2. SHOP OWNER PORTAL                       */}
          {/* ========================================== */}
          {userRole === 'provider' && (
            <div className="flex-grow flex flex-col">
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
                  <div className="flex items-center gap-2">
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
                {/* Prominent Mode Selector In Front */}
                <div className="bg-white p-4 rounded-3xl border-2 border-slate-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-center sm:text-left space-y-0.5">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                      {currentLanguage === 'en' ? 'Platform Mode' : 'தளத்தின் நிலை'}
                    </span>
                    <span className="text-sm font-black text-slate-700">
                      {currentLanguage === 'en' ? '📢 Hiring Staff for Shop/Business' : '📢 கடை/நிறுவனத்திற்கு ஆட்கள் தேவை'}
                    </span>
                  </div>
                  
                  <div className="p-1 bg-slate-100 rounded-2xl flex w-full sm:w-auto border border-slate-200">
                    <button
                      onClick={() => handleSelectRole('seeker')}
                      id="front-toggle-seeker"
                      className="flex-1 sm:flex-none px-4 py-2.5 text-xs font-black font-sans uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-50/50"
                    >
                      <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                      <span>{currentLanguage === 'en' ? 'Job Seeker' : 'வேலை தேடுபவர்'}</span>
                    </button>
                    <button
                      onClick={() => handleSelectRole('provider')}
                      id="front-toggle-provider"
                      className="flex-1 sm:flex-none px-4 py-2.5 text-xs font-black font-sans uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 bg-emerald-600 text-white shadow-xs"
                    >
                      <Building2 className="w-3.5 h-3.5" />
                      <span>{currentLanguage === 'en' ? 'Shop Owner' : 'கடை உரிமையாளர்'}</span>
                    </button>
                  </div>
                </div>

                {/* Publish Job Form Area directly (Manage/tabs removed) */}
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
              </main>
            </div>
          )}

          {/* Footer */}
          <footer className="bg-slate-900 text-slate-400 py-10 px-4 mt-12 border-t-2 border-slate-800 text-center space-y-4">
            <div className="max-w-4xl mx-auto space-y-4">
              <div className="flex items-center justify-center gap-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm text-white ${userRole === 'seeker' ? 'bg-blue-600' : 'bg-emerald-600'}`}>
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
        </>
      )}
    </div>
  );
}
