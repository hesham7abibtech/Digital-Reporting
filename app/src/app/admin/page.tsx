'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Shield, Loader2 } from 'lucide-react';

export default function AdminIndexRedirect() {
  const router = useRouter();
  const { userProfile, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (userProfile) {
        // If authenticated as admin, go to dashboard
        router.replace('/admin/dashboard');
      } else {
        // If not authenticated, go to login
        router.replace('/admin/login');
      }
    }
  }, [userProfile, loading, router]);

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      background: '#0a0a0f',
      color: 'white',
      gap: 24
    }}>
      <div style={{ 
        width: 64, height: 64, borderRadius: 20, 
        background: 'rgba(212, 175, 55, 0.1)', 
        border: '1px solid rgba(212, 175, 55, 0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 0 30px rgba(212, 175, 55, 0.2)'
      }}>
        <Shield size={32} color="#D4AF37" />
      </div>
      
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontSize: 18, fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
          Administrative Entry
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#D4AF37', justifyContent: 'center' }}>
          <Loader2 size={16} className="animate-spin" />
          <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.05em' }}>RESOLVING ACCESS PROTOCOLS...</span>
        </div>
      </div>
    </div>
  );
}
