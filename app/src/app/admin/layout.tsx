'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';


export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isLoginPage = pathname === '/admin/login';
  const isAdmin = ['ADMIN', 'SUPER_ADMIN', 'OWNER', 'PROJECT_MANAGER', 'DEPARTMENT_HEAD'].includes(userProfile?.role || '');


  useEffect(() => {
    if (!loading && !isLoginPage) {
      if (!user) {
        router.push('/admin/login');
      } else if (userProfile && !isAdmin) {
        router.push('/admin/login?error=unauthorized');
      }
    }
  }, [user, userProfile, loading, isAdmin, isLoginPage, router]);

  // Always show children on login page
  if (isLoginPage) return <>{children}</>;

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0f' }}>
        <Loader2 className="animate-spin" size={32} color="#D4AF37" />
      </div>
    );
  }

  if (user && !userProfile) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0f' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 className="animate-spin" size={32} color="#D4AF37" style={{ margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--text-dim)', fontSize: 14 }}>Verifying credentials...</p>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  return <>{children}</>;
}


