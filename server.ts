/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';
import { SEED_JOBS } from './src/data/seedJobs.js';

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Supabase Client
const supabaseUrl = 'https://ysivkhwtwsrupkbkrlvv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlzaXZraHd0d3NydXBrYmtybHZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzMjk0ODEsImV4cCI6MjA5ODkwNTQ4MX0.nlPFkCRaZNVoaQ1PG5VRCIMyDWD7KMo6skWjHn96N_Y';

const supabase = createClient(supabaseUrl, supabaseKey);

// In-memory fallback to guarantee working operations even if tables are not set up yet
let localJobsFallback = [...SEED_JOBS];

// SQL instructions to display when the user has not set up the jobs table
const SUGGESTED_SQL = `
CREATE TABLE IF NOT EXISTS jobs (
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
);
`;

// GET all jobs
app.get('/api/jobs', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .order('postedAt', { ascending: false });

    if (error) {
      console.log('Database fallback: retrieving jobs locally.');
      return res.json({ 
        jobs: localJobsFallback, 
        usingFallback: true, 
        error: error.message,
        sqlHelp: SUGGESTED_SQL 
      });
    }

    if (!data || data.length === 0) {
      console.log('Seeding table with default records...');
      const { error: seedError } = await supabase
        .from('jobs')
        .insert(SEED_JOBS.map(job => ({
          id: job.id,
          businessName: job.businessName,
          role: job.role,
          category: job.category,
          salary: job.salary,
          location: job.location,
          area: job.area,
          contactNumber: job.contactNumber,
          description: job.description,
          postedAt: job.postedAt,
          isCustom: false
        })));

      if (seedError) {
        console.log('Database fallback: seeding table offline, loading locally.');
        return res.json({ jobs: localJobsFallback, usingFallback: true, error: seedError.message });
      }

      // Re-fetch
      const { data: seededData } = await supabase
        .from('jobs')
        .select('*')
        .order('postedAt', { ascending: false });

      return res.json({ jobs: seededData || localJobsFallback, usingFallback: false });
    }

    return res.json({ jobs: data, usingFallback: false });
  } catch (err: any) {
    console.log('Database fallback: retrieving jobs locally.');
    return res.json({ jobs: localJobsFallback, usingFallback: true, error: err.message || String(err), sqlHelp: SUGGESTED_SQL });
  }
});

// POST a new job
app.post('/api/jobs', async (req, res) => {
  const { businessName, role, category, salary, location, area, contactNumber, description } = req.body;

  if (!businessName || !role || !category || !salary || !location || !area || !contactNumber || !description) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const newJob = {
    id: `job-${Date.now()}`,
    businessName,
    role,
    category,
    salary,
    location,
    area,
    contactNumber,
    description,
    postedAt: new Date().toISOString(),
    isCustom: true
  };

  try {
    const { data, error } = await supabase
      .from('jobs')
      .insert([newJob])
      .select();

    if (error) {
      console.log('Database fallback: adding job posting locally.');
      localJobsFallback.unshift(newJob);
      return res.json({ job: newJob, usingFallback: true, error: error.message, sqlHelp: SUGGESTED_SQL });
    }

    localJobsFallback.unshift(newJob);
    return res.json({ job: data?.[0] || newJob, usingFallback: false });
  } catch (err: any) {
    console.log('Database fallback: adding job posting locally.');
    localJobsFallback.unshift(newJob);
    return res.json({ job: newJob, usingFallback: true, error: err.message || String(err), sqlHelp: SUGGESTED_SQL });
  }
});

// DELETE a custom job
app.delete('/api/jobs/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const { error } = await supabase
      .from('jobs')
      .delete()
      .eq('id', id);

    if (error) {
      console.log('Database fallback: deleting job locally.');
      localJobsFallback = localJobsFallback.filter(j => j.id !== id);
      return res.json({ success: true, usingFallback: true, error: error.message });
    }

    localJobsFallback = localJobsFallback.filter(j => j.id !== id);
    return res.json({ success: true, usingFallback: false });
  } catch (err: any) {
    console.log('Database fallback: deleting job locally.');
    localJobsFallback = localJobsFallback.filter(j => j.id !== id);
    return res.json({ success: true, usingFallback: true, error: err.message || String(err) });
  }
});

// POST to clean up expired custom jobs (older than 7 days)
app.post('/api/jobs/cleanup', async (req, res) => {
  try {
    const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
    const cutoffDate = new Date(Date.now() - sevenDaysInMs).toISOString();

    // Clean local fallback
    const now = Date.now();
    localJobsFallback = localJobsFallback.filter(j => {
      if (j.isCustom) {
        const postedTime = new Date(j.postedAt).getTime();
        return (now - postedTime) <= sevenDaysInMs;
      }
      return true;
    });

    const { error } = await supabase
      .from('jobs')
      .delete()
      .eq('isCustom', true)
      .lt('postedAt', cutoffDate);

    if (error) {
      console.log('Database fallback: local cleanup performed.');
      return res.json({ success: true, error: error.message });
    }

    return res.json({ success: true });
  } catch (err: any) {
    console.log('Database fallback: local cleanup performed.');
    return res.json({ success: true, error: err.message || String(err) });
  }
});

// Simple health API endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
