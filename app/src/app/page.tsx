'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useHomePageData } from '@/hooks/useHomePageData';
import { Loader2 } from 'lucide-react';

import HeroSection from '@/components/home/HeroSection';
import ProjectOverview from '@/components/home/ProjectOverview';
import LiveMetrics from '@/components/home/LiveMetrics';
import VisualGallery from '@/components/home/VisualGallery';
import FeaturedModules from '@/components/home/FeaturedModules';
import DashboardPreview from '@/components/home/DashboardPreview';
import TrustBand from '@/components/home/TrustBand';
import HomeFooter from '@/components/home/HomeFooter';

export default function HomePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { config, isLoading } = useHomePageData();
  const isLoggedIn = !!user;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode');
    const oobCode = params.get('oobCode');

    if (mode === 'resetPassword' && oobCode) {
      router.push(`/auth/reset?oobCode=${oobCode}`);
    }
  }, [router]);

  const handleExplore = () => {
    const el = document.getElementById('overview');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleLogin = () => {
    if (isLoggedIn) {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  };

  if (isLoading) {
    return (
      <div style={{
        height: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: 'var(--aqua)', gap: 16,
      }}>
        <Loader2 className="animate-spin" size={32} color="var(--teal)" />
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
          Loading
        </span>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', overflow: 'hidden', background: 'var(--cotton)' }}>
      {/* 1. Hero Section */}
      <HeroSection
        config={config.hero}
        isLoggedIn={isLoggedIn}
        onExploreCick={handleExplore}
        onLoginClick={handleLogin}
      />

      {/* 2. Project Overview */}
      <div id="overview">
        <ProjectOverview config={config.overview} />
      </div>

      {/* 3. Live Metrics */}
      <LiveMetrics items={config.metrics.items} />

      {/* 4. Visual Gallery */}
      <VisualGallery images={config.gallery.images} />

      {/* 5. Featured Modules */}
      <FeaturedModules items={config.modules.items} />

      {/* 6. Dashboard Preview */}
      <DashboardPreview
        screenshotUrl={config.dashboardPreview.screenshotUrl}
        isBlurred={config.dashboardPreview.isBlurred}
        overlayText={config.dashboardPreview.overlayText}
        onLoginClick={handleLogin}
      />

      {/* 7. Trust Band */}
      <TrustBand
        logos={config.trust.logos}
        statement={config.trust.statement}
      />

      {/* 8. Footer */}
      <HomeFooter config={config.footer} />
    </div>
  );
}
