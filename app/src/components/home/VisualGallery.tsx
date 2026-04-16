'use client';

import { useRef, useState } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { X, ZoomIn } from 'lucide-react';
import type { HomeGalleryImage } from '@/lib/types';

interface VisualGalleryProps {
  images: HomeGalleryImage[];
}

const TAG_LABELS: Record<string, string> = {
  masterplan: 'Masterplan',
  site: 'Site Progress',
  bim: 'BIM Visuals',
  other: 'Other',
};

export default function VisualGallery({ images }: VisualGalleryProps) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const [lightboxImage, setLightboxImage] = useState<HomeGalleryImage | null>(null);
  const [activeTag, setActiveTag] = useState<string>('all');

  const sorted = [...images].sort((a, b) => a.order - b.order);
  const filtered = activeTag === 'all' ? sorted : sorted.filter(img => img.tag === activeTag);
  const availableTags = ['all', ...Array.from(new Set(images.map(i => i.tag)))];

  if (images.length === 0) return null;

  return (
    <section ref={ref} style={{ padding: '100px 24px', maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
        style={{ textAlign: 'center', marginBottom: 40 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 14 }}>
          <div style={{ width: 40, height: 1, background: 'var(--sunlit-rock)' }} />
          <span style={{ fontSize: 11, fontWeight: 900, color: 'var(--sunlit-rock)', textTransform: 'uppercase', letterSpacing: '0.3em' }}>Visual Gallery</span>
          <div style={{ width: 40, height: 1, background: 'var(--sunlit-rock)' }} />
        </div>
        <h2 className="brand-heading" style={{ fontSize: 'clamp(24px, 4vw, 38px)', color: 'var(--teal)', margin: 0 }}>
          Project Visuals
        </h2>
      </motion.div>

      {/* Tag Filter */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ delay: 0.3 }}
        style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 36, flexWrap: 'wrap' }}
      >
        {availableTags.map(tag => (
          <button
            key={tag}
            onClick={() => setActiveTag(tag)}
            style={{
              padding: '8px 20px', borderRadius: 100, fontSize: 11, fontWeight: 800,
              textTransform: 'uppercase', letterSpacing: '0.1em', border: 'none', cursor: 'pointer',
              background: activeTag === tag ? 'var(--teal)' : 'rgba(0, 63, 73, 0.06)',
              color: activeTag === tag ? 'var(--cotton)' : 'var(--teal)',
              transition: 'all 200ms',
            }}
          >
            {tag === 'all' ? 'All' : TAG_LABELS[tag] || tag}
          </button>
        ))}
      </motion.div>

      {/* Gallery Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: 16,
      }}>
        {filtered.map((img, i) => (
          <motion.div
            key={img.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={{ delay: 0.1 + i * 0.08, duration: 0.5 }}
            onClick={() => setLightboxImage(img)}
            style={{
              position: 'relative', borderRadius: 18, overflow: 'hidden',
              aspectRatio: '4/3', cursor: 'pointer',
              border: '1px solid rgba(0, 63, 73, 0.08)',
              boxShadow: '0 4px 16px rgba(0, 63, 73, 0.04)',
              transition: 'all 300ms',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.transform = 'scale(1.02)';
              (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 40px rgba(0, 63, 73, 0.1)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
              (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(0, 63, 73, 0.04)';
            }}
          >
            <img src={img.url} alt={img.caption} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 500ms' }} />
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(180deg, transparent 50%, rgba(0,63,73,0.7) 100%)',
              opacity: 0, transition: 'opacity 300ms',
              display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
              padding: 16,
            }}
              className="gallery-overlay"
            >
              <span style={{ color: 'var(--cotton)', fontSize: 13, fontWeight: 600 }}>{img.caption}</span>
              <ZoomIn size={18} color="var(--cotton)" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightboxImage(null)}
            style={{
              position: 'fixed', inset: 0, zIndex: 10000,
              background: 'rgba(0, 30, 36, 0.9)', backdropFilter: 'blur(20px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40,
              cursor: 'zoom-out',
            }}
          >
            <button
              onClick={() => setLightboxImage(null)}
              style={{
                position: 'absolute', top: 24, right: 24,
                width: 44, height: 44, borderRadius: 14,
                background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: 'white', zIndex: 10,
              }}
            >
              <X size={20} />
            </button>
            <motion.img
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              src={lightboxImage.url}
              alt={lightboxImage.caption}
              style={{ maxWidth: '90vw', maxHeight: '85vh', borderRadius: 16, objectFit: 'contain' }}
            />
            <div style={{ position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)', color: 'var(--cotton)', fontSize: 14, fontWeight: 600, textAlign: 'center' }}>
              {lightboxImage.caption}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
