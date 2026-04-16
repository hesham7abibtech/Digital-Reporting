'use client';

import { Globe, Mail, MapPin } from 'lucide-react';

export default function HomeFooter() {
  return (
    <footer style={{
      padding: '48px 24px 32px',
      background: 'var(--teal)',
      color: 'var(--cotton)',
      position: 'relative',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 32, marginBottom: 40,
        }}>
          {/* Brand */}
          <div style={{ maxWidth: 350 }}>
            <h3 className="brand-heading" style={{
              fontSize: 20, color: 'var(--cotton)', margin: '0 0 12px', letterSpacing: '0.15em',
            }}>
              Digital Reporting
            </h3>
            <p style={{ fontSize: 13, color: 'rgba(249, 248, 242, 0.5)', lineHeight: 1.7, margin: 0 }}>
              Enterprise-grade digital project management and reporting platform for mega-scale real estate and construction projects.
            </p>
          </div>

          {/* Contact */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <span style={{ fontSize: 11, fontWeight: 900, color: 'var(--sunlit-rock)', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 4 }}>
              Contact
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <MapPin size={14} color="rgba(249, 248, 242, 0.4)" />
              <span style={{ fontSize: 13, color: 'rgba(249, 248, 242, 0.6)' }}>North Coast, Egypt</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Mail size={14} color="rgba(249, 248, 242, 0.4)" />
              <span style={{ fontSize: 13, color: 'rgba(249, 248, 242, 0.6)' }}>Hesham.habib@insiteinternational.com</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Globe size={14} color="rgba(249, 248, 242, 0.4)" />
              <span style={{ fontSize: 13, color: 'rgba(249, 248, 242, 0.6)' }}>insiteinternational.com</span>
            </div>
          </div>

          {/* System */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <span style={{ fontSize: 11, fontWeight: 900, color: 'var(--sunlit-rock)', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 4 }}>
              System
            </span>
            <span style={{ fontSize: 12, color: 'rgba(249, 248, 242, 0.5)' }}>Platform v2.0</span>
            <span style={{ fontSize: 12, color: 'rgba(249, 248, 242, 0.5)' }}>Enterprise Security</span>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'rgba(249, 248, 242, 0.08)', marginBottom: 24 }} />

        {/* Copyright */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 8,
        }}>
          <p style={{ fontSize: 11, color: 'rgba(249, 248, 242, 0.35)', margin: 0 }}>
            © {new Date().getFullYear()} Insite International (KEO) — All rights reserved.
          </p>
          <p style={{ fontSize: 11, color: 'rgba(249, 248, 242, 0.35)', margin: 0 }}>
            Digital Reporting Platform — Ras El Hekma Command Center
          </p>
        </div>
      </div>
    </footer>
  );
}
