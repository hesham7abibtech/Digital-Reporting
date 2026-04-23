'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Image as ImageIcon, Type, BarChart3, Layout, Grid, Eye, EyeOff,
  Plus, Trash2, GripVertical, Save, Loader2, ChevronDown, Upload,
  FileText, Box, Database, Globe, Shield, Activity, Layers, Cpu, Zap, ArrowUp, ArrowDown
} from 'lucide-react';
import { useDocument } from 'react-firebase-hooks/firestore';
import { doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { updateHomePageConfig, uploadFile } from '@/services/FirebaseService';
import type { HomePageConfig, HomeMetricItem, HomeModuleItem, HomeGalleryImage } from '@/lib/types';
import { DEFAULT_CONFIG } from '@/hooks/useHomePageData';

const ICON_OPTIONS = ['FileText', 'Layers', 'Box', 'BarChart3', 'Database', 'Globe', 'Shield', 'Activity', 'Cpu', 'Zap'];
const SOCIAL_ICON_OPTIONS = ['Linkedin', 'Twitter', 'Facebook', 'Instagram', 'Youtube', 'Github', 'Globe'];

const sectionStyle: React.CSSProperties = {
  padding: '32px',
  background: 'var(--section-bg)',
  border: '1px solid var(--border)',
  borderRadius: 24,
  marginBottom: 24,
};

const labelStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 900, color: 'var(--text-secondary)',
  textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8, display: 'block',
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 16px', borderRadius: 12,
  background: 'var(--section-bg)', border: '1px solid var(--border)',
  color: 'var(--text-primary)', fontSize: 14, outline: 'none', transition: 'all 200ms',
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle, resize: 'none' as const,
};

interface Props {
  showToast: (msg: string, type?: 'SUCCESS' | 'ERROR' | 'INFO', progress?: number) => void;
}

