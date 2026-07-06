import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://ysivkhwtwsrupkbkrlvv.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlzaXZraHd0d3NydXBrYmtybHZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzMjk0ODEsImV4cCI6MjA5ODkwNTQ4MX0.nlPFkCRaZNVoaQ1PG5VRCIMyDWD7KMo6skWjHn96N_Y');
supabase.from('jobs').select('*').limit(1).then(console.log).catch(console.error);
