'use client';

import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Legacy reset route. Password setup/reset now lives at /auth/reset (Supabase
 * recovery). Redirect here, preserving any recovery hash/query the link carries.
 */
export default function ResetPasswordRedirect() {
  useEffect(() => {
    const { search, hash } = window.location;
    window.location.replace(`/auth/reset${search}${hash}`);
  }, []);

  return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
      <Loader2 className="animate-spin" size={32} color="#003f49" />
    </div>
  );
}
