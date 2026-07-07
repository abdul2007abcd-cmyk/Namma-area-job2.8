/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Job {
  id: string;
  businessName: string;
  role: string;
  category: string;
  salary: string;
  location: string;
  area: string; // The specific Chennai area, e.g., 'Velachery', 'Anna Nagar'
  contactNumber: string;
  description: string;
  postedAt: string; // ISO String or Date
  isCustom?: boolean; // True if posted by the user in their current browser
}

export type Language = 'en' | 'ta';

export interface TranslationSet {
  // Brand
  brandName: string;
  tagline: string;
  communityNotice: string;
  
  // Area Selection
  welcomeTitle: string;
  welcomeSubtitle: string;
  enterAreaPlaceholder: string;
  suggestedAreas: string;
  setAreaButton: string;
  changeArea: string;
  allAreas: string;
  
  // Navigation & Tabs
  browseJobsTab: string;
  postJobTab: string;
  
  // Browsing & Filtering
  searchPlaceholder: string;
  categoryLabel: string;
  noJobsFound: string;
  matchingJobs: string;
  nearbyJobs: string;
  postedOn: string;
  
  // Job Card Action
  callNow: string;
  whatsappMessage: string;
  whatsappTextTemplate: string;
  shareJob: string;
  deleteJob: string;
  
  // Job Form
  postJobTitle: string;
  postJobSubtitle: string;
  businessNameLabel: string;
  businessNamePlaceholder: string;
  roleLabel: string;
  rolePlaceholder: string;
  salaryLabel: string;
  salaryPlaceholder: string;
  areaLabel: string;
  areaPlaceholder: string;
  fullAddressLabel: string;
  fullAddressPlaceholder: string;
  contactLabel: string;
  contactPlaceholder: string;
  descriptionLabel: string;
  descriptionPlaceholder: string;
  submitButton: string;
  submitting: string;
  successMessage: string;
  validationError: string;
  phoneValidationError: string;
  
  // Footer
  footerText: string;
  madeForChennai: string;
}
