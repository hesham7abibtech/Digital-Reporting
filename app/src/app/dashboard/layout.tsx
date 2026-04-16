'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();
  const [sessionChecked, setSessionChecked] = useState(false);
  const [hasDashboardSession, setHasDashboardSession] = useState(false);

  useEffect(() => {
    const flag = sessionStorage.getItem('dashboard_session');
    setHasDashboardSession(flag === 'active');
    setSessionChecked(true);
  }, []);

  useEffect(() => {
    if (!sessionChecked || loading) return;

    if (!user || !hasDashboardSession) {
      router.push('/login');
    } else if (userProfile && (!userProfile.isApproved || !userProfile.isVerified)) {
      // Explicitly protect against unapproved/unverified users who bypass login page
      router.push('/login?error=unauthorized');
    }
  }, [user, userProfile, loading, router, sessionChecked, hasDashboardSession]);

  if (loading || !sessionChecked) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--background)',
      }}>
        <Loader2 className="animate-spin" size={32} color="var(--teal)" />
      </div>
    );
  }

  if (!user || !hasDashboardSession) {
    return null;
  }

  return <>{children}</>;
}
