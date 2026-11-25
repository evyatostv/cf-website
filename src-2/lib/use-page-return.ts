import { useEffect, useState } from 'react';

/** Recheck server state on tab return and when restoring a cached history entry. */
export function usePageReturn() {
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const refresh = () => setRevision(value => value + 1);
    const onVisibility = () => { if (document.visibilityState === 'visible') refresh(); };
    const onPageShow = (event: PageTransitionEvent) => { if (event.persisted) refresh(); };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pageshow', onPageShow);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pageshow', onPageShow);
    };
  }, []);
  return revision;
}
