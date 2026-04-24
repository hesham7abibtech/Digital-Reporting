'use client';

import { motion } from 'framer-motion';
import PremiumPageLayout from '@/components/shared/PremiumPageLayout';
import { Shield, Lock, Eye, FileCheck, Key, Database, Globe, UserCheck } from 'lucide-react';

const securityFeatures = [
  {
    title: 'Data Sovereignty',
    description: 'Complete control over your project data with residency options that comply with regional regulations and enterprise requirements.',
    icon: <Database size={24} />
  },
  {
    title: 'Advanced Encryption',
    description: 'Military-grade AES-256 encryption for data at rest and TLS 1.3 for all data in transit across our entire network.',
    icon: <Lock size={24} />
  },
  {
    title: 'Role-Based Access',
    description: 'Granular access control management allowing you to define precise permissions for every user, discipline, and stakeholder.',
    icon: <UserCheck size={24} />
  },
  {
    title: 'Immutable Audit Logs',
    description: 'Comprehensive tracking of every action taken within the platform, providing a permanent, tamper-proof record for compliance.',
    icon: <FileCheck size={24} />
  },
  {
    title: 'Multi-Factor Security',
    description: 'Mandatory MFA protocols for all administrative access, ensuring that your most sensitive project data remains protected.',
    icon: <Key size={24} />
  },
  {
    title: 'Threat Monitoring',
    description: '24/7 real-time monitoring and automated threat detection systems to identify and mitigate risks before they impact your operations.',
    icon: <Shield size={24} />
  }
];

export default function SecurityPage() {
  return (
    <PremiumPageLayout>
      {/* Hero Section */}
      <section style={{ 
        padding: '100px 24px 60px',
        background: 'linear-gradient(180deg, var(--teal) 0%, #002a32 100%)',
        color: 'var(--cotton)',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '80%',
          height: '80%',
          background: 'radial-gradient(circle at center, rgba(208, 171, 130, 0.05) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        <div style={{ maxWidth: 800, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span style={{ 
              fontSize: 12, 
              fontWeight: 900, 
              color: 'var(--sunlit-rock)', 
              textTransform: 'uppercase', 
              letterSpacing: '0.4em',
              display: 'block',
              marginBottom: 16
            }}>
              Uncompromising Standards
            </span>
            <h1 className="brand-heading" style={{ 
              fontSize: 'clamp(32px, 5vw, 56px)', 
              marginBottom: 24,
              lineHeight: 1.1
            }}>
              Enterprise-Grade Security
            </h1>
            <p style={{ 
              fontSize: 18, 
              color: 'rgba(249, 248, 242, 0.7)', 
              lineHeight: 1.7,
              maxWidth: 600,
              margin: '0 auto'
            }}>
              The Ras El Hekma Digital Reporting platform is built on a foundation of absolute data integrity and secure infrastructure.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Security Features Grid */}
      <section style={{ padding: '80px 24px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <h2 className="brand-heading" style={{ color: 'var(--teal)', fontSize: 28, marginBottom: 16 }}>
            Core Protection Pillars
          </h2>
          <div style={{ width: 60, height: 2, background: 'var(--sunlit-rock)', margin: '0 auto' }} />
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
          gap: 32 
        }}>
          {securityFeatures.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="glass-card"
              style={{ 
                padding: 32, 
                background: 'white',
                border: '1px solid rgba(0, 63, 73, 0.05)',
                display: 'flex',
                flexDirection: 'column',
                gap: 20
              }}
            >
              <div style={{ 
                width: 50, 
                height: 50, 
                borderRadius: 12, 
                background: 'rgba(0, 63, 73, 0.03)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--teal)'
              }}>
                {feature.icon}
              </div>
              <h3 className="brand-heading" style={{ fontSize: 18, color: 'var(--teal)', margin: 0 }}>
                {feature.title}
              </h3>
              <p style={{ fontSize: 14, color: 'var(--text-dim)', lineHeight: 1.6, margin: 0 }}>
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Compliance Section */}
      <section style={{ 
        padding: '80px 24px', 
        background: 'rgba(0, 63, 73, 0.02)',
        borderTop: '1px solid rgba(0, 63, 73, 0.05)',
        borderBottom: '1px solid rgba(0, 63, 73, 0.05)'
      }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 60 }}>
          <div style={{ flex: '1 1 400px' }}>
            <h2 className="brand-heading" style={{ color: 'var(--teal)', fontSize: 24, marginBottom: 20 }}>
              Compliance & Certifications
            </h2>
            <p style={{ fontSize: 15, color: 'var(--text-dim)', lineHeight: 1.8, marginBottom: 24 }}>
              We adhere to the highest international standards for data management and security. Our infrastructure partners maintain SOC 2 Type II, ISO 27001, and HIPAA compliance, ensuring that your project metadata is handled with extreme care.
            </p>
            <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
              <div style={{ opacity: 0.5, fontWeight: 900, color: 'var(--teal)', fontSize: 20, letterSpacing: '0.1em' }}>ISO 27001</div>
              <div style={{ opacity: 0.5, fontWeight: 900, color: 'var(--teal)', fontSize: 20, letterSpacing: '0.1em' }}>SOC 2</div>
              <div style={{ opacity: 0.5, fontWeight: 900, color: 'var(--teal)', fontSize: 20, letterSpacing: '0.1em' }}>GDPR</div>
            </div>
          </div>
          <div style={{ flex: '1 1 300px', display: 'flex', justifyContent: 'center' }}>
            <div style={{ 
              width: 200, 
              height: 200, 
              borderRadius: '50%', 
              background: 'white', 
              boxShadow: '0 20px 40px rgba(0,0,0,0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '8px solid var(--haze)'
            }}>
              <ShieldCheck size={80} color="var(--sunlit-rock)" />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{ padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <h2 className="brand-heading" style={{ color: 'var(--teal)', fontSize: 24, marginBottom: 16 }}>
            Security Inquiry
          </h2>
          <p style={{ fontSize: 15, color: 'var(--text-dim)', marginBottom: 32 }}>
            Need detailed technical documentation about our security protocols or have specific compliance requirements? Our enterprise team is ready to assist.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{
              padding: '16px 40px',
              borderRadius: 16,
              background: 'var(--teal)',
              color: 'var(--cotton)',
              fontSize: 14,
              fontWeight: 800,
              border: 'none',
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              boxShadow: '0 10px 30px rgba(0, 63, 73, 0.2)'
            }}
          >
            Contact Security Team
          </motion.button>
        </div>
      </section>
    </PremiumPageLayout>
  );
}

function ShieldCheck({ size, color }: { size: number, color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
