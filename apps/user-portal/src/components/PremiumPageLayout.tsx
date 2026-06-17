'use client';

import React from 'react';
import PublicPageHeader from './PublicPageHeader';
import HomeFooter from '@/components/home/HomeFooter';
import { useHomePageData } from '@/hooks/useHomePageData';
import { Loader2 } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

export default function PremiumPageLayout({ children }: Props) {
  const { config, isLoading } = useHomePageData();

  if (isLoading) {
    return (
      <div style={{
        height: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: 'var(--teal)', gap: 16,
      }}>
        <Loader2 className="animate-spin" size={32} color="var(--sunlit-rock)" />
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--cotton)', textTransform: 'uppercase', letterSpacing: '0.15em', opacity: 0.6 }}>
          Loading
        </span>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'var(--cotton)',
      position: 'relative',
      overflowX: 'hidden'
    }}>
      {/* Background Mesh */}
      <div className="gradient-mesh" style={{ opacity: 0.4 }} />
      
      <PublicPageHeader />

      <main style={{ paddingTop: 80 }}>
        {children}
      </main>

      <HomeFooter config={config.footer} />
    </div>
  );
}
