/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { PlusCircle, Building, User, IndianRupee, MapPin, Phone, FileText, CheckCircle } from 'lucide-react';
import { Job, Language } from '../types';
import { translations, CATEGORIES, AREA_MAPPINGS } from '../translations';
import { motion } from 'motion/react';

interface JobFormProps {
  currentLanguage: Language;
  onAddJob: (job: Omit<Job, 'id' | 'postedAt' | 'isCustom'>) => void;
  userArea: string;
}

const COMMON_AREAS = Object.keys(AREA_MAPPINGS);

export default function JobForm({ currentLanguage, onAddJob, userArea }: JobFormProps) {
  const t = translations[currentLanguage];
  const categories = CATEGORIES[currentLanguage].filter(c => c.id !== 'all');

  // Form State
  const [businessName, setBusinessName] = useState('');
  const [role, setRole] = useState('');
  const [category, setCategory] = useState('');
  const [salary, setSalary] = useState('');
  const [area, setArea] = useState(userArea !== 'All' ? userArea : '');
  const [location, setLocation] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [description, setDescription] = useState('');

  // UI State
  const [error, setError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Field check
    if (!businessName.trim() || !role.trim() || !category || !salary.trim() || !area.trim() || !contactNumber.trim() || !description.trim()) {
      setError(t.validationError);
      return;
    }

    // Phone validation (Exactly 10 digits after cleaning)
    const cleanPhone = contactNumber.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setError(t.phoneValidationError);
      return;
    }

    setIsSubmitting(true);

    // Simulate small saving lag for visual satisfaction
    setTimeout(() => {
      onAddJob({
        businessName: businessName.trim(),
        role: role.trim(),
        category,
        salary: salary.trim(),
        area: area.trim(),
        location: location.trim(),
        contactNumber: cleanPhone,
        description: description.trim(),
      });

      setIsSubmitting(false);
      setIsSubmitted(true);

      // Reset form fields
      setBusinessName('');
      setRole('');
      setCategory('');
      setSalary('');
      setArea(userArea !== 'All' ? userArea : '');
      setLocation('');
      setContactNumber('');
      setDescription('');
    }, 800);
  };

  if (isSubmitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl p-8 border-2 border-orange-100 shadow-xl max-w-xl mx-auto text-center"
        id="job-post-success-panel"
      >
        <div className="w-16 h-16 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-orange-250">
          <CheckCircle className="w-10 h-10 animate-bounce" />
        </div>
        
        <h3 className="text-xl font-black text-slate-800 font-sans tracking-tight mb-3">
          {currentLanguage === 'en' ? 'Job Published Successfully!' : 'வேலை வெற்றிகரமாகப் பதியப்பட்டது!'}
        </h3>
        
        <p className="text-sm text-slate-500 leading-relaxed mb-8 font-medium">
          {t.successMessage}
        </p>

        <button
          onClick={() => setIsSubmitted(false)}
          id="post-another-job-btn"
          className="w-full sm:w-auto px-6 py-3 bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white rounded-xl text-sm font-black font-sans uppercase tracking-wide transition-all shadow-xs cursor-pointer"
        >
          {currentLanguage === 'en' ? 'Post Another Job' : 'இன்னொரு வேலை போஸ்ட் செய்'}
        </button>
      </motion.div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 border-2 border-slate-100 shadow-sm max-w-2xl mx-auto" id="job-post-form-panel">
      <div className="mb-6">
        <h2 className="text-xl font-black text-slate-800 font-sans tracking-tight mb-1">
          {t.postJobTitle}
        </h2>
        <p className="text-sm text-slate-500 font-sans font-medium">
          {t.postJobSubtitle}
        </p>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 mb-6 bg-rose-50 border border-rose-150 text-rose-700 rounded-xl text-xs font-bold font-sans flex items-center gap-2"
          id="job-form-error-banner"
        >
          <span>⚠️</span> {error}
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Business Name */}
        <div>
          <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2 font-sans">
            {t.businessNameLabel} <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <Building className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder={t.businessNamePlaceholder}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-slate-200 focus:border-orange-500 focus:bg-white rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden transition-all"
              id="form-business-name"
              required
            />
          </div>
        </div>

        {/* Job Title / Role */}
        <div>
          <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2 font-sans">
            {t.roleLabel} <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <User className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder={t.rolePlaceholder}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-slate-200 focus:border-orange-500 focus:bg-white rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden transition-all"
              id="form-job-role"
              required
            />
          </div>
        </div>

        {/* Category Buttons */}
        <div>
          <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2.5 font-sans">
            {t.categoryLabel} <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id)}
                id={`form-category-btn-${cat.id}`}
                className={`flex items-center gap-2 p-3 text-left rounded-xl border-2 text-xs font-bold transition-all cursor-pointer ${
                  category === cat.id
                    ? 'bg-orange-600 border-orange-600 text-white'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className="font-sans shrink-0">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Salary */}
          <div>
            <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2 font-sans">
              {t.salaryLabel} <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-3 text-sm font-black text-slate-400">₹</span>
              <input
                type="text"
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                placeholder={t.salaryPlaceholder}
                className="w-full pl-8 pr-4 py-3 bg-slate-50 border-2 border-slate-200 focus:border-orange-500 focus:bg-white rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden transition-all"
                id="form-salary"
                required
              />
            </div>
          </div>

          {/* Location Area */}
          <div>
            <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2 font-sans">
              {t.areaLabel} <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder={t.areaPlaceholder}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-slate-200 focus:border-orange-500 focus:bg-white rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden transition-all"
                id="form-area"
                list="chennai-areas"
                required
              />
              <datalist id="chennai-areas">
                {COMMON_AREAS.map(a => (
                  <option key={a} value={a} />
                ))}
              </datalist>
            </div>
            
            {/* Quick-select chips */}
            <div className="mt-2 flex flex-wrap gap-1">
              {COMMON_AREAS.slice(0, 5).map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setArea(a)}
                  id={`form-quick-area-${a.toLowerCase().replace(/\s+/g, '-')}`}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-orange-50 hover:text-orange-700 text-[10px] font-bold text-slate-600 rounded-md border border-slate-200 hover:border-orange-200 transition-all cursor-pointer"
                >
                  {a}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Full Address */}
        <div>
          <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2 font-sans">
            {t.fullAddressLabel}
          </label>
          <div className="relative">
            <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder={t.fullAddressPlaceholder}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-slate-200 focus:border-orange-500 focus:bg-white rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden transition-all"
              id="form-address"
            />
          </div>
        </div>

        {/* Contact Mobile Number */}
        <div>
          <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2 font-sans">
            {t.contactLabel} <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <Phone className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
            <input
              type="tel"
              value={contactNumber}
              onChange={(e) => setContactNumber(e.target.value)}
              placeholder={t.contactPlaceholder}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-slate-200 focus:border-orange-500 focus:bg-white rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden transition-all"
              id="form-contact-phone"
              maxLength={15}
              required
            />
          </div>
        </div>

        {/* Job Description & Timings */}
        <div>
          <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2 font-sans">
            {t.descriptionLabel} <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <FileText className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t.descriptionPlaceholder}
              rows={4}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-slate-200 focus:border-orange-500 focus:bg-white rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden transition-all resize-none font-sans"
              id="form-description"
              required
            />
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          id="job-form-submit-btn"
          className="w-full flex items-center justify-center gap-2 py-4 bg-orange-600 hover:bg-orange-700 active:bg-orange-800 disabled:bg-orange-400 text-white font-black font-sans tracking-wide uppercase rounded-xl text-sm transition-all cursor-pointer shadow-xs"
        >
          <PlusCircle className="w-5 h-5" />
          {isSubmitting ? t.submitting : t.submitButton}
        </button>
      </form>
    </div>
  );
}
