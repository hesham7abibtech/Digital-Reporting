'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { templates } from '@/lib/mailTemplates';
import {
  Mail,
  UserPlus,
  ShieldCheck,
  CheckCircle2,
  Bell,
  ArrowLeft,
  Monitor,
  Smartphone,
  Lock,
  Moon,
  Sun,
  PartyPopper
} from 'lucide-react';
import { useRouter } from 'next/navigation';

const TEMPLATE_CONFIG = [
  {
    id: 'REGISTRATION_PENDING',
    name: 'Registration Received',
    description: 'Sent to user after they register.',
    icon: UserPlus,
    render: () => templates.REGISTRATION_PENDING('Khalid Al-Mansour', 'k.almansour@rehdigital.com')
  },
  {
    id: 'ADMIN_NOTIFICATION',
    name: 'Admin Access Request',
    description: 'Sent to administrators for new user approval.',
    icon: ShieldCheck,
    render: () => templates.ADMIN_NOTIFICATION({
      name: 'Khalid Al-Mansour',
      email: 'k.almansour@rehdigital.com',
      department: 'Infrastructure Operations'
    })
  },
  {
    id: 'ACCOUNT_APPROVED',
    name: 'Clearance Granted',
    description: 'Sent to user after their account is approved.',
    icon: CheckCircle2,
    render: () => templates.ACCOUNT_APPROVED('Khalid Al-Mansour', 'k.almansour@rehdigital.com')
  },
  {
    id: 'CUSTOM_NEWS',
    name: 'News Broadcast',
    description: 'General project news broadcast.',
    icon: Bell,
    render: () => templates.CUSTOM_NOTIFICATION({
      title: 'Project Milestone: Precinct A-1 Initialization',
      body: 'We are pleased to announce the successful initialization of the Phase 1 infrastructure grid. All teams are cleared for on-site operations.',
      category: 'NEWS'
    })
  },
  {
    id: 'CUSTOM_ANNOUNCE',
    name: 'System Announcement',
    description: 'Critical system-wide broadcast.',
    icon: Bell,
    render: () => templates.CUSTOM_NOTIFICATION({
      title: 'Scheduled Maintenance: Secure Gateway Uplink',
      body: 'The administrative portal will undergo scheduled optimization tonight at 23:00 GMT. Expected downtime is minimal.',
      category: 'ANNOUNCEMENT'
    })
  },
  {
    id: 'CUSTOM_SECURITY',
    name: 'Security Advisory',
    description: 'Security or access control notification.',
    icon: ShieldCheck,
    render: () => templates.CUSTOM_NOTIFICATION({
      title: 'Access Control Update',
      body: 'Your system access credentials have been updated. Please review your permissions in the portal.',
      category: 'SECURITY'
    })
  },
  {
    id: 'PASSWORD_RESET',
    name: 'Security Reset',
    description: 'Sent when a user requests a password reset.',
    icon: Lock,
    render: () => templates.PASSWORD_RESET('Khalid Al-Mansour', 'k.almansour@rehdigital.com', 'https://rehdigital.com/reset-password?oobCode=example-token')
  },
  {
    id: 'PASSWORD_RESET_SUCCESS',
    name: 'Reset Success',
    description: 'Congratulations mail after password change.',
    icon: PartyPopper,
    render: () => templates.PASSWORD_RESET_SUCCESS('Khalid Al-Mansour', 'k.almansour@rehdigital.com')
  }
];

