import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ override: true });

const app = express();
const PORT = 3000;

app.use(express.json());

// Sanitize inputs to strip out any surrounding quotes that might have been loaded
const rawUrl = process.env.VITE_SUPABASE_URL || 'https://uedogqtaxjlgoyhjndjz.supabase.co';
const rawKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVlZG9ncXRheGpsZ295aGpuZGp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMyNjA4NzksImV4cCI6MjA5ODgzNjg3OX0.KtIBjD1guSlZwz89RLhYzC1oMVvJgV52y8CDCy7pOak';

const supabaseUrl = rawUrl.replace(/^['"]|['"]$/g, '');
const supabaseAnonKey = rawKey.replace(/^['"]|['"]$/g, '');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const SEED_JOBS = [
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
    postedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
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
    postedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
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
    postedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
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
    postedAt: new Date(Date.now() - 3600000 * 18).toISOString(),
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
    postedAt: new Date(Date.now() - 3600000 * 30).toISOString(),
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
    postedAt: new Date(Date.now() - 3600000 * 8).toISOString(),
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
    postedAt: new Date(Date.now() - 3600000 * 48).toISOString(),
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
    postedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
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
    postedAt: new Date(Date.now() - 3600000 * 15).toISOString(),
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
    postedAt: new Date(Date.now() - 3600000 * 36).toISOString(),
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
    postedAt: new Date(Date.now() - 3600000 * 6).toISOString(),
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
    postedAt: new Date(Date.now() - 3600000 * 22).toISOString(),
  }
];

function mapRow(row: any) {
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

async function seedDatabase(): Promise<boolean> {
  try {
    for (const job of SEED_JOBS) {
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
    console.warn('Failed to seed:', e);
    return false;
  }
}

// API Routes
app.get('/api/jobs', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .order('posted_at', { ascending: false });

    if (error) {
      const isMissingTable = error.code === '42P01' || 
                             error.code === 'PGRST116' || 
                             error.message?.includes('relation "jobs" does not exist') || 
                             error.message?.includes('does not exist') ||
                             error.message?.includes('not found');
      return res.json({
        jobs: [],
        status: {
          connected: true,
          tableExists: !isMissingTable,
          error: isMissingTable ? 'Table "jobs" does not exist in your Supabase database.' : error.message
        }
      });
    }

    if (!data || data.length === 0) {
      const seeded = await seedDatabase();
      return res.json({
        jobs: SEED_JOBS,
        status: {
          connected: true,
          tableExists: true,
          isSeeded: seeded
        }
      });
    }

    return res.json({
      jobs: data.map(mapRow),
      status: {
        connected: true,
        tableExists: true
      }
    });
  } catch (err: any) {
    console.error('Server error fetching jobs:', err);
    return res.json({
      jobs: [],
      status: {
        connected: false,
        tableExists: false,
        error: err.message || 'Server connection failure'
      }
    });
  }
});

app.post('/api/jobs', async (req, res) => {
  try {
    const job = req.body;
    
    // Try snake_case columns
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
    if (!snakeError) {
      return res.json({ success: true });
    }

    // Try camelCase columns
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
    if (!camelError) {
      return res.json({ success: true });
    }

    return res.status(400).send(camelError.message || 'Failed to publish to Supabase.');
  } catch (err: any) {
    console.error('Server error inserting job:', err);
    return res.status(500).send(err.message || 'Server error publishing job');
  }
});

app.post('/api/reset', async (req, res) => {
  try {
    const { error } = await supabase.from('jobs').delete().neq('id', 'keep_all');
    if (error) {
      return res.status(400).send(error.message);
    }
    return res.json({ success: true });
  } catch (err: any) {
    console.error('Server error resetting jobs:', err);
    return res.status(500).send(err.message || 'Server error resetting jobs');
  }
});

app.post('/api/seed', async (req, res) => {
  const success = await seedDatabase();
  if (success) {
    return res.json({ success: true });
  } else {
    return res.status(500).send('Seeding failed');
  }
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
