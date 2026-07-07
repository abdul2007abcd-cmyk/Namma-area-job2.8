/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TranslationSet } from './types';

export const translations: Record<'en' | 'ta', TranslationSet> = {
  en: {
    brandName: 'Namma Area Job',
    tagline: 'Local jobs in your Chennai neighborhood',
    communityNotice: '📢 This is a free community board. Direct connections, no agents, no middleman charges!',
    
    welcomeTitle: 'Find Jobs Near You',
    welcomeSubtitle: 'Connecting local shops with people looking for work close to home. No accounts, no hassle.',
    enterAreaPlaceholder: 'Type your area in Chennai (e.g. Velachery)...',
    suggestedAreas: 'Popular Areas:',
    setAreaButton: 'Find Jobs',
    changeArea: 'Change Area',
    allAreas: 'All Areas',
    
    browseJobsTab: 'Browse Jobs 🔍',
    postJobTab: 'Post a Job 📝',
    
    searchPlaceholder: 'Search by role, shop name or area...',
    categoryLabel: 'Category',
    noJobsFound: 'No jobs found in this category or area. Try showing "All Areas" or searching for a different role.',
    matchingJobs: 'jobs available',
    nearbyJobs: 'Showing jobs near',
    postedOn: 'Posted',
    
    callNow: 'Call Shop',
    whatsappMessage: 'WhatsApp',
    whatsappTextTemplate: 'Hello, I saw your job posting on Namma Area Job for the role of {role}. Is this position still open?',
    shareJob: 'Share with Friends 📢',
    deleteJob: 'Delete Vacancy 🗑️',
    
    postJobTitle: 'Post a Free Job Listing',
    postJobSubtitle: 'Fill this simple form. Your job will be immediately visible to people in your area!',
    businessNameLabel: 'Shop / Business Name',
    businessNamePlaceholder: 'e.g. Sri Ram Supermarket, Mani Tea Stall',
    roleLabel: 'Job Role / Title',
    rolePlaceholder: 'e.g. Cashier, Delivery Boy, Helper, Waiter',
    salaryLabel: 'Salary (per month or day)',
    salaryPlaceholder: 'e.g. ₹12,000 / month, ₹400 / day',
    areaLabel: 'Chennai Area / Neighborhood',
    areaPlaceholder: 'e.g. Velachery, T Nagar, Anna Nagar',
    fullAddressLabel: 'Full Shop Address (Optional)',
    fullAddressPlaceholder: 'e.g. No 12, Main Road, Near Bus Stand',
    contactLabel: 'Mobile Number',
    contactPlaceholder: '10-digit mobile number for calls & WhatsApp',
    descriptionLabel: 'Details & Timings',
    descriptionPlaceholder: 'e.g. Shift: 9 AM to 8 PM. Experience not required. Food provided.',
    submitButton: 'Publish Job Now',
    submitting: 'Publishing...',
    successMessage: '✅ Your job has been posted successfully! Job seekers in your area can now contact you directly.',
    validationError: 'Please fill in all required fields.',
    phoneValidationError: 'Please enter a valid 10-digit mobile number.',
    
    footerText: 'Namma Area Job — A hyperlocal community initiative for Chennai.',
    madeForChennai: 'Made for Chennai with ❤️'
  },
  ta: {
    brandName: 'நம்ம ஏரியா ஜாப்',
    tagline: 'உங்க சென்னை ஏரியாவில் உள்ள உள்ளூர் வேலைகள்',
    communityNotice: '📢 இது ஒரு இலவச பொது அறிவிப்புப் பலகை. நேரடியாக வேலை தருபவருடன் பேசலாம், இடைத்தரகர்கள் இல்லை, கட்டணங்கள் இல்லை!',
    
    welcomeTitle: 'உங்கள் அருகில் உள்ள வேலைகளைத் தேடுங்கள்',
    welcomeSubtitle: 'உள்ளூர் கடைகளையும், வீட்டின் அருகே வேலை தேடுபவர்களையும் இணைக்கும் எளிய தளம். லாகின் தேவையில்லை.',
    enterAreaPlaceholder: 'உங்கள் ஏரியாவை டைப் செய்யவும் (எ.கா. வேளச்சேரி)...',
    suggestedAreas: 'பிரபலமான ஏரியாக்கள்:',
    setAreaButton: 'வேலைகளைக் காட்டு',
    changeArea: 'ஏரியாவை மாற்று',
    allAreas: 'அனைத்து ஏரியாக்கள்',
    
    browseJobsTab: 'வேலைகளைத் தேடு 🔍',
    postJobTab: 'வேலை வாய்ப்பைப் போஸ்ட் செய் 📝',
    
    searchPlaceholder: 'வேலை, கடை பெயர் அல்லது ஏரியா மூலம் தேடுக...',
    categoryLabel: 'வகை',
    noJobsFound: 'இந்த பகுதியில் அல்லது பிரிவில் வேலைகள் எதுவும் இல்லை. "அனைத்து ஏரியாக்கள்" கொடுத்துப் பார்க்கவும் அல்லது வேறு வேலை தேடவும்.',
    matchingJobs: 'வேலைகள் உள்ளன',
    nearbyJobs: 'பகுதியில் உள்ள வேலைகள்:',
    postedOn: 'பதிவு செய்யப்பட்டது',
    
    callNow: 'கடையில் பேச',
    whatsappMessage: 'வாட்ஸ்அப்',
    whatsappTextTemplate: 'வணக்கம், நம்ம ஏரியா ஜாப்-இல் நீங்கள் வெளியிட்ட {role} வேலைவாய்ப்பு விளம்பரத்தைப் பார்த்தேன். இந்த வேலை இன்னும் காலியாக உள்ளதா?',
    shareJob: 'நண்பர்களுக்குப் பகிர் 📢',
    deleteJob: 'விளம்பரத்தை நீக்கு 🗑️',
    
    postJobTitle: 'இலவச வேலைவாய்ப்பு விளம்பரம்',
    postJobSubtitle: 'இந்த எளிய படிவத்தை நிரப்பவும். உங்கள் ஏரியாவில் உள்ளவர்களுக்கு உங்கள் வேலை உடனே தெரியவரும்!',
    businessNameLabel: 'கடை / நிறுவனத்தின் பெயர்',
    businessNamePlaceholder: 'எ.கா. ஸ்ரீ ராம் சூப்பர் மார்க்கெட், மணி டீ ஸ்டால்',
    roleLabel: 'வேலையின் பெயர்',
    rolePlaceholder: 'எ.கா. கேஷியர், டெலிவரி பாய், உதவியாளர், சர்வர்',
    salaryLabel: 'சம்பளம் (மாதம் அல்லது நாள்)',
    salaryPlaceholder: 'எ.கா. ₹12,000 / மாதம், ₹400 / நாள்',
    areaLabel: 'சென்னை ஏரியா / பகுதி',
    areaPlaceholder: 'எ.கா. வேளச்சேரி, தி நகர், அண்ணா நகர்',
    fullAddressLabel: 'முழு முகவரி (விருப்பப்பட்டால்)',
    fullAddressPlaceholder: 'எ.கா. எண் 12, மெயின் ரோடு, பஸ் ஸ்டாண்ட் அருகில்',
    contactLabel: 'கைப்பேசி எண்',
    contactPlaceholder: 'அழைப்புகள் மற்றும் வாட்ஸ்அப்பிற்கான 10 இலக்க மொபைல் எண்',
    descriptionLabel: 'வேலை விவரங்கள் மற்றும் நேரம்',
    descriptionPlaceholder: 'எ.கா. நேரம்: காலை 9 மணி முதல் இரவு 8 மணி வரை. அனுபவம் தேவையில்லை. உணவு வழங்கப்படும்.',
    submitButton: 'வேலையைப் பதிவு செய்',
    submitting: 'பதிவு செய்யப்படுகிறது...',
    successMessage: '✅ உங்கள் வேலைவாய்ப்பு வெற்றிகரமாகப் பதியப்பட்டது! உங்கள் ஏரியாவில் உள்ளவர்கள் உங்களை நேரடியாகத் தொடர்பு கொள்வார்கள்.',
    validationError: 'தயவுசெய்து தேவையான அனைத்து விவரங்களையும் நிரப்பவும்.',
    phoneValidationError: 'தயவுசெய்து சரியான 10 இலக்க மொபைல் எண்ணை உள்ளிடவும்.',
    
    footerText: 'நம்ம ஏரியா ஜாப் — சென்னை மக்களுக்கான ஒரு உள்ளூர் சமூகத் தளம்.',
    madeForChennai: 'சென்னைக்காக அன்புடன் உருவாக்கப்பட்டது ❤️'
  }
};

