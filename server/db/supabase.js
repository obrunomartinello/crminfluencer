const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') })

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || supabaseUrl.includes('xxxx')) {
  console.warn('[supabase] ⚠️  SUPABASE_URL não configurado — banco desativado. Configure o .env')
}

const supabase = supabaseUrl && !supabaseUrl.includes('xxxx') && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null

module.exports = supabase

