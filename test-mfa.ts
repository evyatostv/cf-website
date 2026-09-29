import { supabase } from './src-2/lib/supabase.ts';

async function test() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'contact@clinic-flow.co.il', // Or whatever test user
    password: 'password'
  });
  console.log(data, error);
}
test();
