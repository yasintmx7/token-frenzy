import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wwspygygkuutzzbhcyxf.supabase.co';
const supabaseAnonKey = 'sb_publishable_9qeF2kOpxUo_iNAA_xCEog_tMM02hxR';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
