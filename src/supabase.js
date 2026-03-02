import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://ntiriwbdghtxhdmhejdj.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im50aXJpd2JkZ2h0eGhkbWhlamRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyODcwMzAsImV4cCI6MjA4Njg2MzAzMH0.rTdXXuTas2agenq_uCy_kxu-_H3ZxRDHaAGQmqdmT0U";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);