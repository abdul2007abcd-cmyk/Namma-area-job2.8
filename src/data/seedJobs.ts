/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Job } from '../types';

export const SEED_JOBS: Job[] = [
  {
    id: 'seed-1',
    businessName: 'Sri Ram Supermarket',
    role: 'Billing Cashier (Female/Male)',
    category: 'cashier_sales',
    salary: '₹14,500/month',
    location: '12, Taramani Link Road, Velachery (Near Bus Stand)',
    area: 'Velachery',
    contactNumber: '9840123456',
    description: 'Looking for an active billing clerk. Basic computer knowledge needed. Shift: 9:00 AM to 9:00 PM. Weekly one day off. Tamil speaking is mandatory.',
    postedAt: new Date(Date.now() - 3600000 * 4).toISOString(), // 4 hours ago
  },
  {
    id: 'seed-2',
    businessName: 'Ganesh Medicals',
    role: 'Home Delivery Executive',
    category: 'delivery_driving',
    salary: '₹12,000/month + Petrol',
    location: '45, 2nd Avenue, Anna Nagar East',
    area: 'Anna Nagar',
    contactNumber: '9176123456',
    description: 'Delivery boy needed for delivering medicines nearby. Must have own two-wheeler and valid driving license. Android phone required. Timings: 10 AM to 8 PM.',
    postedAt: new Date(Date.now() - 3600000 * 12).toISOString(), // 12 hours ago
  },
  {
    id: 'seed-3',
    businessName: 'Aura Fancy & Boutique',
    role: 'Female Sales Assistant',
    category: 'cashier_sales',
    salary: '₹11,000/month',
    location: 'F-Block, 3rd Avenue, Anna Nagar',
    area: 'Anna Nagar',
    contactNumber: '9884123456',
    description: 'Looking for a friendly retail sales helper. Should assist customers in choosing sarees, dresses, and cosmetics. Experience is a plus but not required. Time: 10:30 AM to 8:30 PM.',
    postedAt: new Date(Date.now() - 3600000 * 24).toISOString(), // 1 day ago
  },
  {
    id: 'seed-4',
    businessName: 'Sri Karpagambal Mess',
    role: 'Kitchen Assistant / Helper',
    category: 'hotel_kitchen',
    salary: '₹450/day + Free Food',
    location: 'East Mada Street, Mylapore (Opp. Temple)',
    area: 'Mylapore',
    contactNumber: '9444123456',
    description: 'Urgent requirement for cutting vegetables, washing dishes, and helping the master chef. High-quality vegetarian food and tea provided. Daily salary system. Shift: 6 AM to 3 PM.',
    postedAt: new Date(Date.now() - 3600000 * 18).toISOString(), // 18 hours ago
  },
  {
    id: 'seed-5',
    businessName: 'Saravana Textiles & Readymades',
    role: 'Store Assistant / Helper',
    category: 'helper_office',
    salary: '₹10,500/month',
    location: 'Ranganathan Street, T Nagar',
    area: 'T Nagar',
    contactNumber: '9003123456',
    description: 'Helper role to arrange clothes, stock boxes, and assist sales staff. Heavy crowd area, candidate must be energetic. Daily lunch provided.',
    postedAt: new Date(Date.now() - 3600000 * 30).toISOString(), // 1.2 days ago
  },
  {
    id: 'seed-6',
    businessName: 'Adyar Ananda Bhavan (A2B)',
    role: 'Table Service / Waiter',
    category: 'hotel_kitchen',
    salary: '₹15,000/month + Tips',
    location: 'Sardar Patel Road, Adyar (Near Flyover)',
    area: 'Adyar',
    contactNumber: '9962123456',
    description: 'We are hiring polite and energetic waiters. Serving food, cleaning tables, and maintaining restaurant hygiene. Uniform, accommodation, and food provided free.',
    postedAt: new Date(Date.now() - 3600000 * 8).toISOString(), // 8 hours ago
  },
  {
    id: 'seed-7',
    businessName: 'Vasanth Electricals',
    role: 'Delivery Driver (Tata Ace / Auto)',
    category: 'delivery_driving',
    salary: '₹16,500/month',
    location: '18, GST Road, Tambaram',
    area: 'Tambaram',
    contactNumber: '9841123456',
    description: 'Driver required to transport home appliances. Must have heavy commercial driving license (yellow board). Safe driving is essential. Shift: 9:30 AM to 7:30 PM.',
    postedAt: new Date(Date.now() - 3600000 * 48).toISOString(), // 2 days ago
  },
  {
    id: 'seed-8',
    businessName: 'Leo Coffee & Tea House',
    role: 'Counter Sales / Tea Maker',
    category: 'hotel_kitchen',
    salary: '₹10,000/month',
    location: 'Luz Corner, Mylapore',
    area: 'Mylapore',
    contactNumber: '9840234567',
    description: 'Urgent opening for a friendly person to brew and serve filter coffee/tea and manage snacks counter. Cleanliness is very important. Work shift: 7 AM to 1 PM, 4 PM to 8 PM.',
    postedAt: new Date(Date.now() - 3600000 * 3).toISOString(), // 3 hours ago
  },
  {
    id: 'seed-9',
    businessName: 'Rajan & Co Stationary',
    role: 'Office Helper & Packager',
    category: 'helper_office',
    salary: '₹11,500/month',
    location: 'Nungambakkam High Road',
    area: 'Nungambakkam',
    contactNumber: '9176234567',
    description: 'Helping with unpacking book bundles, arranging stationery on shelves, and packaging home deliveries. Safe working environment. Shift: 10 AM to 8 PM.',
    postedAt: new Date(Date.now() - 3600000 * 15).toISOString(), // 15 hours ago
  },
  {
    id: 'seed-10',
    businessName: 'Grand Mall Security',
    role: 'Day/Night Security Guard',
    category: 'cleaning_security',
    salary: '₹13,000/month',
    location: 'Velachery Bypass Road, Velachery',
    area: 'Velachery',
    contactNumber: '9940123456',
    description: 'Hiring security guards for mall entrance and parking lot. Good health and basic discipline are required. Ex-servicemen preferred but others can also apply. 12-hour rotating shifts.',
    postedAt: new Date(Date.now() - 3600000 * 36).toISOString(), // 1.5 days ago
  },
  {
    id: 'seed-11',
    businessName: 'Metro Dry Cleaners',
    role: 'Ironing & Packing Worker',
    category: 'cleaning_security',
    salary: '₹12,500/month',
    location: '40, Eldams Road, T Nagar',
    area: 'T Nagar',
    contactNumber: '9841234567',
    description: 'Need experienced ironing person (steam/normal iron) for dry cleaning shop. Speed and careful handling of clothes are crucial. Timings: 9 AM to 8:30 PM.',
    postedAt: new Date(Date.now() - 3600000 * 6).toISOString(), // 6 hours ago
  },
  {
    id: 'seed-12',
    businessName: 'Blue Star Logistics',
    role: 'Warehouse Delivery Boy',
    category: 'delivery_driving',
    salary: '₹13,500/month + Petrol Incentives',
    location: 'Guindy Industrial Estate',
    area: 'Guindy',
    contactNumber: '9003234567',
    description: 'Package sorting and neighborhood delivery in Guindy & Saidapet. Two-wheeler must. Smartphones and data pack charges reimbursed. Direct joining, no fees.',
    postedAt: new Date(Date.now() - 3600000 * 22).toISOString(), // 22 hours ago
  }
];
