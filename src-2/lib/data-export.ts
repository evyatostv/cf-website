import { supabase } from './supabase';
import type { User } from '@supabase/supabase-js';

// Personal-data export ("right to access / portability"). Everything here is
// readable by the user themselves under RLS (own rows only). Medical/clinic data
// lives on the user's own machine and is intentionally NOT part of this export.

export type UserDataExport = Record<string, unknown>;

// Run a Supabase query but never throw: on error we record the message so the
// export still succeeds for the tables that ARE readable (a missing table or a
// stricter RLS policy shouldn't block the whole download).
async function safe(p: PromiseLike<{ data: unknown; error: { message: string } | null }>) {
  try {
    const { data, error } = await p;
    if (error) return { _error: error.message };
    return data ?? null;
  } catch (e: unknown) {
    return { _error: e instanceof Error ? e.message : String(e) };
  }
}

export async function collectUserData(user: User): Promise<UserDataExport> {
  const uid = user.id;
  const [profile, access, purchases, policies, deletions] = await Promise.all([
    safe(supabase.from('profiles').select('*').eq('id', uid).maybeSingle()),
    safe(supabase.from('user_access').select('*').eq('user_id', uid)),
    safe(
      supabase
        .from('purchases')
        .select('*')
        .eq('user_id', uid)
        .order('purchased_at', { ascending: false }),
    ),
    safe(supabase.from('policy_acceptances').select('*').eq('user_id', uid)),
    safe(supabase.from('deletion_requests').select('*').eq('user_id', uid)),
  ]);

  return {
    _meta: {
      generated_at: new Date().toISOString(),
      note:
        'ClinicFlow personal-data export. Medical/clinic data is stored locally on your own computer and is NOT included here.',
    },
    account: {
      user_id: uid, // UID — keep this for support / future reference
      email: user.email,
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at,
      providers: user.app_metadata?.providers ?? user.app_metadata?.provider ?? null,
      full_name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
      phone: user.user_metadata?.phone ?? null,
      profession: user.user_metadata?.profession ?? null,
      clinic_size: user.user_metadata?.clinic_size ?? null,
      heard_about: user.user_metadata?.heard_about ?? null,
    },
    profile,
    access,
    purchases,
    policy_acceptances: policies,
    deletion_requests: deletions,
  };
}

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// Gather everything and trigger a client-side JSON download.
export async function downloadUserData(user: User): Promise<void> {
  const data = await collectUserData(user);
  const stamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  downloadBlob(
    `clinicflow-my-data-${stamp}.json`,
    new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }),
  );
}
