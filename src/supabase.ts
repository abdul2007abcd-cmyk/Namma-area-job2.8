/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient } from '@supabase/supabase-js';
import { Job } from './types';
import { SEED_JOBS } from './data/seedJobs';

// For browser fallback & compatibility, we still instantiate a client,
// but we will prioritize routing all operations safely through our server-side API proxy.
const supabaseUrl = 'https://uedogqtaxjlgoyhjndjz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVlZG9ncXRheGpsZ295aGpuZGp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMyNjA4NzksImV4cCI6MjA5ODgzNjg3OX0.KtIBjD1guSlZwz89RLhYzC1oMVvJgV52y8CDCy7pOak';

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
 * Fetches all jobs from our server-side proxy which communicates directly with Supabase.
 */
export async function fetchSupabaseJobs(): Promise<{ jobs: Job[]; status: SupabaseSyncStatus }> {
  try {
    const response = await fetch('/api/jobs');
    if (!response.ok) {
      throw new Error(`Server proxy returned ${response.status}`);
    }
    const data = await response.json();
    return {
      jobs: data.jobs || [],
      status: data.status || { connected: false, tableExists: false }
    };
  } catch (err: any) {
    console.error('Failed to fetch from server proxy:', err);
    return {
      jobs: [],
      status: {
        connected: false,
        tableExists: false,
        error: err.message || 'Server connection failure'
      }
    };
  }
}

/**
 * Inserts a single job via our server-side API proxy.
 */
export async function insertSupabaseJob(job: Job): Promise<void> {
  const response = await fetch('/api/jobs', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(job)
  });

  if (!response.ok) {
    const errMessage = await response.text();
    throw new Error(errMessage || `Server proxy failed to insert with status ${response.status}`);
  }
}

/**
 * Resets the jobs database via our server-side API proxy.
 */
export async function resetSupabaseJobs(): Promise<void> {
  const response = await fetch('/api/reset', {
    method: 'POST'
  });

  if (!response.ok) {
    const errMessage = await response.text();
    throw new Error(errMessage || `Server proxy failed to reset with status ${response.status}`);
  }
}

/**
 * Seeds the Supabase database via our server-side API proxy.
 */
export async function seedSupabaseDatabase(): Promise<boolean> {
  try {
    const response = await fetch('/api/seed', {
      method: 'POST'
    });
    return response.ok;
  } catch (e) {
    console.warn('Failed to call seed endpoint:', e);
    return false;
  }
}
