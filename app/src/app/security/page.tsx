'use client';

import { motion } from 'framer-motion';
import PremiumPageLayout from '@/components/shared/PremiumPageLayout';
import { Shield, Lock, Eye, FileCheck, Key, Database, Globe, UserCheck, ShieldCheck, Zap } from 'lucide-react';

const securityFeatures = [
  {
    title: 'Data Sovereignty',
    description: 'Complete authority over project data with regional residency options that comply with strict enterprise regulations.',
    icon: <Database size={24} />
  },
  {
    title: 'Advanced Encryption',
    description: 'Military-grade AES-256 encryption for data at rest and TLS 1.3 protocols for all data in transit.',
    icon: <Lock size={24} />
  },
  {
    title: 'Role-Based Access',
    description: 'Granular RBAC management allowing for precise discipline-specific permissions across all stakeholders.',
    icon: <UserCheck size={24} />
  },
  {
    title: 'Immutable Audits',
    description: 'Comprehensive, tamper-proof tracking of every administrative action within the platform ecosystem.',
    icon: <FileCheck size={24} />
  },
  {
    title: 'Multi-Factor Defense',
    description: 'Mandatory MFA and identity verification for all administrative clearance levels.',
    icon: <Key size={24} />
  },
  {
    title: 'Proactive Monitoring',
    description: '24/7 real-time automated threat detection and mitigation systems for operational stability.',
    icon: <Zap size={24} />
  }
];

