import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ltxnzkoxepocxihkoveo.supabase.co';
const supabaseKey = 'sb_publishable_OWp6fjURR9IUf0ZEKXjeAw_nrpCk0ar';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createUser() {
  const email = 'cafe.owner' + Math.floor(Math.random() * 10000) + '@dinova.com';
  const password = 'SuperSecretCafePassword2026!';
  
  const { data, error } = await supabase.auth.signUp({
    email: email,
    password: password,
  });

  if (error) {
    console.error('Error creating user:', error.message);
  } else {
    console.log('=== SUCCESS ===');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('User UID:', data.user?.id);
  }
}

createUser();