export default function HomePageEditor({ showToast }: Props) {
  const [snapshot, loading] = useDocument(doc(db, 'settings', 'homePage'));
  const [config, setConfig] = useState<HomePageConfig>(DEFAULT_CONFIG);
  const [initialized, setInitialized] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('hero');

  useEffect(() => {
    if (snapshot?.exists() && !initialized) {
      const remoteData = snapshot.data();
      setConfig({
        ...DEFAULT_CONFIG,
        ...remoteData,
        hero: { ...DEFAULT_CONFIG.hero, ...(remoteData.hero || {}) },
        overview: { ...DEFAULT_CONFIG.overview, ...(remoteData.overview || {}) },
        trust: { 
          ...DEFAULT_CONFIG.trust, 
          ...(remoteData.trust || {}),
          logos: (remoteData.trust?.logos?.length > 0) ? remoteData.trust.logos : DEFAULT_CONFIG.trust.logos
        },
        footer: { ...DEFAULT_CONFIG.footer, ...(remoteData.footer || {}) },
        dashboardPreview: { ...DEFAULT_CONFIG.dashboardPreview, ...(remoteData.dashboardPreview || {}) }
      } as HomePageConfig);
      setInitialized(true);
    } else if (!snapshot?.exists() && !loading && !initialized) {
      setInitialized(true);
    }
  }, [snapshot, loading, initialized]);

  const save = async (partial?: Partial<HomePageConfig>) => {
    setSaving(true);
    try {
      const data = partial ? { ...config, ...partial } : config;
      await updateHomePageConfig(data);
      if (partial) setConfig(prev => ({ ...prev, ...partial }));
      showToast('Home Page configuration saved.', 'SUCCESS');
    } catch (e) {
      showToast('Failed to save configuration.', 'ERROR');
    } finally {
      setSaving(false);
    }
  };

  const autoSave = (updatedConfig: HomePageConfig) => {
    setConfig(updatedConfig);
    // Debounce auto-save
    clearTimeout((window as any).__homePageAutoSave);
    (window as any).__homePageAutoSave = setTimeout(() => {
      updateHomePageConfig(updatedConfig).catch(console.error);
    }, 1500);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadFile(file, `homepage/${field}-${Date.now()}`);
      const updated = { ...config };
      if (field === 'hero-bg') {
        updated.hero = { ...updated.hero, backgroundUrl: url };
      } else if (field === 'dashboard-preview') {
        updated.dashboardPreview = { ...updated.dashboardPreview, screenshotUrl: url };
      }
      autoSave(updated);
      showToast('Image uploaded successfully.', 'SUCCESS');
    } catch (err) {
      showToast('Upload failed.', 'ERROR');
    }
  };

  const sections = [
    { id: 'hero', label: 'Hero Section', icon: <ImageIcon size={16} /> },
    { id: 'overview', label: 'Project Info', icon: <Type size={16} /> },
    { id: 'metrics', label: 'Metrics', icon: <BarChart3 size={16} /> },
    { id: 'modules', label: 'Modules', icon: <Grid size={16} /> },
    { id: 'gallery', label: 'Gallery', icon: <Layout size={16} /> },
    { id: 'trust', label: 'Trusted Partners', icon: <Shield size={16} /> },
    { id: 'footer', label: 'Footer Content', icon: <Globe size={16} /> },
    { id: 'preview', label: 'Dashboard Preview', icon: <Eye size={16} /> },
  ];

  if (loading && !initialized) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 80 }}>
        <Loader2 className="animate-spin" size={24} color="var(--teal)" />
      </div>
    );
  }

  return (
    <div>
      {/* Section Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 32, flexWrap: 'wrap' }}>
        {sections.map(s => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            style={{
              padding: '10px 18px', borderRadius: 12, cursor: 'pointer',
              background: activeSection === s.id ? 'rgba(212, 175, 55, 0.2)' : 'var(--section-bg)',
              color: activeSection === s.id ? 'var(--teal)' : 'var(--text-secondary)',
              fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em',
              display: 'flex', alignItems: 'center', gap: 8, transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
              border: activeSection === s.id ? '1px solid rgba(212, 175, 55, 0.5)' : '1px solid var(--border)',
              boxShadow: activeSection === s.id ? '0 8px 24px rgba(212, 175, 55, 0.15)' : 'none',
              transform: activeSection === s.id ? 'translateY(-2px)' : 'translateY(0)',
            }}
          >
            {s.icon} {s.label}
          </button>
        ))}
      </div>

      {/* Hero Section Editor */}
      {activeSection === 'hero' && (
        <div style={sectionStyle}>
          <h3 style={{ fontSize: 16, fontWeight: 900, color: 'var(--text-primary)', margin: '0 0 24px' }}>Hero Section</h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div>
              <label style={labelStyle}>Title</label>
              <input style={inputStyle} value={config.hero.title}
                onChange={e => autoSave({ ...config, hero: { ...config.hero, title: e.target.value } })} />
            </div>
            <div>
              <label style={labelStyle}>Subtitle</label>
              <input style={inputStyle} value={config.hero.subtitle}
                onChange={e => autoSave({ ...config, hero: { ...config.hero, subtitle: e.target.value } })} />
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <label style={labelStyle}>Tagline</label>
            <input style={inputStyle} value={config.hero.tagline}
              onChange={e => autoSave({ ...config, hero: { ...config.hero, tagline: e.target.value } })} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 16 }}>
            <div>
              <label style={labelStyle}>Primary CTA Text</label>
              <input style={inputStyle} value={config.hero.ctaPrimary}
                onChange={e => autoSave({ ...config, hero: { ...config.hero, ctaPrimary: e.target.value } })} />
            </div>
            <div>
              <label style={labelStyle}>Secondary CTA Text</label>
              <input style={inputStyle} value={config.hero.ctaSecondary}
                onChange={e => autoSave({ ...config, hero: { ...config.hero, ctaSecondary: e.target.value } })} />
            </div>
          </div>

          <div style={{ marginTop: 20 }}>
            <label style={labelStyle}>Background Image</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {config.hero.backgroundUrl && (
                <div style={{ width: 120, height: 68, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)' }}>
                  <img src={config.hero.backgroundUrl} alt="Hero BG" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}
              <label style={{
                padding: '10px 20px', borderRadius: 12,
                background: 'var(--secondary)', border: '1px solid var(--border)',
                color: 'var(--teal)', fontSize: 12, fontWeight: 800, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <Upload size={14} /> Upload Image
                <input type="file" accept="image/*" style={{ display: 'none' }}
                  onChange={e => handleImageUpload(e, 'hero-bg')} />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Overview Section Editor */}
      {activeSection === 'overview' && (
        <div style={sectionStyle}>
          <h3 style={{ fontSize: 16, fontWeight: 900, color: 'var(--text-primary)', margin: '0 0 24px' }}>Project Overview</h3>

          <label style={labelStyle}>Description</label>
          <textarea rows={3} style={textareaStyle} value={config.overview.description}
            onChange={e => autoSave({ ...config, overview: { ...config.overview, description: e.target.value } })} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 16 }}>
            {(['developer', 'consultant', 'location', 'scope'] as const).map(field => (
              <div key={field}>
                <label style={labelStyle}>{field}</label>
                <input style={inputStyle} value={config.overview[field]}
                  onChange={e => autoSave({ ...config, overview: { ...config.overview, [field]: e.target.value } })} />
              </div>
            ))}
          </div>

          <div style={{ marginTop: 20 }}>
            <label style={labelStyle}>Highlights</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {config.overview.highlights.map((hl, i) => (
                <div key={i} style={{ display: 'flex', gap: 8 }}>
                  <input style={{ ...inputStyle, flex: 1 }} value={hl}
                    onChange={e => {
                      const highlights = [...config.overview.highlights];
                      highlights[i] = e.target.value;
                      autoSave({ ...config, overview: { ...config.overview, highlights } });
                    }} />
                  <button onClick={() => {
                    const highlights = config.overview.highlights.filter((_, idx) => idx !== i);
                    autoSave({ ...config, overview: { ...config.overview, highlights } });
                  }} style={{ padding: '0 12px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', cursor: 'pointer' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              <button onClick={() => {
                const highlights = [...config.overview.highlights, ''];
                autoSave({ ...config, overview: { ...config.overview, highlights } });
              }} style={{ padding: '10px', borderRadius: 12, background: 'var(--section-bg)', border: '1px dashed var(--border)', color: 'var(--text-secondary)', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Plus size={14} /> Add Highlight
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Metrics Section Editor */}
      {activeSection === 'metrics' && (
        <div style={sectionStyle}>
          <h3 style={{ fontSize: 16, fontWeight: 900, color: 'var(--text-primary)', margin: '0 0 24px' }}>Public Metrics</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {config.metrics.items.map((metric, i) => (
                <div key={metric.id} style={{
                  padding: 16, borderRadius: 16,
                  background: 'var(--section-bg)', border: '1px solid var(--border)',
                  display: 'grid', gridTemplateColumns: '1.5fr 0.8fr 0.4fr 0.4fr 1fr auto auto', gap: 8, alignItems: 'center',
                }}>
                <input style={inputStyle} placeholder="Label" value={metric.label}
                  onChange={e => {
                    const items = [...config.metrics.items];
                    items[i] = { ...items[i], label: e.target.value };
                    autoSave({ ...config, metrics: { items } });
                  }} />
                  <input style={inputStyle} type="number" placeholder="Value" value={metric.value}
                    onChange={e => {
                      const items = [...config.metrics.items];
                      items[i] = { ...items[i], value: parseInt(e.target.value) || 0 };
                      autoSave({ ...config, metrics: { items } });
                    }} />
                  <input style={inputStyle} placeholder="Pre" title="Prefix" value={metric.prefix || ''}
                    onChange={e => {
                      const items = [...config.metrics.items];
                      items[i] = { ...items[i], prefix: e.target.value };
                      autoSave({ ...config, metrics: { items } });
                    }} />
                  <input style={inputStyle} placeholder="Suf" title="Suffix" value={metric.suffix || ''}
                    onChange={e => {
                      const items = [...config.metrics.items];
                      items[i] = { ...items[i], suffix: e.target.value };
                      autoSave({ ...config, metrics: { items } });
                    }} />
                <select style={{ ...inputStyle, cursor: 'pointer' }} value={metric.icon}
                  onChange={e => {
                    const items = [...config.metrics.items];
                    items[i] = { ...items[i], icon: e.target.value };
                    autoSave({ ...config, metrics: { items } });
                  }}>
                  {ICON_OPTIONS.map(ic => <option key={ic} value={ic}>{ic}</option>)}
                </select>
                <button onClick={() => {
                  const items = [...config.metrics.items];
                  items[i] = { ...items[i], isVisible: !items[i].isVisible };
                  autoSave({ ...config, metrics: { items } });
                }} style={{ padding: 10, borderRadius: 10, background: metric.isVisible ? 'rgba(16,185,129,0.1)' : 'var(--section-bg)', border: `1px solid ${metric.isVisible ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.08)'}`, color: metric.isVisible ? '#10b981' : 'var(--text-secondary)', cursor: 'pointer' }}>
                  {metric.isVisible ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
                <button onClick={() => {
                  const items = config.metrics.items.filter((_, idx) => idx !== i);
                  autoSave({ ...config, metrics: { items } });
                }} style={{ padding: 10, borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', cursor: 'pointer' }}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            <button onClick={() => {
              const items = [...config.metrics.items, { id: `m-${Date.now()}`, label: 'New Metric', value: 0, suffix: '+', icon: 'Activity', isVisible: true }];
              autoSave({ ...config, metrics: { items } });
            }} style={{ padding: '12px', borderRadius: 14, background: 'var(--section-bg)', border: '1px dashed var(--border)', color: 'var(--text-secondary)', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Plus size={14} /> Add Metric
            </button>
          </div>
        </div>
      )}

      {/* Modules Section Editor */}
      {activeSection === 'modules' && (
        <div style={sectionStyle}>
          <h3 style={{ fontSize: 16, fontWeight: 900, color: 'var(--text-primary)', margin: '0 0 24px' }}>Feature Modules</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {config.modules.items.map((mod, i) => (
              <div key={mod.id} style={{
                padding: 20, borderRadius: 16,
                background: 'var(--section-bg)', border: '1px solid var(--border)',
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: 12, marginBottom: 10 }}>
                  <input style={inputStyle} placeholder="Title" value={mod.title}
                    onChange={e => {
                      const items = [...config.modules.items];
                      items[i] = { ...items[i], title: e.target.value };
                      autoSave({ ...config, modules: { items } });
                    }} />
                  <select style={{ ...inputStyle, cursor: 'pointer' }} value={mod.icon}
                    onChange={e => {
                      const items = [...config.modules.items];
                      items[i] = { ...items[i], icon: e.target.value };
                      autoSave({ ...config, modules: { items } });
                    }}>
                    {ICON_OPTIONS.map(ic => <option key={ic} value={ic}>{ic}</option>)}
                  </select>
                  <button onClick={() => {
                    const items = config.modules.items.filter((_, idx) => idx !== i);
                    autoSave({ ...config, modules: { items } });
                  }} style={{ padding: 10, borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', cursor: 'pointer' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
                <textarea rows={2} style={textareaStyle} placeholder="Description" value={mod.description}
                  onChange={e => {
                    const items = [...config.modules.items];
                    items[i] = { ...items[i], description: e.target.value };
                    autoSave({ ...config, modules: { items } });
                  }} />
              </div>
            ))}
            <button onClick={() => {
              const items = [...config.modules.items, { id: `mod-${Date.now()}`, title: 'New Module', description: '', icon: 'Activity', order: config.modules.items.length }];
              autoSave({ ...config, modules: { items } });
            }} style={{ padding: '12px', borderRadius: 14, background: 'var(--section-bg)', border: '1px dashed var(--border)', color: 'var(--text-secondary)', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Plus size={14} /> Add Module
            </button>
          </div>
        </div>
      )}

      {/* Gallery Section Editor */}
      {activeSection === 'gallery' && (
        <div style={sectionStyle}>
          <h3 style={{ fontSize: 16, fontWeight: 900, color: 'var(--text-primary)', margin: '0 0 24px' }}>Visual Gallery</h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: 16 }}>
            {config.gallery.images.map((img, i) => (
              <div key={img.id} style={{
                borderRadius: 14, overflow: 'hidden',
                border: '1px solid var(--border)', position: 'relative',
              }}>
                <img src={img.url} alt={img.caption} style={{ width: '100%', height: 120, objectFit: 'cover' }} />
                <div style={{ padding: 10 }}>
                  <input style={{ ...inputStyle, fontSize: 11, padding: '6px 10px' }} placeholder="Caption" value={img.caption}
                    onChange={e => {
                      const images = [...config.gallery.images];
                      images[i] = { ...images[i], caption: e.target.value };
                      autoSave({ ...config, gallery: { images } });
                    }} />
                </div>
                <button onClick={() => {
                  const images = config.gallery.images.filter((_, idx) => idx !== i);
                  autoSave({ ...config, gallery: { images } });
                }} style={{
                  position: 'absolute', top: 6, right: 6, width: 28, height: 28, borderRadius: 8,
                  background: 'rgba(0,0,0,0.6)', border: 'none', color: '#ef4444',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>

          <label style={{
            padding: '14px', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            background: 'var(--section-bg)', border: '1px dashed var(--border)',
            color: 'var(--text-secondary)', fontSize: 12, fontWeight: 700, cursor: 'pointer',
          }}>
            <Upload size={14} /> Upload Gallery Image
            <input type="file" accept="image/*" style={{ display: 'none' }}
              onChange={async e => {
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                  const url = await uploadFile(file, `homepage/gallery-${Date.now()}`);
                  const images = [...config.gallery.images, { id: `gal-${Date.now()}`, url, caption: file.name.split('.')[0], tag: 'other' as const, order: config.gallery.images.length }];
                  autoSave({ ...config, gallery: { images } });
                  showToast('Gallery image added.', 'SUCCESS');
                } catch (err) {
                  showToast('Upload failed.', 'ERROR');
                }
              }} />
          </label>
        </div>
      )}
      
      {/* Trust Section Editor */}
      {activeSection === 'trust' && (
        <div style={sectionStyle}>
          <h3 style={{ fontSize: 16, fontWeight: 900, color: 'var(--text-primary)', margin: '0 0 24px' }}>Trusted Partners</h3>

          <label style={labelStyle}>Trust Statement</label>
          <textarea rows={3} style={textareaStyle} value={config.trust.statement}
            onChange={e => autoSave({ ...config, trust: { ...config.trust, statement: e.target.value } })} />

          <div style={{ marginTop: 24 }}>
            <label style={labelStyle}>Partner Logos</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, marginBottom: 16 }}>
              {config.trust.logos.map((logo, i) => (
                <div key={logo.id} style={{
                  padding: 12, borderRadius: 14, background: 'var(--section-bg)',
                  border: '1px solid var(--border)', position: 'relative',
                  display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center',
                  opacity: logo.isVisible === false ? 0.6 : 1
                }}>
                  <div style={{ 
                    width: '100%', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    background: '#fff', borderRadius: 8, padding: 8, position: 'relative', overflow: 'hidden',
                    border: '1px solid var(--border)'
                  }}>
                    <img src={logo.url} alt={logo.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                    <label style={{
                      position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      opacity: 0, cursor: 'pointer', transition: 'opacity 200ms',
                    }} className="hover-overlay">
                      <Upload size={14} color="#fff" />
                      <input type="file" accept="image/*" style={{ display: 'none' }}
                        onChange={async e => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          try {
                            const url = await uploadFile(file, `homepage/trust-${Date.now()}`);
                            const logos = [...config.trust.logos];
                            logos[i] = { ...logos[i], url };
                            autoSave({ ...config, trust: { ...config.trust, logos } });
                            showToast('Logo updated.', 'SUCCESS');
                          } catch (err) {
                            showToast('Update failed.', 'ERROR');
                          }
                        }} />
                    </label>
                  </div>
                  
                  <style>{`
                    div:hover > div > .hover-overlay { opacity: 1 !important; }
                  `}</style>

                  <div style={{ display: 'flex', gap: 4, width: '100%' }}>
                    <input style={{ ...inputStyle, fontSize: 11, padding: '6px 10px', flex: 1 }} placeholder="Partner Name" value={logo.name}
                      onChange={e => {
                        const logos = [...config.trust.logos];
                        logos[i] = { ...logos[i], name: e.target.value };
                        autoSave({ ...config, trust: { ...config.trust, logos } });
                      }} />
                    <button onClick={() => {
                      const logos = [...config.trust.logos];
                      logos[i] = { ...logos[i], isVisible: logo.isVisible === false };
                      autoSave({ ...config, trust: { ...config.trust, logos } });
                    }} style={{ 
                      padding: 8, borderRadius: 8, 
                      background: logo.isVisible !== false ? 'rgba(16,185,129,0.1)' : 'var(--section-bg)', 
                      border: `1px solid ${logo.isVisible !== false ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.08)'}`, 
                      color: logo.isVisible !== false ? '#10b981' : 'var(--text-secondary)', 
                      cursor: 'pointer' 
                    }}>
                      {logo.isVisible !== false ? <Eye size={12} /> : <EyeOff size={12} />}
                    </button>
                  </div>

                  <input style={{ ...inputStyle, fontSize: 11, padding: '6px 10px' }} placeholder="Website URL (Optional)" value={logo.linkUrl || ''}
                    onChange={e => {
                      const logos = [...config.trust.logos];
                      logos[i] = { ...logos[i], linkUrl: e.target.value };
                      autoSave({ ...config, trust: { ...config.trust, logos } });
                    }} />
                  <button onClick={() => {
                    const logos = config.trust.logos.filter((_, idx) => idx !== i);
                    autoSave({ ...config, trust: { ...config.trust, logos } });
                  }} style={{
                    position: 'absolute', top: -8, right: -8, width: 24, height: 24, borderRadius: 12,
                    background: '#ef4444', border: '2px solid var(--body-bg)', color: '#fff',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                  }}>
                    <Trash2 size={10} />
                  </button>
                </div>
              ))}
            </div>

            <label style={{
              padding: '14px', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              background: 'var(--section-bg)', border: '1px dashed var(--border)',
              color: 'var(--text-secondary)', fontSize: 12, fontWeight: 700, cursor: 'pointer',
            }}>
              <Upload size={14} /> Upload Partner Logo
              <input type="file" accept="image/*" style={{ display: 'none' }}
                onChange={async e => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    const url = await uploadFile(file, `homepage/trust-${Date.now()}`);
                    const logos = [...config.trust.logos, { id: `trust-${Date.now()}`, url, name: file.name.split('.')[0] }];
                    autoSave({ ...config, trust: { ...config.trust, logos } });
                    showToast('Partner logo added.', 'SUCCESS');
                  } catch (err) {
                    showToast('Upload failed.', 'ERROR');
                  }
                }} />
            </label>
          </div>
        </div>
      )}

      {/* Footer Section Editor */}
      {activeSection === 'footer' && (
        <div style={sectionStyle}>
          <h3 style={{ fontSize: 16, fontWeight: 900, color: 'var(--text-primary)', margin: '0 0 24px' }}>Footer Content</h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div>
              <label style={labelStyle}>About Title</label>
              <input style={inputStyle} value={config.footer.aboutTitle}
                onChange={e => autoSave({ ...config, footer: { ...config.footer, aboutTitle: e.target.value } })} />
            </div>
            <div>
              <label style={labelStyle}>System Version</label>
              <input style={inputStyle} value={config.footer.version}
                onChange={e => autoSave({ ...config, footer: { ...config.footer, version: e.target.value } })} />
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <label style={labelStyle}>About Description</label>
            <textarea rows={2} style={textareaStyle} value={config.footer.aboutDescription}
              onChange={e => autoSave({ ...config, footer: { ...config.footer, aboutDescription: e.target.value } })} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 16 }}>
            <div>
              <label style={labelStyle}>Contact Email</label>
              <input style={inputStyle} value={config.footer.contactEmail}
                onChange={e => autoSave({ ...config, footer: { ...config.footer, contactEmail: e.target.value } })} />
            </div>
            <div>
              <label style={labelStyle}>Website URL</label>
              <input style={inputStyle} value={config.footer.contactWebsite}
                onChange={e => autoSave({ ...config, footer: { ...config.footer, contactWebsite: e.target.value } })} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Contact Address</label>
              <input style={inputStyle} value={config.footer.contactAddress}
                onChange={e => autoSave({ ...config, footer: { ...config.footer, contactAddress: e.target.value } })} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Contact Address Hyperlink (Optional)</label>
              <input style={inputStyle} value={config.footer.contactAddressLink || ''}
                placeholder="Custom Google Maps link or location URL"
                onChange={e => autoSave({ ...config, footer: { ...config.footer, contactAddressLink: e.target.value } })} />
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <label style={labelStyle}>Copyright Text</label>
            <input style={inputStyle} value={config.footer.copyright}
              onChange={e => autoSave({ ...config, footer: { ...config.footer, copyright: e.target.value } })} />
          </div>

          <div style={{ marginTop: 16 }}>
            <label style={labelStyle}>Platform Tagline (Bottom Right)</label>
            <input style={inputStyle} value={config.footer.platformName}
              onChange={e => autoSave({ ...config, footer: { ...config.footer, platformName: e.target.value } })} />
          </div>

          {/* System Links Editor */}
          <div style={{ marginTop: 24 }}>
            <label style={labelStyle}>System Links</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {config.footer.systemItems?.map((item, i) => (
                <div key={item.id} style={{ display: 'flex', gap: 8 }}>
                  <input style={{ ...inputStyle, flex: 1 }} placeholder="Label" value={item.label}
                    onChange={e => {
                      const systemItems = [...config.footer.systemItems];
                      systemItems[i] = { ...systemItems[i], label: e.target.value };
                      autoSave({ ...config, footer: { ...config.footer, systemItems } });
                    }} />
                  <input style={{ ...inputStyle, flex: 2 }} placeholder="URL" value={item.url}
                    onChange={e => {
                      const systemItems = [...config.footer.systemItems];
                      systemItems[i] = { ...systemItems[i], url: e.target.value };
                      autoSave({ ...config, footer: { ...config.footer, systemItems } });
                    }} />
                  <button onClick={() => {
                    const systemItems = config.footer.systemItems.filter((_, idx) => idx !== i);
                    autoSave({ ...config, footer: { ...config.footer, systemItems } });
                  }} style={{ padding: '0 12px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', cursor: 'pointer' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              <button onClick={() => {
                const systemItems = [...(config.footer.systemItems || []), { id: `sys-${Date.now()}`, label: 'New Link', url: '#' }];
                autoSave({ ...config, footer: { ...config.footer, systemItems } });
              }} style={{ padding: '10px', borderRadius: 12, background: 'var(--section-bg)', border: '1px dashed var(--border)', color: 'var(--text-secondary)', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Plus size={14} /> Add System Link
              </button>
            </div>
          </div>

          {/* Social Links Editor */}
          <div style={{ marginTop: 24 }}>
            <label style={labelStyle}>Social Links</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {config.footer.socialLinks?.map((link, i) => (
                <div key={link.id} style={{ display: 'flex', gap: 8 }}>
                  <select style={{ ...inputStyle, flex: 1, cursor: 'pointer' }} value={link.icon}
                    onChange={e => {
                      const socialLinks = [...config.footer.socialLinks];
                      socialLinks[i] = { ...socialLinks[i], icon: e.target.value };
                      autoSave({ ...config, footer: { ...config.footer, socialLinks } });
                    }}>
                    {SOCIAL_ICON_OPTIONS.map(ic => <option key={ic} value={ic}>{ic}</option>)}
                  </select>
                  <input style={{ ...inputStyle, flex: 2 }} placeholder="URL" value={link.url}
                    onChange={e => {
                      const socialLinks = [...config.footer.socialLinks];
                      socialLinks[i] = { ...socialLinks[i], url: e.target.value };
                      autoSave({ ...config, footer: { ...config.footer, socialLinks } });
                    }} />
                  <button onClick={() => {
                    const socialLinks = config.footer.socialLinks.filter((_, idx) => idx !== i);
                    autoSave({ ...config, footer: { ...config.footer, socialLinks } });
                  }} style={{ padding: '0 12px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', cursor: 'pointer' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              <button onClick={() => {
                const socialLinks = [...(config.footer.socialLinks || []), { id: `soc-${Date.now()}`, label: 'Social', url: '#', icon: 'Linkedin' }];
                autoSave({ ...config, footer: { ...config.footer, socialLinks } });
              }} style={{ padding: '10px', borderRadius: 12, background: 'var(--section-bg)', border: '1px dashed var(--border)', color: 'var(--text-secondary)', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Plus size={14} /> Add Social Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dashboard Preview Editor */}
      {activeSection === 'preview' && (
        <div style={sectionStyle}>
          <h3 style={{ fontSize: 16, fontWeight: 900, color: 'var(--text-primary)', margin: '0 0 24px' }}>Dashboard Preview</h3>

          <label style={labelStyle}>Overlay Text</label>
          <input style={inputStyle} value={config.dashboardPreview.overlayText}
            onChange={e => autoSave({ ...config, dashboardPreview: { ...config.dashboardPreview, overlayText: e.target.value } })} />

          <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
            <label style={labelStyle}>Blur Overlay</label>
            <button onClick={() => autoSave({ ...config, dashboardPreview: { ...config.dashboardPreview, isBlurred: !config.dashboardPreview.isBlurred } })}
              style={{
                padding: '8px 20px', borderRadius: 10, cursor: 'pointer',
                background: config.dashboardPreview.isBlurred ? 'rgba(16,185,129,0.1)' : 'var(--section-bg)',
                color: config.dashboardPreview.isBlurred ? '#10b981' : 'var(--text-secondary)',
                fontSize: 12, fontWeight: 800,
                border: `1px solid ${config.dashboardPreview.isBlurred ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.08)'}`,
              }}>
              {config.dashboardPreview.isBlurred ? 'Enabled' : 'Disabled'}
            </button>
          </div>

          <div style={{ marginTop: 20 }}>
            <label style={labelStyle}>Preview Screenshot</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {config.dashboardPreview.screenshotUrl && (
                <div style={{ width: 200, height: 112, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)' }}>
                  <img src={config.dashboardPreview.screenshotUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}
              <label style={{
                padding: '10px 20px', borderRadius: 12,
                background: 'var(--secondary)', border: '1px solid var(--border)',
                color: 'var(--teal)', fontSize: 12, fontWeight: 800, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <Upload size={14} /> Upload Screenshot
                <input type="file" accept="image/*" style={{ display: 'none' }}
                  onChange={e => handleImageUpload(e, 'dashboard-preview')} />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Manual Save Button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
        <button
          onClick={() => save()}
          disabled={saving}
          style={{
            padding: '14px 32px', borderRadius: 14,
            background: 'var(--teal)', color: '#ffffff',
            border: 'none', fontSize: 13, fontWeight: 900,
            cursor: saving ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', gap: 10,
            boxShadow: '0 8px 24px var(--border)',
            letterSpacing: '0.05em',
          }}
        >
          {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
          SAVE ALL CHANGES
        </button>
      </div>
    </div>
  );
}
