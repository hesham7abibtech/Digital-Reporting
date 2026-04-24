'use client';

import { motion } from 'framer-motion';
import PremiumPageLayout from '@/components/shared/PremiumPageLayout';
import { Server, Zap, Globe, Cpu, Cloud, Activity, HardDrive, Shield } from 'lucide-react';

const infraFeatures = [
  {
    title: 'High Availability',
    description: 'Redundant multi-region architecture ensuring 99.99% uptime for critical project management operations and data access.',
    icon: <Server size={24} />
  },
  {
    title: 'Elastic Scalability',
    description: 'Dynamic resource allocation that scales seamlessly with project complexity, from single disciplines to mega-scale developments.',
    icon: <Zap size={24} />
  },
  {
    title: 'Edge Performance',
    description: 'Global content delivery network (CDN) ensuring low-latency access to BIM models and reports from any location worldwide.',
    icon: <Globe size={24} />
  },
  {
    title: 'Real-time Compute',
    description: 'High-performance processing engines for complex analytics, clash detection, and automated report generation.',
    icon: <Cpu size={24} />
  },
  {
    title: 'Disaster Recovery',
    description: 'Automated point-in-time backups and geo-replicated data storage to ensure business continuity in any scenario.',
    icon: <HardDrive size={24} />
  },
  {
    title: 'Active Monitoring',
    description: 'Comprehensive observability with real-time health checks, performance profiling, and proactive incident response.',
    icon: <Activity size={24} />
  }
];

