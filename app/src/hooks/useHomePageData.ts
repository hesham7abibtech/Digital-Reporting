'use client';

import { useDocument } from 'react-firebase-hooks/firestore';
import { doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { HomePageConfig } from '@/lib/types';

const DEFAULT_CONFIG: HomePageConfig = {
  hero: {
    backgroundUrl: '/hero-bg.png',
    backgroundType: 'image',
    title: 'Ras El Hekma',
    subtitle: 'Digital Reporting Platform',
    tagline: 'Smart Digital Reporting for Mega Projects',
    ctaPrimary: 'Explore Project',
    ctaSecondary: 'Login to Access Reports',
  },
  overview: {
    description: 'A transformative mega-scale coastal development redefining modern urban living on Egypt\'s Mediterranean coast. Spanning 170 million square meters with world-class infrastructure, sustainable design, and cutting-edge digital project management.',
    developer: 'MODON Holding',
    consultant: 'InSite is a Division of KEO International Consultants.',
    location: 'North Coast, Egypt – Mediterranean',
    scope: '170M sqm Master-Planned Development',
    highlights: [
      'Smart City Infrastructure',
      'Sustainable Design Principles',
      'Integrated BIM Workflow',
      'Real-Time Digital Reporting',
      'Multi-Disciplinary Coordination',
      'Enterprise-Grade Data Security'
    ],
  },
  metrics: {
    items: [
      { id: 'm1', label: 'Total Deliverables', value: 2480, prefix: '', suffix: '+', icon: 'FileText', isVisible: true },
      { id: 'm2', label: 'Active Disciplines', value: 12, prefix: '', suffix: '', icon: 'Layers', isVisible: true },
      { id: 'm3', label: 'BIM Models Reviewed', value: 856, prefix: '', suffix: '+', icon: 'Box', isVisible: true },
      { id: 'm4', label: 'Reports Generated', value: 1240, prefix: '', suffix: '+', icon: 'BarChart3', isVisible: true },
    ],
  },
  gallery: {
    images: [],
  },
  modules: {
    items: [
      { id: 'mod1', title: 'BIM Reviews', description: 'Comprehensive Building Information Modeling review and coordination across all project disciplines with intelligent clash detection.', icon: 'Box', order: 0 },
      { id: 'mod2', title: 'Digital Reporting', description: 'Automated generation of professional PDF and Excel reports with real-time data synchronization and branded templates.', icon: 'FileText', order: 1 },
      { id: 'mod3', title: 'Analytics Dashboards', description: 'Interactive visual analytics with KPI tracking, trend analysis, and predictive insights for informed decision-making.', icon: 'BarChart3', order: 2 },
      { id: 'mod4', title: 'Data Integration', description: 'Seamless integration across multiple data sources with real-time synchronization, secure APIs, and enterprise protocols.', icon: 'Database', order: 3 },
      { id: 'mod5', title: 'GIS Mapping', description: 'Geographic Information System integration for spatial analysis, site monitoring, and location-based progress tracking.', icon: 'Globe', order: 4 },
      { id: 'mod6', title: 'Secure Access', description: 'Role-based access control with enterprise-grade authentication, audit trails, and multi-factor security protocols.', icon: 'Shield', order: 5 },
    ],
  },
  dashboardPreview: {
    screenshotUrl: '/dashboard-preview.png',
    isBlurred: true,
    overlayText: 'Login to unlock full insights',
  },
  trust: {
    logos: [
      { id: 't1', name: 'MODON', url: '/logos/modon.png', linkUrl: '' },
      { id: 't2', name: 'KEO International', url: '/logos/keo.png', linkUrl: '' },
      { id: 't3', name: 'Insite International', url: '/logos/insite.png', linkUrl: '' },
    ],
    statement: 'Trusted by leading developers, consultants, and government authorities across the Middle East\'s most ambitious mega-projects.',
  },
  footer: {
    aboutTitle: 'Digital Reporting',
    aboutDescription: 'Enterprise-grade digital project management and reporting platform for mega-scale real estate and construction projects.',
    contactEmail: 'Hesham.habib@insiteinternational.com',
    contactAddress: 'North Coast, Egypt – Mediterranean',
    contactWebsite: 'www.insiteinternational.com',
    systemItems: [
      { id: 's1', label: 'Enterprise Security', url: '#' },
      { id: 's2', label: 'Cloud Infrastructure', url: '#' },
      { id: 's3', label: 'Privacy Policy', url: '#' },
    ],
    socialLinks: [
      { id: 'sl1', label: 'LinkedIn', url: '#', icon: 'Linkedin' },
      { id: 'sl2', label: 'Twitter', url: '#', icon: 'Twitter' },
    ],
    version: 'Platform v2.0',
    copyright: 'Insite International (KEO) — All rights reserved.',
    platformName: 'Digital Reporting Platform — Ras El Hekma Command Center',
  },
  updatedAt: new Date().toISOString(),
};

export function useHomePageData() {
  const [snapshot, loading, error] = useDocument(doc(db, 'settings', 'homePage'));

  const config: HomePageConfig = snapshot?.exists()
    ? { ...DEFAULT_CONFIG, ...snapshot.data() } as HomePageConfig
    : DEFAULT_CONFIG;

  return { config, isLoading: loading, error };
}

export { DEFAULT_CONFIG };