export default function SecurityPage() {
  return (
    <PremiumPageLayout>
      {/* Hero Section */}
      <section style={{ 
        padding: '140px 24px 100px',
        background: 'linear-gradient(180deg, var(--teal) 0%, #002a32 100%)',
        color: 'var(--cotton)',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative Grid Overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(rgba(208, 171, 130, 0.15) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          opacity: 0.3,
          pointerEvents: 'none'
        }} />

        <div style={{ maxWidth: 850, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div style={{ 
              display: 'inline-flex', alignItems: 'center', gap: 12, 
              padding: '8px 20px', background: 'rgba(255,255,255,0.05)', 
              borderRadius: 100, border: '1px solid rgba(255,255,255,0.1)',
              marginBottom: 32
            }}>
              <Shield size={14} color="var(--sunlit-rock)" />
              <span style={{ 
                fontSize: 10, fontWeight: 900, color: 'var(--sunlit-rock)', 
                textTransform: 'uppercase', letterSpacing: '0.3em'
              }}>
                Uncompromising Standards
              </span>
            </div>
            
            <h1 className="brand-heading" style={{ 
              fontSize: 'clamp(36px, 6vw, 64px)', 
              marginBottom: 24,
              lineHeight: 1.1,
              fontWeight: 400
            }}>
              Enterprise-Grade <span style={{ color: 'var(--sunlit-rock)' }}>Security</span>
            </h1>
            
            <p style={{ 
              fontSize: 18, 
              color: 'rgba(249, 248, 242, 0.7)', 
              lineHeight: 1.7,
              maxWidth: 650,
              margin: '0 auto'
            }}>
              The Ras El Hekma Digital Reporting platform is engineered on a foundation of absolute data integrity and hardened infrastructure.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Feature Grid */}
      <section style={{ padding: '100px 24px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 80 }}>
          <h2 className="brand-heading" style={{ color: 'var(--teal)', fontSize: 28, marginBottom: 16 }}>
            Security Framework Pillars
          </h2>
          <div style={{ width: 60, height: 2, background: 'var(--sunlit-rock)', margin: '0 auto' }} />
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', 
          gap: 32 
        }}>
          {securityFeatures.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              style={{ 
                padding: 40, 
                background: 'white',
                borderRadius: 24,
                border: '1px solid rgba(0, 63, 73, 0.05)',
                boxShadow: '0 10px 30px rgba(0,0,0,0.02)',
                display: 'flex',
                flexDirection: 'column',
                gap: 24,
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <div style={{ 
                width: 52, 
                height: 52, 
                borderRadius: 14, 
                background: 'rgba(0, 63, 73, 0.03)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--teal)',
                boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.02)'
              }}>
                {feature.icon}
              </div>
              <div>
                <h3 className="brand-heading" style={{ fontSize: 18, color: 'var(--teal)', margin: '0 0 12px' }}>
                  {feature.title}
                </h3>
                <p style={{ fontSize: 14, color: 'var(--text-dim)', lineHeight: 1.6, margin: 0 }}>
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Compliance & Verification */}
      <section style={{ 
        padding: '100px 24px', 
        background: 'var(--cotton)',
        borderTop: '1px solid rgba(0, 63, 73, 0.05)',
        borderBottom: '1px solid rgba(0, 63, 73, 0.05)',
        position: 'relative'
      }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 80 }}>
          <div style={{ flex: '1 1 500px' }}>
            <span style={{ fontSize: 10, fontWeight: 900, color: 'var(--sunlit-rock)', textTransform: 'uppercase', letterSpacing: '0.2em' }}>
              Verification & Compliance
            </span>
            <h2 className="brand-heading" style={{ color: 'var(--teal)', fontSize: 28, margin: '16px 0 24px' }}>
              Rigorous Standards
            </h2>
            <p style={{ fontSize: 16, color: 'var(--text-dim)', lineHeight: 1.8, marginBottom: 32 }}>
              We adhere to the highest international benchmarks for data sovereignty. Our infrastructure is fortified through strategic partnerships with SOC 2, ISO 27001, and HIPAA compliant data centers, ensuring your project metadata remains within an impenetrable ecosystem.
            </p>
            <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
              {['ISO 27001', 'SOC 2 Type II', 'GDPR'].map(label => (
                <div key={label} style={{ 
                  fontSize: 13, fontWeight: 900, color: 'var(--teal)', opacity: 0.4, 
                  letterSpacing: '0.1em', padding: '6px 12px', border: '1px solid rgba(0, 63, 73, 0.1)',
                  borderRadius: 6
                }}>
                  {label}
                </div>
              ))}
            </div>
          </div>
          
          <div style={{ flex: '1 1 300px', display: 'flex', justifyContent: 'center' }}>
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
              style={{
                position: 'absolute',
                width: 300,
                height: 300,
                border: '1px dashed rgba(0, 63, 73, 0.1)',
                borderRadius: '50%',
                zIndex: 0
              }}
            />
            <div style={{ 
              width: 220, 
              height: 220, 
              borderRadius: '50%', 
              background: 'white', 
              boxShadow: '0 30px 60px rgba(0,63,73,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '12px solid var(-- cotton)',
              position: 'relative',
              zIndex: 1
            }}>
              <ShieldCheck size={100} color="var(--sunlit-rock)" strokeWidth={1} />
            </div>
          </div>
        </div>
      </section>

      {/* Security Inquiry CTA */}
      <section style={{ padding: '120px 24px', textAlign: 'center', background: 'white' }}>
        <div style={{ maxWidth: 650, margin: '0 auto' }}>
          <h2 className="brand-heading" style={{ color: 'var(--teal)', fontSize: 26, marginBottom: 20 }}>
            Request Security Documentation
          </h2>
          <p style={{ fontSize: 15, color: 'var(--text-dim)', marginBottom: 40, lineHeight: 1.7 }}>
            Our security and compliance team is available to provide detailed technical dossiers and answer specific infrastructure inquiries for enterprise-level deployments.
          </p>
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: '0 15px 35px rgba(0, 63, 73, 0.25)' }}
            whileTap={{ scale: 0.95 }}
            style={{
              padding: '18px 48px',
              borderRadius: 18,
              background: 'var(--teal)',
              color: 'white',
              fontSize: 13,
              fontWeight: 900,
              border: 'none',
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '0.2em',
              boxShadow: '0 10px 30px rgba(0, 63, 73, 0.15)',
              transition: 'all 300ms'
            }}
          >
            Engage Security Team
          </motion.button>
        </div>
      </section>
    </PremiumPageLayout>
  );
}
