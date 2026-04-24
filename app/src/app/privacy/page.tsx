'use client';

import { motion } from 'framer-motion';
import PremiumPageLayout from '@/components/shared/PremiumPageLayout';
import { FileText, Shield, Info, Eye, Clock, UserCheck, Scale } from 'lucide-react';

export default function PrivacyPage() {
  const lastUpdated = "April 24, 2026";

  return (
    <PremiumPageLayout>
      {/* Hero Header */}
      <section style={{ 
        padding: '120px 24px 60px',
        textAlign: 'center',
        background: 'rgba(0, 63, 73, 0.02)',
        borderBottom: '1px solid rgba(0, 63, 73, 0.05)'
      }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div style={{ 
              width: 50, height: 50, borderRadius: 12, background: 'var(--teal)', color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px'
            }}>
              <Shield size={28} />
            </div>
            <h1 className="brand-heading" style={{ color: 'var(--teal)', fontSize: 42, marginBottom: 16 }}>
              Privacy Policy
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, color: 'var(--text-dim)', fontSize: 13 }}>
              <Clock size={14} />
              <span>Last Updated: {lastUpdated}</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section style={{ padding: '80px 24px', maxWidth: 900, margin: '0 auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 60 }}>
          
          <PolicySection 
            title="1. Commitment to Privacy"
            icon={<Info size={20} />}
            content="At the Ras El Hekma Digital Reporting platform, we are committed to protecting the privacy and security of our users and the integrity of the project data we manage. This policy outlines our practices regarding the collection, use, and safeguarding of information."
          />

          <PolicySection 
            title="2. Information Collection"
            icon={<Eye size={20} />}
            content="We collect only the information necessary to provide and improve our services. This includes project metadata, BIM model attributes, and user account information required for secure access and authentication. We do not sell or monetize project data to third parties."
          />

          <PolicySection 
            title="3. Data Usage & Security"
            icon={<Shield size={20} />}
            content="Information is used exclusively for the purposes of project coordination, reporting, and analytics within the authorized scope of the development. All data is protected by enterprise-grade encryption and stored in secure regional data centers as detailed in our Security and Infrastructure documentation."
          />

          <PolicySection 
            title="4. User Rights & Controls"
            icon={<UserCheck size={20} />}
            content="Users and organization administrators maintain full control over their data. This includes the right to access, rectify, or request the deletion of account information. Role-based access controls ensure that project data is only accessible to authorized personnel."
          />

          <PolicySection 
            title="5. Compliance & Legal"
            icon={<Scale size={20} />}
            content="Our practices are designed to comply with relevant data protection regulations. We conduct regular audits and security reviews to maintain the highest standards of privacy and legal compliance."
          />

          {/* Contact Block */}
          <div style={{ 
            padding: 40, 
            background: 'var(--haze)', 
            borderRadius: 24, 
            border: '1px solid rgba(0, 63, 73, 0.1)',
            textAlign: 'center'
          }}>
            <h3 className="brand-heading" style={{ color: 'var(--teal)', fontSize: 20, marginBottom: 16 }}>
              Privacy Inquiries
            </h3>
            <p style={{ fontSize: 14, color: 'var(--text-dim)', marginBottom: 24, lineHeight: 1.6 }}>
              If you have any questions regarding this Privacy Policy or our data handling practices, please contact our legal and compliance team.
            </p>
            <a href="mailto:privacy@insiteinternational.com" style={{ 
              color: 'var(--teal)', 
              fontWeight: 800, 
              textDecoration: 'none',
              fontSize: 15,
              borderBottom: '2px solid var(--sunlit-rock)',
              paddingBottom: 2
            }}>
              privacy@insiteinternational.com
            </a>
          </div>

        </div>
      </section>
    </PremiumPageLayout>
  );
}

function PolicySection({ title, content, icon }: { title: string, content: string, icon: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 24 }}>
      <div style={{ 
        width: 32, height: 32, borderRadius: 8, background: 'rgba(0, 63, 73, 0.05)', color: 'var(--teal)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 4
      }}>
        {icon}
      </div>
      <div>
        <h2 className="brand-heading" style={{ color: 'var(--teal)', fontSize: 20, marginBottom: 16, letterSpacing: '0.1em' }}>
          {title}
        </h2>
        <p style={{ 
          fontSize: 16, 
          color: 'var(--text-dim)', 
          lineHeight: 1.8, 
          margin: 0,
          whiteSpace: 'pre-line'
        }}>
          {content}
        </p>
      </div>
    </div>
  );
}
