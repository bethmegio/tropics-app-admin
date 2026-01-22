// src/supabase.js - Complete version with admin client
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://ohcpyffkzopsmktqudlh.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9oY3B5ZmZrem9wc21rdHF1ZGxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyNzY3MzIsImV4cCI6MjA3Njg1MjczMn0.tJdZYRYbhxZSzI8NAHKTnHyXnQ2Cm7HNrIry3jwBXrU';
const supabaseServiceKey = process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9oY3B5ZmZrem9wc21rdHF1ZGxoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTI3NjczMiwiZXhwIjoyMDc2ODUyNzMyfQ.mKe_yGVoPzYvVb9hre0vr1yL4qj5yXxKE6m2DmtC7PA';

// Regular client for normal operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Admin client for admin operations (has service_role key)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});