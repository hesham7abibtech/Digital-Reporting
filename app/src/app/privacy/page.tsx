'use client';

import { motion } from 'framer-motion';
import PremiumPageLayout from '@/components/shared/PremiumPageLayout';
import { Shield, Info, Eye, Clock, UserCheck, Scale, Lock } from 'lucide-react';

export default function PrivacyPage() {
  const lastUpdated = "April 24, 2026";

  return (
    <PremiumPageLayout>
      {/* Hero Header */}
      <section style={{
        padding: '140px 24px 80px',
        textAlign: 'center',
        background: 'linear-gradient(180deg, rgba(0, 63, 73, 0.05) 0%, transparent 100%)',
        borderBottom: '1px solid rgba(0, 63, 73, 0.05)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative Background Element */}
        <div style={{
          position: 'absolute',
          top: -100,
          right: -100,
          width: 400,
          height: 400,
          background: 'radial-gradient(circle, rgba(208, 171, 130, 0.03) 0%, transparent 70%)',
          borderRadius: '50%',
          pointerEvents: 'none'
        }} />

        <div style={{ maxWidth: 800, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div style={{
              width: 56, height: 56, borderRadius: 16,
              background: 'linear-gradient(135deg, var(--teal) 0%, #002a32 100%)',
              color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 24px',
              boxShadow: '0 10px 25px rgba(0, 63, 73, 0.15)',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <Lock size={28} />
            </div>
            <span style={{
              fontSize: 11, fontWeight: 900, color: 'var(--sunlit-rock)',
              textTransform: 'uppercase', letterSpacing: '0.4em', display: 'block', marginBottom: 12
            }}>
              Legal Protocols
            </span>
            <h1 className="brand-heading" style={{
              color: 'var(--teal)', fontSize: 'clamp(32px, 5vw, 48px)', marginBottom: 20,
              fontWeight: 400
            }}>
              Privacy <span style={{ color: 'var(--sunlit-rock)' }}>Policy</span>
            </h1>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
              color: 'var(--text-dim)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: '0.1em'
            }}>
              <Clock size={14} color="var(--sunlit-rock)" />
              <span>Transmission Update: {lastUpdated}</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section style={{ padding: '100px 24px', maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 40 }}>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
            gap: 40
          }}>
            <PolicyCard
              title="1. Core Commitment"
              icon={<Info size={22} />}
              content="The Ras El Hekma Digital Reporting Hub operates under strict confidentiality protocols. We are dedicated to maintaining the absolute integrity of project metadata and stakeholder privacy."
            />

            <PolicyCard
              title="2. Data Acquisition"
              icon={<Eye size={22} />}
              content="We process only mission-critical data required for project coordination. This includes verified BIM attributes, structural metadata, and administrative identities essential for secure authentication."
            />

            <PolicyCard
              title="3. Hardened Security"
              icon={<Shield size={22} />}
              content="All transmissions are protected by enterprise-grade TLS 1.3 encryption. Data at rest is stored in isolated, high-security regional hubs with perpetual threat monitoring."
            />

            <PolicyCard
              title="4. User Sovereignty"
              icon={<UserCheck size={22} />}
              content="Project participants retain full authority over their contributed data. Role-based access ensures that information is strictly confined to authorized disciplines and stakeholders."
            />
          </div>

          {/* Compliance Block */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            style={{
              marginTop: 40,
              padding: 48,
              background: 'linear-gradient(135deg, white 0%, var(--cotton) 100%)',
              borderRadius: 32,
              border: '1px solid rgba(0, 63, 73, 0.08)',
              textAlign: 'center',
              boxShadow: '0 20px 50px rgba(0, 63, 73, 0.03)'
            }}
          >
            <div style={{
              width: 40, height: 2, background: 'var(--sunlit-rock)', margin: '0 auto 24px'
            }} />
            <h3 className="brand-heading" style={{ color: 'var(--teal)', fontSize: 22, marginBottom: 16 }}>
              Legal Compliance
            </h3>
            <p style={{
              fontSize: 15, color: 'var(--text-dim)', marginBottom: 32, lineHeight: 1.8,
              maxWidth: 600, margin: '0 auto 32px'
            }}>
              Our privacy framework is engineered to meet and exceed international standards for industrial data protection. For detailed legal inquiries or data export requests, please contact our compliance department.
            </p>
            <a href="mailto:info@rehdigital.com" style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 12,
              background: 'var(--teal)',
              color: 'white',
              padding: '14px 32px',
              borderRadius: 14,
              textDecoration: 'none',
              fontSize: 13,
              fontWeight: 800,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              boxShadow: '0 10px 25px rgba(0, 63, 73, 0.2)'
            }}>
              Contact Compliance Hub
            </a>
          </motion.div>

        </div>
      </section>
    </PremiumPageLayout>
  );
}

function PolicyCard({ title, content, icon }: { title: string, content: string, icon: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      style={{
        display: 'flex', gap: 24, padding: 32,
        background: 'white', borderRadius: 24,
        border: '1px solid rgba(0, 63, 73, 0.05)',
        boxShadow: '0 4px 15px rgba(0,0,0,0.02)'
      }}
    >
      <div style={{
        width: 48, height: 48, borderRadius: 14,
        background: 'rgba(0, 63, 73, 0.03)', color: 'var(--teal)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0
      }}>
        {icon}
      </div>
      <div>
        <h2 className="brand-heading" style={{ color: 'var(--teal)', fontSize: 18, marginBottom: 12, letterSpacing: '0.1em' }}>
          {title}
        </h2>
        <p style={{
          fontSize: 14,
          color: 'var(--text-dim)',
          lineHeight: 1.7,
          margin: 0
        }}>
          {content}
        </p>
      </div>
    </motion.div>
  );
}
