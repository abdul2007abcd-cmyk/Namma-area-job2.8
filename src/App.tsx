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
import { supabase, fetchSupabaseJobs, insertSupabaseJob, type SupabaseSyncStatus } from './supabase';


export default function App() {
  // --- STATE ---
  const [selectedArea, setSelectedArea] = useState<string>(() => {
    return localStorage.getItem('namma-area-job-area') || '';
  });

  const [currentLanguage, setCurrentLanguage] = useState<Language>(() => {
    const savedLang = localStorage.getItem('namma-area-job-lang');
    return (savedLang === 'en' || savedLang === 'ta') ? savedLang : 'en';
  });

  const [activeTab, setActiveTab] = useState<'browse' | 'post'>('browse');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showAreaModal, setShowAreaModal] = useState(false);

  const [jobs, setJobs] = useState<Job[]>(() => {
    const saved = localStorage.getItem('namma-area-job-posts');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback to seeds if parsing fails
      }
    }
    return SEED_JOBS;
  });

  // Supabase Integration States
  const [supabaseStatus, setSupabaseStatus] = useState<SupabaseSyncStatus | null>(null);
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);
  const [showSupabaseModal, setShowSupabaseModal] = useState(false);
  const [copied, setCopied] = useState(false);

  // --- ACTIONS & EFFECT SYNC ---

  // Fetch from Supabase
  const handleSyncSupabase = async () => {
    setIsLoadingJobs(true);
    const res = await fetchSupabaseJobs();
    setSupabaseStatus(res.status);
    if (res.status.connected && res.status.tableExists) {
      setJobs(res.jobs);
      localStorage.setItem('namma-area-job-posts', JSON.stringify(res.jobs));
    } else {
      // Offline / Setup Needed Fallback to LocalStorage
      const saved = localStorage.getItem('namma-area-job-posts');
      if (saved) {
        try {
          setJobs(JSON.parse(saved));
        } catch (e) {
          setJobs(SEED_JOBS);
        }
      } else {
        setJobs(SEED_JOBS);
        localStorage.setItem('namma-area-job-posts', JSON.stringify(SEED_JOBS));
      }
    }
    setIsLoadingJobs(false);
  };

  useEffect(() => {
    handleSyncSupabase();
  }, []);

  // Sync to local storage as safety backup
  useEffect(() => {
    if (jobs.length > 0) {
      localStorage.setItem('namma-area-job-posts', JSON.stringify(jobs));
    }
  }, [jobs]);

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

  const handleAddJob = async (newJobData: Omit<Job, 'id' | 'postedAt' | 'isCustom'>) => {
    const newJob: Job = {
      ...newJobData,
      id: `job-${Date.now()}`,
      postedAt: new Date().toISOString(),
      isCustom: true
    };

    // Optimistic UI Update (Update local state immediately)
    setJobs((prev) => [newJob, ...prev]);
    setActiveTab('browse'); // Jump back to noticeboard
    setSearchQuery(''); // Reset search
    setSelectedCategory('all'); // Reset filters

    // Asynchronously insert into Supabase
    if (supabaseStatus?.connected && supabaseStatus?.tableExists) {
      try {
        await insertSupabaseJob(newJob);
        // Refresh local listings to match DB fully
        const res = await fetchSupabaseJobs();
        if (res.status.connected && res.status.tableExists) {
          setJobs(res.jobs);
        }
      } catch (err: any) {
        console.error('Supabase write error, keeping in local state:', err);
        alert(currentLanguage === 'en'
          ? `⚠️ Succeeded locally but failed to sync online with Supabase: ${err.message}`
          : `⚠️ விளம்பரம் பதிவிடப்பட்டது, ஆனால் Supabase ஆன்லைன் தரவுத்தளத்தில் சேமிக்க முடியவில்லை: ${err.message}`
        );
      }
    } else {
      // Ensure we update backup cache
      const saved = localStorage.getItem('namma-area-job-posts');
      let currentLocalJobs = SEED_JOBS;
      if (saved) {
        try {
          currentLocalJobs = JSON.parse(saved);
        } catch (e) {}
      }
      localStorage.setItem('namma-area-job-posts', JSON.stringify([newJob, ...currentLocalJobs]));
    }
  };

  const handleResetApp = async () => {
    if (confirm(currentLanguage === 'en' ? 'Reset noticeboard back to default jobs?' : 'அறிவிப்புப் பலகையை பழைய நிலைக்கு மீட்டமைக்கவா?')) {
      setSelectedArea('');
      localStorage.removeItem('namma-area-job-area');
      
      if (supabaseStatus?.connected && supabaseStatus?.tableExists) {
        setIsLoadingJobs(true);
        // Clear Supabase or re-seed it
        try {
          await supabase.from('jobs').delete().neq('id', 'keep_all');
        } catch (e) {
          console.warn('Could not reset Supabase, resetting local list:', e);
        }
      }
      
      setJobs(SEED_JOBS);
      localStorage.setItem('namma-area-job-posts', JSON.stringify(SEED_JOBS));
      setActiveTab('browse');
      await handleSyncSupabase();
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
  const isOnboarding = selectedArea === '';

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col justify-between" id="namma-area-app-root">
      {/* 1. Onboarding Screen */}
      <AreaSelectorModal
        currentLanguage={currentLanguage}
        onLanguageToggle={handleLanguageToggle}
        onSelectArea={handleSelectArea}
        isOpen={isOnboarding}
        isOnboarding={true}
      />

      {/* 2. Main Page content if onboarded */}
      {!isOnboarding && (
        <>
          {/* Header */}
          <header className="sticky top-0 z-40 bg-white border-b-2 border-slate-100 shadow-xs">
            <div className="max-w-4xl mx-auto px-4 py-3.5 flex items-center justify-between gap-4">
              {/* Brand Logo & Tagline */}
              <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setActiveTab('browse')}>
                <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center text-white font-black shadow-xs">
                  <span className="text-xl font-black">ந</span>
                </div>
                <div>
                  <h1 className="font-sans font-black text-lg text-slate-800 tracking-tight leading-none">
                    {t.brandName}
                  </h1>
                  <span className="text-[10px] text-slate-400 font-sans font-bold tracking-wide block mt-1">
                    {currentLanguage === 'en' ? 'CHENNAI HYPERLOCAL NOTICEBOARD' : 'சென்னை உள்ளூர் வேலைகள்'}
                  </span>
                </div>
              </div>

              {/* Top Controls: Neighborhood select & Lang Toggle */}
              <div className="flex items-center gap-2">
                {/* Active Neighborhood Button */}
                <button
                  onClick={() => setShowAreaModal(true)}
                  id="header-change-area-btn"
                  className="flex items-center gap-1.5 px-3 py-2 bg-orange-50 hover:bg-orange-100/80 text-orange-900 rounded-xl border-2 border-orange-200 text-xs font-black transition-all cursor-pointer shadow-xs max-w-[150px] sm:max-w-none animate-pulse-subtle"
                >
                  <MapPin className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                  <span className="truncate">
                    {selectedArea === 'All'
                      ? t.allAreas
                      : currentLanguage === 'en'
                      ? selectedArea
                      : AREA_MAPPINGS[selectedArea] || selectedArea}
                  </span>
                </button>

                {/* Supabase Connection Status Pill */}
                <button
                  onClick={() => setShowSupabaseModal(true)}
                  id="supabase-status-pill"
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 text-xs font-black cursor-pointer transition-all ${
                    isLoadingJobs
                      ? 'bg-slate-100 border-slate-200 text-slate-500 animate-pulse'
                      : supabaseStatus?.connected && supabaseStatus?.tableExists
                      ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100/70'
                      : 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100/70'
                  }`}
                  title="Supabase Sync Status"
                >
                  <Database className={`w-3.5 h-3.5 ${isLoadingJobs ? 'animate-spin' : ''}`} />
                  <span className="hidden md:inline">
                    {isLoadingJobs ? 'Syncing...' : supabaseStatus?.connected && supabaseStatus?.tableExists ? 'Supabase Live' : 'Supabase Setup'}
                  </span>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    isLoadingJobs ? 'bg-slate-400' : supabaseStatus?.connected && supabaseStatus?.tableExists ? 'bg-green-500' : 'bg-amber-500'
                  }`} />
                </button>

                {/* Language toggle */}
                <button
                  onClick={handleLanguageToggle}
                  id="header-lang-toggle"
                  className="flex items-center justify-center w-9 h-9 rounded-xl bg-slate-50 border-2 border-slate-200 hover:bg-slate-100 text-slate-700 transition-all cursor-pointer shadow-xs"
                  title={currentLanguage === 'en' ? 'Switch to Tamil' : 'ஆங்கிலத்திற்கு மாறவும்'}
                >
                  <Globe className="w-4 h-4 text-orange-600" />
                </button>
              </div>
            </div>
          </header>

          {/* Banner community notice */}
          <section className="bg-orange-600 text-white py-2.5 px-4 text-center shadow-xs">
            <div className="max-w-4xl mx-auto flex items-center justify-center gap-2">
              <span className="text-xs font-black tracking-wide leading-relaxed font-sans uppercase">
                📢 {t.communityNotice}
              </span>
            </div>
          </section>

          {/* Main Stage */}
          <main className="max-w-4xl mx-auto px-4 py-6 flex-grow w-full">
            
            {/* Visual Intro Area */}
            <div className="text-center mb-6 py-2">
              <h2 className="text-2xl font-black text-slate-800 font-sans tracking-tight mb-1">
                {t.brandName} — {selectedArea === 'All' ? t.allAreas : (currentLanguage === 'en' ? selectedArea : AREA_MAPPINGS[selectedArea] || selectedArea)}
              </h2>
              <p className="text-xs text-slate-500 font-sans font-semibold leading-relaxed">
                {t.tagline}
              </p>
            </div>

            {/* Main Segmented Navigation Switcher (Browse vs Post) */}
            <div className="p-1.5 bg-slate-100 rounded-2xl flex max-w-sm mx-auto mb-8 border-2 border-slate-200">
              <button
                onClick={() => setActiveTab('browse')}
                id="tab-btn-browse"
                className={`flex-1 py-3 text-xs font-black font-sans uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                  activeTab === 'browse'
                    ? 'bg-orange-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50/50'
                }`}
              >
                {t.browseJobsTab}
              </button>
              <button
                onClick={() => setActiveTab('post')}
                id="tab-btn-post"
                className={`flex-1 py-3 text-xs font-black font-sans uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                  activeTab === 'post'
                    ? 'bg-orange-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50/50'
                }`}
              >
                {t.postJobTab}
              </button>
            </div>

            {/* TAB CONTENT */}
            <AnimatePresence mode="wait">
              {activeTab === 'browse' ? (
                <motion.div
                  key="browse-panel"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-6"
                >
                  {/* Sticky Filter & Search Control Panel */}
                  <div className="bg-white p-4 rounded-2xl border-2 border-slate-100 shadow-sm space-y-4">
                    {/* Search Field */}
                    <div className="relative">
                      <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={t.searchPlaceholder}
                        className="w-full pl-10 pr-10 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl font-sans text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-orange-500 focus:bg-white transition-all"
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

                    {/* Category Scroll Filter chips */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs font-black text-slate-400 uppercase tracking-wider font-sans">
                        <span>{t.categoryLabel}</span>
                        {selectedCategory !== 'all' && (
                          <button
                            onClick={() => setSelectedCategory('all')}
                            id="clear-category-filter-btn"
                            className="text-[10px] text-orange-600 hover:text-orange-700 font-black cursor-pointer uppercase"
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
                                ? 'bg-orange-600 border-orange-600 text-white'
                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                            }`}
                          >
                            {cat.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Search / Filter Status Counter Message */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 px-1 text-xs text-slate-500 font-bold">
                    <div>
                      {selectedArea !== 'All' ? (
                        <span>
                          {currentLanguage === 'en' ? (
                            <>
                              Found <span className="font-black text-orange-600">{filteredAndSortedJobs.length}</span> {t.matchingJobs}.{' '}
                              {stats.inArea > 0 ? (
                                <>
                                  <span className="font-black text-slate-800">{stats.inArea}</span> in {selectedArea}, and {filteredAndSortedJobs.length - stats.inArea} nearby.
                                </>
                              ) : (
                                <>No active listings directly in {selectedArea} right now; showing other areas below.</>
                              )}
                            </>
                          ) : (
                            <>
                              <span className="font-black text-orange-600">{filteredAndSortedJobs.length}</span> {t.matchingJobs}.{' '}
                              {stats.inArea > 0 ? (
                                <>
                                  <span className="font-black text-slate-800">{stats.inArea}</span> வேலைகள் {AREA_MAPPINGS[selectedArea] || selectedArea}-இல் உள்ளன, மீதமுள்ளவை அருகில் உள்ளவை.
                                </>
                              ) : (
                                <>{AREA_MAPPINGS[selectedArea] || selectedArea} பகுதியில் தற்போது வேலைகள் எதுவும் இல்லை; அருகில் உள்ள வேலைகள் கீழே காட்டப்படுகின்றன.</>
                              )}
                            </>
                          )}
                        </span>
                      ) : (
                        <span>
                          {currentLanguage === 'en' ? (
                            <>Showing <span className="font-black text-orange-600">{filteredAndSortedJobs.length}</span> total jobs across Chennai.</>
                          ) : (
                            <>சென்னையில் உள்ள <span className="font-black text-orange-600">{filteredAndSortedJobs.length}</span> மொத்த வேலைகள் காட்டப்படுகின்றன.</>
                          )}
                        </span>
                      )}
                    </div>

                    {/* Reset custom data if any */}
                    <button
                      onClick={handleResetApp}
                      id="reset-noticeboard-btn"
                      className="flex items-center gap-1 text-[10px] font-bold text-gray-400 hover:text-rose-500 transition-colors uppercase tracking-wider cursor-pointer font-sans"
                    >
                      <RotateCcw className="w-3 h-3" />
                      {currentLanguage === 'en' ? 'Reset Notices' : 'அறிவிப்புகளை மீட்டமை'}
                    </button>
                  </div>

                  {/* GRID OF JOBS */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredAndSortedJobs.map((job) => (
                      <JobCard
                        key={job.id}
                        job={job}
                        userArea={selectedArea}
                        currentLanguage={currentLanguage}
                      />
                    ))}
                  </div>

                  {/* Empty state */}
                  {filteredAndSortedJobs.length === 0 && (
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
                        className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer shadow-xs"
                      >
                        {currentLanguage === 'en' ? 'Show All Chennai Jobs' : 'சென்னை முழுவதும் காட்டு'}
                      </button>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="post-panel"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <JobForm
                    currentLanguage={currentLanguage}
                    onAddJob={handleAddJob}
                    userArea={selectedArea}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </main>

          {/* Footer */}
          <footer className="bg-slate-900 text-slate-400 py-10 px-4 mt-12 border-t-2 border-slate-800 text-center space-y-4">
            <div className="max-w-4xl mx-auto space-y-4">
              <div className="flex items-center justify-center gap-2">
                <div className="w-8 h-8 bg-orange-600 text-white rounded-lg flex items-center justify-center font-black text-sm">
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

          {/* Supabase Status Modal */}
          <AnimatePresence>
            {showSupabaseModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowSupabaseModal(false)}
                  className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
                />

                {/* Content Card */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 15 }}
                  className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border-2 border-orange-150 overflow-hidden z-10"
                >
                  {/* Header */}
                  <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="bg-orange-600 text-white px-2 py-1 rounded-lg font-black text-xs tracking-wider uppercase">
                        SUPABASE
                      </div>
                      <span className="font-sans font-black text-white text-lg tracking-tight">
                        Database Sync Status
                      </span>
                    </div>
                    <button
                      onClick={() => setShowSupabaseModal(false)}
                      className="p-1 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Body */}
                  <div className="p-6 space-y-5">
                    {/* Connection Stats banner */}
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="min-w-0">
                        <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
                          CONNECTION URL
                        </span>
                        <span className="block text-xs font-mono font-bold text-slate-700 truncate max-w-[200px] sm:max-w-xs mt-0.5">
                          {(import.meta as any).env.VITE_SUPABASE_URL || 'https://ltxpifavwbejpbedpgro.supabase.co'}
                        </span>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shrink-0 ${
                        supabaseStatus?.connected
                          ? 'bg-green-50 text-green-700 border border-green-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {supabaseStatus?.connected ? 'CONNECTED' : 'OFFLINE'}
                      </span>
                    </div>

                    {/* Table Status Details */}
                    <div>
                      {isLoadingJobs ? (
                        <div className="text-center py-6 space-y-2">
                          <RefreshCw className="w-8 h-8 text-orange-500 animate-spin mx-auto" />
                          <p className="text-xs font-bold text-slate-500">Checking connection and database structure...</p>
                        </div>
                      ) : supabaseStatus?.connected && supabaseStatus?.tableExists ? (
                        <div className="p-4 bg-green-50 border border-green-200 rounded-2xl flex gap-3">
                          <span className="text-xl">🟢</span>
                          <div className="space-y-1">
                            <h4 className="text-sm font-black text-green-800 uppercase tracking-wide leading-none">
                              Live & Synchronized
                            </h4>
                            <p className="text-xs text-green-700 font-bold leading-relaxed">
                              All jobs are successfully loaded and updated directly from the <strong>jobs</strong> table in your Supabase database.
                            </p>
                          </div>
                        </div>
                      ) : supabaseStatus?.connected && !supabaseStatus?.tableExists ? (
                        <div className="space-y-4">
                          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex gap-3">
                            <span className="text-xl">⚠️</span>
                            <div className="space-y-1">
                              <h4 className="text-sm font-black text-amber-800 uppercase tracking-wide leading-none">
                                SQL Table Setup Required
                              </h4>
                              <p className="text-xs text-amber-700 font-bold leading-relaxed">
                                Connected to Supabase, but the <strong className="font-extrabold">"jobs"</strong> table does not exist yet. Paste this script into your Supabase SQL Editor:
                              </p>
                            </div>
                          </div>

                          {/* SQL Editor script box */}
                          <div className="relative bg-slate-900 rounded-2xl overflow-hidden shadow-inner">
                            <div className="flex justify-between items-center px-4 py-2 bg-slate-800 text-slate-400 text-[10px] font-bold font-mono">
                              <span>PostgreSQL Query</span>
                              <button
                                onClick={() => {
                                  const sqlText = `create table jobs (
  id text primary key,
  business_name text not null,
  role text not null,
  category text not null,
  salary text not null,
  location text,
  area text not null,
  contact_number text not null,
  description text not null,
  posted_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table jobs enable row level security;

create policy "Allow anyone to read jobs" on jobs for select using (true);
create policy "Allow anyone to insert jobs" on jobs for insert with check (true);`;
                                  navigator.clipboard.writeText(sqlText);
                                  setCopied(true);
                                  setTimeout(() => setCopied(false), 2000);
                                }}
                                className="flex items-center gap-1 text-slate-300 hover:text-white cursor-pointer"
                              >
                                {copied ? (
                                  <>
                                    <Check className="w-3 h-3 text-green-400" />
                                    <span className="text-green-400 font-black">COPIED!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    <span>Copy Script</span>
                                  </>
                                )}
                              </button>
                            </div>
                            <pre className="p-4 text-[11px] font-mono text-slate-300 overflow-x-auto leading-normal text-left max-h-40">
{`create table jobs (
  id text primary key,
  business_name text not null,
  role text not null,
  category text not null,
  salary text not null,
  location text,
  area text not null,
  contact_number text not null,
  description text not null,
  posted_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table jobs enable row level security;

create policy "Allow anyone to read jobs" on jobs for select using (true);
create policy "Allow anyone to insert jobs" on jobs for insert with check (true);`}
                            </pre>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex gap-3">
                          <span className="text-xl">❌</span>
                          <div className="space-y-1">
                            <h4 className="text-sm font-black text-rose-800 uppercase tracking-wide leading-none">
                              Supabase Offline
                            </h4>
                            <p className="text-xs text-rose-700 font-bold leading-relaxed">
                              Could not establish connection to Supabase. Check configuration credentials.
                            </p>
                            {supabaseStatus?.error && (
                              <p className="text-[10px] text-rose-500 font-mono mt-1 break-all bg-white/50 p-2 rounded-lg border border-rose-100">
                                Error: {supabaseStatus.error}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Developer note */}
                    <div className="text-[11px] text-slate-400 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                      💡 <strong>Automatic Seeding:</strong> Once you create the <strong>jobs</strong> table, the app will automatically seed it with the default Chennai job listings!
                    </div>

                    {/* Footer Actions */}
                    <div className="flex gap-2.5 pt-2">
                      <button
                        onClick={handleSyncSupabase}
                        disabled={isLoadingJobs}
                        className="flex-1 flex items-center justify-center gap-1.5 py-3 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white rounded-xl font-bold text-sm cursor-pointer transition-all active:scale-98 shadow-xs"
                      >
                        <RefreshCw className={`w-4 h-4 ${isLoadingJobs ? 'animate-spin' : ''}`} />
                        Check & Sync Database
                      </button>
                      <button
                        onClick={() => setShowSupabaseModal(false)}
                        className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm cursor-pointer transition-all"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}