export default function MailPreviewPage() {
  const [activeTab, setActiveTab] = useState(TEMPLATE_CONFIG[0].id);
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const router = useRouter();

  const currentTemplate = TEMPLATE_CONFIG.find(t => t.id === activeTab);
  const htmlContent = currentTemplate ? currentTemplate.render() : '';

  return (
    <div style={{ minHeight: '100vh', background: '#fcfbf5', display: 'flex' }}>
      {/* Sidebar */}
      <div style={{
        width: 380,
        background: '#ffffff',
        borderRight: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '10px 0 30px rgba(0,63,73,0.03)',
        zIndex: 10
      }}>
        <div style={{ padding: '32px', borderBottom: '1px solid #f1f5f9' }}>
          <button
            onClick={() => router.back()}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'none', border: 'none', color: '#64748b',
              fontSize: 11, fontWeight: 800, cursor: 'pointer',
              textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 24
            }}
          >
            <ArrowLeft size={14} /> Back
          </button>
          <h1 style={{ fontSize: 20, color: '#003f49', fontFamily: "'Marcellus', serif", margin: 0, letterSpacing: '0.05em' }}>
            Communications Lab
          </h1>
          <p style={{ color: '#94a3b8', fontSize: 12, marginTop: 6, margin: '6px 0 0' }}>Template Preview Engine</p>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {TEMPLATE_CONFIG.map((template) => (
              <button
                key={template.id}
                onClick={() => setActiveTab(template.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px',
                  borderRadius: 14, border: '1px solid',
                  borderColor: activeTab === template.id ? '#003f49' : '#f1f5f9',
                  background: activeTab === template.id ? '#003f49' : '#ffffff',
                  textAlign: 'left', cursor: 'pointer', transition: 'all 250ms',
                  boxShadow: activeTab === template.id ? '0 8px 20px rgba(0,63,73,0.12)' : 'none'
                }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: activeTab === template.id ? 'rgba(255,255,255,0.12)' : 'rgba(0,63,73,0.06)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: activeTab === template.id ? '#ffffff' : '#003f49'
                }}>
                  {React.createElement(template.icon, { size: 18 })}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: activeTab === template.id ? '#ffffff' : '#003f49', marginBottom: 2 }}>
                    {template.name}
                  </div>
                  <div style={{ fontSize: 11, color: activeTab === template.id ? 'rgba(255,255,255,0.55)' : '#94a3b8', lineHeight: 1.4 }}>
                    {template.description}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Control Center */}
        <div style={{ padding: '24px', background: '#f8fafc', borderTop: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            {(['desktop', 'mobile'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                style={{
                  flex: 1, padding: '11px', borderRadius: 10, border: 'none',
                  background: viewMode === mode ? '#003f49' : '#ffffff',
                  color: viewMode === mode ? '#ffffff' : '#64748b',
                  cursor: 'pointer', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', gap: 7, fontSize: 11, fontWeight: 800,
                  boxShadow: '0 2px 5px rgba(0,0,0,0.05)', transition: 'all 200ms'
                }}
              >
                {mode === 'desktop' ? <Monitor size={15} /> : <Smartphone size={15} />}
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
          
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            style={{
              width: '100%', padding: '12px', borderRadius: 10, border: '1px solid #e2e8f0',
              background: isDarkMode ? '#1e293b' : '#ffffff',
              color: isDarkMode ? '#f8fafc' : '#003f49',
              cursor: 'pointer', display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: 8, fontSize: 11, fontWeight: 800,
              transition: 'all 200ms'
            }}
          >
            {isDarkMode ? <Sun size={15} /> : <Moon size={15} />}
            {isDarkMode ? 'SWITCH TO LIGHT MODE' : 'SIMULATE DARK MODE'}
          </button>
        </div>
      </div>

      {/* Preview Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: isDarkMode ? '#0f172a' : '#e8ecf0', overflow: 'hidden', transition: 'background 300ms' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '48px 40px', overflowY: 'auto' }}>
          <motion.div
            key={`${activeTab}-${viewMode}-${isDarkMode}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            style={{
              width: viewMode === 'desktop' ? '100%' : '390px',
              maxWidth: viewMode === 'desktop' ? '720px' : '390px',
              background: '#ffffff',
              borderRadius: viewMode === 'mobile' ? '44px' : '20px',
              border: viewMode === 'mobile' ? '12px solid #003f49' : '1px solid #d1d5db',
              overflow: 'hidden',
              boxShadow: isDarkMode ? '0 32px 80px rgba(0,0,0,0.4)' : '0 32px 80px rgba(0,0,0,0.15)',
              flexShrink: 0,
              filter: isDarkMode ? 'brightness(0.95) contrast(1.05)' : 'none'
            }}
          >
            {viewMode === 'mobile' && (
              <div style={{ height: 36, background: '#003f49', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 52, height: 4, background: 'rgba(255,255,255,0.25)', borderRadius: 2 }} />
              </div>
            )}
            <div style={{ width: '100%' }} dangerouslySetInnerHTML={{ __html: htmlContent }} />
          </motion.div>
        </div>

        {/* Status Bar */}
        <div style={{
          padding: '16px 36px', background: isDarkMode ? '#1e293b' : '#ffffff', borderTop: isDarkMode ? '1px solid #334155' : '1px solid #e2e8f0',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all 300ms'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981' }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: isDarkMode ? '#f8fafc' : '#003f49' }}>Zero-Attachment Architecture Active</span>
          </div>
          <div style={{ display: 'flex', gap: 20, fontSize: 11, color: isDarkMode ? '#94a3b8' : '#94a3b8', fontWeight: 600 }}>
            <span>RFC 5322 Compliant</span>
            <span>TLS 1.3 Encryption</span>
            <span>Zoho SMTP</span>
          </div>
        </div>
      </div>
    </div>
  );
}