export default function InfrastructurePage() {
  return (
    <PremiumPageLayout>
      {/* Hero Section */}
      <section style={{ 
        padding: '100px 24px 60px',
        background: 'linear-gradient(135deg, #004d5a 0%, #002a32 100%)',
        color: 'var(--cotton)',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Animated Background Elements */}
        <div style={{ position: 'absolute', inset: 0, opacity: 0.1 }}>
          <div style={{ 
            position: 'absolute', top: '10%', left: '10%', width: '30%', height: '30%', 
            border: '1px solid white', borderRadius: '50%', transform: 'rotate(45deg)' 
          }} />
          <div style={{ 
            position: 'absolute', bottom: '10%', right: '10%', width: '40%', height: '40%', 
            border: '1px solid white', borderRadius: '50%', transform: 'rotate(-20deg)' 
          }} />
        </div>

        <div style={{ maxWidth: 800, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
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
              Next-Gen Backbone
            </span>
            <h1 className="brand-heading" style={{ 
              fontSize: 'clamp(32px, 5vw, 56px)', 
              marginBottom: 24,
              lineHeight: 1.1
            }}>
              Robust Cloud Infrastructure
            </h1>
            <p style={{ 
              fontSize: 18, 
              color: 'rgba(249, 248, 242, 0.7)', 
              lineHeight: 1.7,
              maxWidth: 600,
              margin: '0 auto'
            }}>
              Built on world-class cloud providers with a custom-engineered stack designed for the unique demands of mega-project digital reporting.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section style={{ padding: '80px 24px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 60, alignItems: 'center', marginBottom: 80 }}>
          <div style={{ flex: '1 1 500px' }}>
            <h2 className="brand-heading" style={{ color: 'var(--teal)', fontSize: 32, marginBottom: 24 }}>
              Engineered for Scale
            </h2>
            <p style={{ fontSize: 16, color: 'var(--text-dim)', lineHeight: 1.8, marginBottom: 32 }}>
              Our infrastructure is not just a hosting solution; it's a precision-engineered environment. We utilize containerized microservices, distributed databases, and intelligent edge caching to ensure that the Command Center remains responsive, no matter the data volume.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <div>
                <span style={{ display: 'block', fontSize: 24, fontWeight: 900, color: 'var(--teal)' }}>99.99%</span>
                <span style={{ fontSize: 12, color: 'var(--sunlit-rock)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 800 }}>Uptime SLA</span>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: 24, fontWeight: 900, color: 'var(--teal)' }}>&lt;100ms</span>
                <span style={{ fontSize: 12, color: 'var(--sunlit-rock)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 800 }}>Global Latency</span>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: 24, fontWeight: 900, color: 'var(--teal)' }}>10+ GB/s</span>
                <span style={{ fontSize: 12, color: 'var(--sunlit-rock)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 800 }}>Backbone Speed</span>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: 24, fontWeight: 900, color: 'var(--teal)' }}>Unlimited</span>
                <span style={{ fontSize: 12, color: 'var(--sunlit-rock)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 800 }}>Data Scaling</span>
              </div>
            </div>
          </div>
          <div style={{ flex: '1 1 400px', position: 'relative' }}>
             <div style={{ 
               padding: 40, 
               background: 'var(--teal)', 
               borderRadius: 24,
               boxShadow: '0 30px 60px rgba(0, 63, 73, 0.2)',
               position: 'relative',
               overflow: 'hidden'
             }}>
               <div style={{ position: 'absolute', top: 0, right: 0, padding: 20 }}>
                 <Cloud size={60} color="rgba(255,255,255,0.05)" />
               </div>
               <h3 className="brand-heading" style={{ color: 'var(--sunlit-rock)', fontSize: 18, marginBottom: 16 }}>
                 Provider Ecosystem
               </h3>
               <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                 {['Amazon Web Services (AWS)', 'Google Cloud Platform', 'Cloudflare Edge', 'Firebase Real-time Stack'].map((item, i) => (
                   <li key={i} style={{ 
                     fontSize: 14, color: 'white', display: 'flex', alignItems: 'center', gap: 12,
                     paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.1)'
                   }}>
                     <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--sunlit-rock)' }} />
                     {item}
                   </li>
                 ))}
               </ul>
             </div>
          </div>
        </div>

        {/* Feature Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: 32 
        }}>
          {infraFeatures.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              style={{ 
                padding: 32, 
                background: 'rgba(255, 255, 255, 0.5)',
                backdropFilter: 'blur(10px)',
                borderRadius: 20,
                border: '1px solid rgba(0, 63, 73, 0.1)',
                display: 'flex',
                flexDirection: 'column',
                gap: 20
              }}
            >
              <div style={{ 
                width: 44, 
                height: 44, 
                borderRadius: 10, 
                background: 'var(--teal)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--sunlit-rock)'
              }}>
                {feature.icon}
              </div>
              <h3 className="brand-heading" style={{ fontSize: 16, color: 'var(--teal)', margin: 0 }}>
                {feature.title}
              </h3>
              <p style={{ fontSize: 14, color: 'var(--text-dim)', lineHeight: 1.6, margin: 0 }}>
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Global Presence Section */}
      <section style={{ 
        padding: '100px 24px', 
        background: 'var(--teal)', 
        color: 'white',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <Globe size={48} color="var(--sunlit-rock)" style={{ marginBottom: 24 }} />
          <h2 className="brand-heading" style={{ fontSize: 32, marginBottom: 24 }}>
            Global Distribution
          </h2>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.7)', lineHeight: 1.8, marginBottom: 40 }}>
            Our infrastructure is distributed across major global data centers, with specialized nodes in the Middle East region to ensure optimal performance for the Ras El Hekma development. Data is replicated across multiple availability zones to eliminate single points of failure.
          </p>
          <div style={{ 
            height: 200, 
            background: 'rgba(255,255,255,0.03)', 
            borderRadius: 24, 
            border: '1px dashed rgba(255,255,255,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative'
          }}>
            <span style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.2em', opacity: 0.3 }}>
              Interactive Network Map
            </span>
            {/* Visual simulation of dots */}
            {[...Array(15)].map((_, i) => (
              <div key={i} style={{ 
                position: 'absolute',
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                width: 4, height: 4, borderRadius: '50%', background: 'var(--sunlit-rock)',
                boxShadow: '0 0 10px var(--sunlit-rock)',
                opacity: 0.6
              }} />
            ))}
          </div>
        </div>
      </section>
    </PremiumPageLayout>
  );
}
