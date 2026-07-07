/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Phone, MessageSquare, MapPin, Building2, Calendar, Share2 } from 'lucide-react';
import { Job, Language } from '../types';
import { translations, AREA_MAPPINGS } from '../translations';
import { motion } from 'motion/react';

interface JobCardProps {
  key?: string;
  job: Job;
  userArea: string;
  currentLanguage: Language;
}

// Function to calculate relative posted time
function getRelativeTime(postedAtStr: string, currentLang: Language): string {
  const diffMs = Date.now() - new Date(postedAtStr).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (currentLang === 'ta') {
    if (diffMins < 60) return `${diffMins <= 1 ? 1 : diffMins} நிமிடம் முன்`;
    if (diffHours < 24) return `${diffHours} மணிநேரம் முன்`;
    return `${diffDays <= 1 ? 1 : diffDays} நாள் முன்`;
  } else {
    if (diffMins < 60) return `${diffMins <= 1 ? 'Just now' : `${diffMins}m ago`}`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays <= 1 ? 'Yesterday' : `${diffDays}d ago`}`;
  }
}

// Category emoji or visual accent
function getCategoryIcon(category: string): string {
  switch (category) {
    case 'cashier_sales':
      return '🛒';
    case 'delivery_driving':
      return '🛵';
    case 'hotel_kitchen':
      return '🍳';
    case 'helper_office':
      return '👔';
    case 'cleaning_security':
      return '🛡️';
    default:
      return '💼';
  }
}

const getCategoryStyles = (cat: string) => {
  switch (cat) {
    case 'cashier_sales':
      return 'bg-orange-50 text-orange-700 border border-orange-100';
    case 'delivery_driving':
      return 'bg-blue-50 text-blue-700 border border-blue-100';
    case 'hotel_kitchen':
      return 'bg-rose-50 text-rose-700 border border-rose-100';
    case 'helper_office':
      return 'bg-purple-50 text-purple-700 border border-purple-100';
    case 'cleaning_security':
      return 'bg-yellow-50 text-yellow-800 border border-yellow-100';
    default:
      return 'bg-slate-50 text-slate-700 border border-slate-100';
  }
};

export default function JobCard({ job, userArea, currentLanguage }: JobCardProps) {
  const t = translations[currentLanguage];
  const relativeTime = getRelativeTime(job.postedAt, currentLanguage);

  const isNearby = userArea !== 'All' && job.area.toLowerCase() === userArea.toLowerCase();
  const displayTamilArea = AREA_MAPPINGS[job.area] || job.area;

  // Sanitize phone number: keep only digits, ensure it is 10 digits
  const rawDigits = job.contactNumber.replace(/\D/g, '');
  const cleanNumber = rawDigits.length > 10 ? rawDigits.slice(-10) : rawDigits;

  // Format WhatsApp Link
  const encodedMsg = encodeURIComponent(
    t.whatsappTextTemplate.replace('{role}', job.role)
  );
  const whatsappUrl = `https://wa.me/91${cleanNumber}?text=${encodedMsg}`;
  const telUrl = `tel:+91${cleanNumber}`;

  // Copy or share link to friends
  const handleShare = async () => {
    const isTa = currentLanguage === 'ta';
    const titleText = `${job.role} - ${job.businessName}`;
    const shareText = isTa 
      ? `📢 *புது வேலைவாய்ப்பு!* 📢\n\n💼 *வேலை:* ${job.role}\n🏢 *நிறுவனம்:* ${job.businessName}\n💵 *சம்பளம்:* ${job.salary}\n📍 *இடம்:* ${job.area}\n📞 *தொடர்புக்கு:* ${job.contactNumber}\n\nஉடனே விண்ணப்பிக்க நம்ம ஏரியா ஜாப் தளத்திற்கு வரவும்:\n🔗 ${window.location.href}`
      : `📢 *New Job Opening!* 📢\n\n💼 *Role:* ${job.role}\n🏢 *Shop:* ${job.businessName}\n💵 *Salary:* ${job.salary}\n📍 *Location:* ${job.area}\n📞 *Contact:* ${job.contactNumber}\n\nApply directly via Namma Area Job:\n🔗 ${window.location.href}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: titleText,
          text: shareText,
          url: window.location.href
        });
        return;
      }
    } catch (e) {
      console.warn('Web Share API error, falling back:', e);
    }

    // Fallback: Open WhatsApp link to send to friends
    const encodedShareText = encodeURIComponent(shareText);
    const whatsappShareUrl = `https://api.whatsapp.com/send?text=${encodedShareText}`;
    
    const link = document.createElement('a');
    link.href = whatsappShareUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.25 }}
      id={`job-card-${job.id}`}
      className={`bg-white rounded-2xl border-2 ${
        isNearby ? 'border-orange-500 ring-4 ring-orange-50' : 'border-slate-100 hover:border-orange-250'
      } p-5 hover:shadow-md transition-all flex flex-col justify-between`}
    >
      <div>
        {/* Card Header: Category & Proximity Highlight */}
        <div className="flex justify-between items-center gap-2 mb-3">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider font-sans ${getCategoryStyles(job.category)}`}>
            <span className="text-sm shrink-0">{getCategoryIcon(job.category)}</span>
            {job.category === 'all'
              ? ''
              : currentLanguage === 'en'
              ? job.category.replace('_', ' & ').toUpperCase()
              : translations['ta'].brandName /* placeholder or handled inside parent */}
          </span>

          <div className="flex items-center gap-1.5">
            {isNearby && (
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-orange-600 text-[10px] font-black text-white uppercase tracking-wider animate-pulse">
                📍 {currentLanguage === 'en' ? 'YOUR AREA' : 'உங்கள் ஏரியா'}
              </span>
            )}
            {job.isCustom && (
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-slate-700 text-[10px] font-black text-white uppercase tracking-wider">
                ✨ {currentLanguage === 'en' ? 'NEW' : 'புதியது'}
              </span>
            )}
          </div>
        </div>

        {/* Job Title & Shop Name */}
        <h3 className="text-lg font-black text-slate-800 font-sans tracking-tight mb-1 leading-snug">
          {job.role}
        </h3>
        
        <div className="flex items-center gap-1.5 text-slate-500 mb-3.5">
          <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="text-sm font-bold font-sans">{job.businessName}</span>
        </div>

        {/* Salary & Area indicators */}
        <div className="flex flex-col gap-1.5 mb-4">
          <div className="flex items-center text-green-600 font-black text-lg font-sans">
            💵 {job.salary}
          </div>

          <div className="inline-flex items-center gap-1 text-xs font-bold text-slate-400">
            <MapPin className="w-3.5 h-3.5 text-slate-300 shrink-0" />
            <span className="font-sans">
              {currentLanguage === 'en' ? job.area : displayTamilArea}
            </span>
          </div>
        </div>

        {/* Description / Timing Details */}
        <p className="text-sm text-slate-600 font-sans leading-relaxed mb-4 whitespace-pre-line bg-slate-50/50 p-3 rounded-xl border border-slate-100">
          {job.description}
        </p>

        {/* Full Address details if provided */}
        {job.location && (
          <div className="text-[11px] text-slate-400 font-sans flex items-start gap-1 mb-4">
            <span className="font-bold uppercase shrink-0">Address:</span>
            <span className="italic">{job.location}</span>
          </div>
        )}
      </div>

      {/* Footer info & Direct Connection actions */}
      <div className="mt-2 pt-4 border-t border-slate-100">
        <div className="flex justify-between items-center mb-3 text-xs text-slate-400">
          <span className="flex items-center gap-1 font-medium">
            <Calendar className="w-3.5 h-3.5" />
            {t.postedOn}: {relativeTime}
          </span>
        </div>

        {/* Core Mobile Actions (Direct Call / WhatsApp) */}
        <div className="flex gap-2 mt-auto">
          {/* WhatsApp button */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            id={`whatsapp-action-${job.id}`}
            className="flex-1 flex items-center justify-center gap-1.5 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-sm transition-all active:scale-95 cursor-pointer text-center"
          >
            <MessageSquare className="w-4 h-4 text-white shrink-0" />
            {t.whatsappMessage}
          </a>

          {/* Call button */}
          <a
            href={telUrl}
            id={`call-action-${job.id}`}
            className="flex-1 flex items-center justify-center gap-1.5 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold text-sm transition-all active:scale-95 cursor-pointer text-center"
          >
            <Phone className="w-4 h-4 text-white shrink-0" />
            {t.callNow}
          </a>
        </div>

        {/* Share with Friends prominent action */}
        <button
          onClick={handleShare}
          id={`share-action-${job.id}`}
          className="w-full flex items-center justify-center gap-2 mt-2 py-2.5 bg-blue-50/75 hover:bg-blue-100 text-blue-700 rounded-xl font-bold text-xs uppercase tracking-wider transition-all active:scale-95 cursor-pointer text-center border border-blue-100"
        >
          <Share2 className="w-4 h-4 shrink-0" />
          {t.shareJob}
        </button>
      </div>
    </motion.div>
  );
}
