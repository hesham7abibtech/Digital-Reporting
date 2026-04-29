'use client';

import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import type { HomeHeroConfig } from '@/lib/types';

interface HeroSectionProps {
  config: HomeHeroConfig;
  isLoggedIn: boolean;
  onExploreCick: () => void;
  onLoginClick: () => void;
}

export default function HeroSection({ config, isLoggedIn, onExploreCick, onLoginClick }: HeroSectionProps) {
  return (
    <section id="hero" style={{
      position: 'relative', height: '100vh', width: '100%', overflow: 'hidden',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {/* Background Image with Parallax-like infinite zoom */}
      <motion.div
        initial={{ scale: 1.15 }}
        animate={{ scale: 1 }}
        transition={{ 
          duration: 20, 
          repeat: Infinity, 
          repeatType: 'reverse', 
          ease: 'easeInOut' 
        }}
        style={{
          position: 'absolute', inset: 0, zIndex: 0,
          backgroundImage: `url(${config.backgroundUrl})`,
          backgroundSize: 'cover', backgroundPosition: 'center',
        }}
      />

      {/* Dark Overlay Layer */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0,
        background: 'rgba(0, 20, 30, 0.45)',
      }} />

      {/* Gradient Overlays */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 1,
        background: 'linear-gradient(180deg, rgba(0,40,48,0.75) 0%, rgba(0,40,48,0.45) 35%, rgba(0,40,48,0.55) 65%, rgba(0,40,48,0.9) 100%)',
      }} />
      <div style={{
        position: 'absolute', inset: 0, zIndex: 1,
        background: 'radial-gradient(ellipse 80% 60% at 50% 40%, transparent 0%, rgba(0,20,24,0.5) 100%)',
      }} />

      {/* Content */}
      <div style={{ position: 'absolute', zIndex: 2, textAlign: 'center', width: '100%', maxWidth: 900, left: '50%', top: '50%', transform: 'translate(-50%, -50%)', padding: '0 24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

        {/* Partner Logos — Ultra Elite */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 1 }}
          style={{
            display: 'flex', alignItems: 'center', gap: 28, marginBottom: 40,
            padding: '12px 32px',
            background: 'rgba(255, 255, 255, 0.02)',
            backdropFilter: 'blur(12px)',
            borderRadius: 100,
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          }}
        >
          <img src="/logos/modon_logo.png" alt="MODON" style={{ height: 30, objectFit: 'contain', filter: 'brightness(0) invert(1)', opacity: 0.9 }} />
          <div style={{ width: 1, height: 22, background: 'rgba(255,255,255,0.15)' }} />
          <img src="/logos/insite_logo.png" alt="Insite International" style={{ height: 30, objectFit: 'contain', filter: 'brightness(0) invert(1)', opacity: 0.9 }} />
        </motion.div>

        {/* Decorative line */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: 60 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          style={{ height: 1.5, background: 'linear-gradient(90deg, transparent, var(--sunlit-rock), transparent)', margin: '0 auto 18px' }}
        />

        {/* Subtitle — High Contrast */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.7 }}
          style={{
            fontSize: 15, fontWeight: 900, color: '#ffffff',
            textTransform: 'uppercase', letterSpacing: '0.35em', marginBottom: 32,
            textShadow: '0 1px 3px rgba(0,0,0,0.9), 0 3px 10px rgba(0,0,0,0.5)',
            width: '100%', textAlign: 'center',
            background: 'linear-gradient(90deg, rgba(208,171,130,0.0), rgba(208,171,130,0.15), rgba(208,171,130,0.0))',
            padding: '8px 0',
            borderRadius: 4,
          }}
        >
          {config.subtitle}
        </motion.p>

        {/* Main Logo — Replacing Ras El Hekma & Wadi Yemm */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          style={{
            width: '100%',
            maxWidth: 500,
            marginBottom: 48,
            display: 'flex',
            justifyContent: 'center'
          }}
        >
          <img 
            src="/logos/ras_el_hekma_logo.png" 
            alt="Ras El Hekma" 
            style={{ 
              width: '100%', 
              height: 'auto', 
              maxHeight: 200, 
              objectFit: 'contain'
            }} 
          />
        </motion.div>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.7 }}
          style={{
            fontSize: 'clamp(16px, 2vw, 21px)', color: 'rgba(255, 255, 255, 0.9)',
            maxWidth: 600, margin: '0 auto 56px', lineHeight: 1.6,
            fontWeight: 500,
            textShadow: '0 1px 4px rgba(0,0,0,0.6), 0 3px 12px rgba(0,0,0,0.3)',
            textAlign: 'center',
          }}
        >
          {config.tagline}
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.7 }}
          style={{ display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap' }}
        >
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: '0 12px 40px rgba(208, 171, 130, 0.4)' }}
            whileTap={{ scale: 0.97 }}
            onClick={onExploreCick}
            style={{
              padding: '18px 42px', borderRadius: 20,
              background: 'var(--gold)',
              color: '#000000', fontSize: 15, fontWeight: 900, border: 'none',
              cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.15em',
              boxShadow: '0 8px 30px rgba(208, 171, 130, 0.2)',
              transition: 'all 400ms cubic-bezier(0.4, 0, 0.2, 1)',
              fontFamily: 'var(--font-heading)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: 'fit-content'
            }}
          >
            {config.ctaPrimary}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05, background: 'rgba(255, 255, 255, 0.1)', borderColor: 'rgba(255, 255, 255, 0.4)' }}
            whileTap={{ scale: 0.97 }}
            onClick={onLoginClick}
            style={{
              padding: '18px 42px', borderRadius: 20,
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(20px)',
              color: 'white', fontSize: 15, fontWeight: 800,
              border: '1px solid rgba(255, 255, 255, 0.2)',
              cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.15em',
              transition: 'all 400ms cubic-bezier(0.4, 0, 0.2, 1)',
              fontFamily: 'var(--font-heading)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              whiteSpace: 'nowrap',
              height: 'fit-content'
            }}
          >
            {isLoggedIn ? 'Access Portal' : config.ctaSecondary}
          </motion.button>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        onClick={() => {
          const el = document.getElementById('overview');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
        style={{
          position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)',
          zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
          cursor: 'pointer',
        }}
      >
        <span style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.25em', textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>
          Scroll to explore
        </span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
        >
          <ChevronDown size={20} color="rgba(255,255,255,0.55)" />
        </motion.div>
      </motion.div>
    </section>
  );
}
