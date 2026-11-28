import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';

type Permission = 'allowed' | 'denied' | 'error' | 'loading';

export function useDesktopSupportPermission() {
  const { user } = useAuth();
  const userId = user?.id;
  const [result, setResult] = useState<{ userId: string; permission: Permission } | null>(null);
  useEffect(() => {
    if (!userId) return;
    let active = true;
    async function check(id: string) {
      let permission: Permission;
      try {
        const { data, error } = await supabase.rpc('is_desktop_support');
        if (error) throw error;
        permission = data === true ? 'allowed' : 'denied';
      } catch {
        permission = 'error';
      }
      if (active) setResult({ userId: id, permission });
    }
    void check(userId);
    return () => { active = false; };
  }, [userId]);
  if (!userId) return 'denied';
  return result?.userId === userId ? result.permission : 'loading';
}

export function DesktopSupportLink() {
  const permission = useDesktopSupportPermission();
  if (permission !== 'allowed') return null;
  return (
    <Link to="/dashboard/support/devices" className="font-semibold text-[#0d47a1] underline underline-offset-4">
      כלי תמיכה — ניהול מחשבי לקוחות
    </Link>
  );
}
