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
  X
} from 'lucide-react';
import { Job, Language } from './types';
import { translations, CATEGORIES, AREA_MAPPINGS } from './translations';
import { SEED_JOBS } from './data/seedJobs';
import AreaSelectorModal from './components/AreaSelectorModal';
import JobCard from './components/JobCard';
import JobForm from './components/JobForm';
import { motion, AnimatePresence } from 'motion/react';

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
    // Set initial seed jobs in local storage if not already there
    localStorage.setItem('namma-area-job-posts', JSON.stringify(SEED_JOBS));
    return SEED_JOBS;
  });

  // --- ACTIONS & EFFECT SYNC ---
  useEffect(() => {
    localStorage.setItem('namma-area-job-posts', JSON.stringify(jobs));
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

  const handleAddJob = (newJobData: Omit<Job, 'id' | 'postedAt' | 'isCustom'>) => {
    const newJob: Job = {
      ...newJobData,
      id: `custom-${Date.now()}`,
      postedAt: new Date().toISOString(),
      isCustom: true
    };
    setJobs((prev) => [newJob, ...prev]);
    setActiveTab('browse'); // Jump back to noticeboard
    setSearchQuery(''); // Reset search
    setSelectedCategory('all'); // Reset filters
  };

  const handleResetApp = () => {
    if (confirm(currentLanguage === 'en' ? 'Reset noticeboard back to default jobs?' : 'அறிவிப்புப் பலகையை பழைய நிலைக்கு மீட்டமைக்கவா?')) {
      setJobs(SEED_JOBS);
      setSelectedArea('');
      localStorage.removeItem('namma-area-job-area');
      localStorage.setItem('namma-area-job-posts', JSON.stringify(SEED_JOBS));
      setActiveTab('browse');
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
        </>
      )}
    </div>
  );
}
