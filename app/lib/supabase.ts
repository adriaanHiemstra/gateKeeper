// app/lib/supabase.ts
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// ⚠️ REPLACE THESE WITH YOUR ACTUAL KEYS FROM SUPABASE
const supabaseUrl = 'https://dkhwiqdpbnubllcfvfgm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRraHdpcWRwYm51YmxsY2Z2ZmdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxNzY4ODYsImV4cCI6MjA3OTc1Mjg4Nn0.OdE0Cpgd9C-ycMM34reHxkHdSAZnQHSY4UIhGv06D0M';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