export const CATEGORIES = {
  en: [
    { id: 'all', name: 'All Jobs' },
    { id: 'cashier_sales', name: 'Cashier & Sales' },
    { id: 'delivery_driving', name: 'Delivery & Driving' },
    { id: 'hotel_kitchen', name: 'Hotel & Kitchen' },
    { id: 'helper_office', name: 'Helper & Office Staff' },
    { id: 'cleaning_security', name: 'Cleaning & Security' },
  ],
  ta: [
    { id: 'all', name: 'அனைத்து வேலைகள்' },
    { id: 'cashier_sales', name: 'கேஷியர் & விற்பனை' },
    { id: 'delivery_driving', name: 'டெலிவரி & டிரைவிங்' },
    { id: 'hotel_kitchen', name: 'ஹோட்டல் & சமையல்' },
    { id: 'helper_office', name: 'உதவியாளர் & ஆபிஸ்' },
    { id: 'cleaning_security', name: 'சுத்தம் & செக்யூரிட்டி' },
  ]
};

// Map Chennai English areas to Tamil script for better display
export const AREA_MAPPINGS: Record<string, string> = {
  'Velachery': 'வேளச்சேரி',
  'Anna Nagar': 'அண்ணா நகர்',
  'T Nagar': 'தி நகர்',
  'Adyar': 'அடையார்',
  'Mylapore': 'மயிலாப்பூர்',
  'Tambaram': 'தாம்பரம்',
  'Guindy': 'கிண்டி',
  'Nungambakkam': 'நுங்கம்பாக்கம்',
  'Chromepet': 'குரோம்பேட்டை',
  'Saidapet': 'சைதாப்பேட்டை',
  'Royapettah': 'இராயப்பேட்டை',
  'Triplicane': 'திருவல்லிக்கேணி',
  'Porur': 'போரூர்',
  'Vadapalani': 'வடபழனி'
};
