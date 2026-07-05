/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient } from '@supabase/supabase-js';
import { Job } from './types';
import { SEED_JOBS } from './data/seedJobs';

// We fetch credentials from Vite env or fallback to user-provided values
const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || 'https://ltxpifavwbejpbedpgro.supabase.co';
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0eHBpZmF2d2JlanBiZWRwZ3JvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMxMjc0NTEsImV4cCI6MjA5ODcwMzQ1MX0._HdCCS2AGOjcCe1peNm63Se4yQzJaqlw3FaAGXYF1a8';


export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface SupabaseSyncStatus {
  connected: boolean;
  tableExists: boolean;
  error?: string;
  isSeeded?: boolean;
}

/**
 * Maps any database row (whether camelCase or snake_case) to our application's Job interface.
 */
export function mapSupabaseJob(row: any): Job {
  return {
    id: String(row.id || ''),
    businessName: row.businessName || row.business_name || '',
    role: row.role || '',
    category: row.category || '',
    salary: row.salary || '',
    location: row.location || '',
    area: row.area || '',
    contactNumber: row.contactNumber || row.contact_number || row.contactnumber || '',
    description: row.description || '',
    postedAt: row.postedAt || row.posted_at || new Date().toISOString(),
    isCustom: true
  };
}

/**
 * Fetches all jobs from the Supabase "jobs" table.
 * If the table is empty, it attempts to seed it with the local SEED_JOBS.
 */
export async function fetchSupabaseJobs(): Promise<{ jobs: Job[]; status: SupabaseSyncStatus }> {
  try {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .order('posted_at', { ascending: false })
      .order('postedAt', { ascending: false }); // Try both sorting parameters gracefully

    if (error) {
      // 42P01 is Postgres code for "relation does not exist"
      const isMissingTable = error.code === '42P01' || error.message?.includes('relation "jobs" does not exist');
      return {
        jobs: [],
        status: {
          connected: !isMissingTable,
          tableExists: false,
          error: isMissingTable ? 'Table "jobs" does not exist in your Supabase database.' : error.message
        }
      };
    }

    if (!data || data.length === 0) {
      // Database connected and table exists, but it's empty. Let's try seeding it!
      const seeded = await seedSupabaseDatabase();
      return {
        jobs: SEED_JOBS,
        status: {
          connected: true,
          tableExists: true,
          isSeeded: seeded
        }
      };
    }

    // Map rows to correct Job objects
    const mappedJobs = data.map(mapSupabaseJob);
    return {
      jobs: mappedJobs,
      status: {
        connected: true,
        tableExists: true
      }
    };
  } catch (err: any) {
    console.error('Failed to fetch from Supabase:', err);
    return {
      jobs: [],
      status: {
        connected: false,
        tableExists: false,
        error: err.message || 'Connection failure'
      }
    };
  }
}

/**
 * Inserts a single job into Supabase. It supports both snake_case and camelCase database structures.
 */
export async function insertSupabaseJob(job: Job): Promise<void> {
  // 1. Try snake_case columns (Standard Postgres convention)
  const snakeData = {
    id: job.id,
    business_name: job.businessName,
    role: job.role,
    category: job.category,
    salary: job.salary,
    location: job.location,
    area: job.area,
    contact_number: job.contactNumber,
    description: job.description,
    posted_at: job.postedAt
  };

  const { error: snakeError } = await supabase.from('jobs').insert([snakeData]);
  if (!snakeError) return;

  console.warn('Supabase insertion with snake_case failed, trying camelCase:', snakeError);

  // 2. Try camelCase columns (Alternative configuration)
  const camelData = {
    id: job.id,
    businessName: job.businessName,
    role: job.role,
    category: job.category,
    salary: job.salary,
    location: job.location,
    area: job.area,
    contactNumber: job.contactNumber,
    description: job.description,
    postedAt: job.postedAt
  };

  const { error: camelError } = await supabase.from('jobs').insert([camelData]);
  if (!camelError) return;

  throw new Error(camelError.message || 'Failed to publish to Supabase. Make sure your "jobs" table columns are correct.');
}

/**
 * Seeds the Supabase database with the default SEED_JOBS.
 */
export async function seedSupabaseDatabase(): Promise<boolean> {
  try {
    for (const job of SEED_JOBS) {
      // Attempt to insert each seed job
      const snakeData = {
        id: job.id,
        business_name: job.businessName,
        role: job.role,
        category: job.category,
        salary: job.salary,
        location: job.location,
        area: job.area,
        contact_number: job.contactNumber,
        description: job.description,
        posted_at: job.postedAt
      };

      const { error } = await supabase.from('jobs').insert([snakeData]);
      if (error) {
        // Try camelCase
        const camelData = {
          id: job.id,
          businessName: job.businessName,
          role: job.role,
          category: job.category,
          salary: job.salary,
          location: job.location,
          area: job.area,
          contactNumber: job.contactNumber,
          description: job.description,
          postedAt: job.postedAt
        };
        await supabase.from('jobs').insert([camelData]);
      }
    }
    return true;
  } catch (e) {
    console.warn('Failed to seed Supabase database:', e);
    return false;
  }
}
