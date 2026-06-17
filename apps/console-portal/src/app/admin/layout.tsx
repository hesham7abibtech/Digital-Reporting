'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';
import SecurityAccessDenied from '@/components/shared/SecurityAccessDenied';


export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isLoginPage = pathname === '/admin/login';
  const isAdmin = userProfile?.isAdmin === true;

  useEffect(() => {
    // SECURITY HANDSHAKE: Ensure authentication is active for all admin routes except login
    if (!loading && !isLoginPage && !user) {
      router.push('/admin/login');
    }
  }, [user, loading, isLoginPage, router]);

  // Always show children on login page
  if (isLoginPage) return <>{children}</>;

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0f' }}>
        <Loader2 className="animate-spin" size={32} color="#D4AF37" />
      </div>
    );
  }

  // Identity Hydration Check
  if (user && !userProfile) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0f' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 16, 
          background: 'rgba(255, 255, 255, 0.03)',
          padding: '16px 24px',
          borderRadius: 16,
          border: '1px solid rgba(255, 255, 255, 0.05)'
        }}>
          <Loader2 className="animate-spin" size={20} color="#D4AF37" />
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', margin: 0 }}>VERIFYING SECURITY CLEARANCE...</p>
        </div>
      </div>
    );
  }

  // Access Denied Intercept
  if (user && !isAdmin) {
    return <SecurityAccessDenied />;
  }

  if (!user || !isAdmin) {
    return null;
  }

  return <>{children}</>;
}
