'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import type { TeamMember, ProjectMetadata, Task } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { Activity, MapPin, Cpu } from 'lucide-react';

interface ProjectHeaderProps {
  members?: TeamMember[];
  project?: ProjectMetadata;
  tasks?: Task[];
  dateRangeText?: string;
  activeReport?: 'DELIVERABLES' | 'BIM_REVIEWS';
  onReportChange?: (report: 'DELIVERABLES' | 'BIM_REVIEWS') => void;
  bimReviewsCount?: number;
}


export default function ProjectHeader({
  members,
  project,
  tasks,
  dateRangeText,
  activeReport = 'DELIVERABLES',
  onReportChange,
  bimReviewsCount = 0
}: ProjectHeaderProps) {
  const [isOnline, setIsOnline] = useState(true);
  const { userProfile } = useAuth();
  
  const hasDRAccess = userProfile?.access?.deliverablesRegistry === true;
  const hasBIMAccess = userProfile?.access?.bimReviews === true;

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const onlineMembers = members?.filter(m => m.isOnline).length ?? 0;

  return (


    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="glass-card"
      style={{
        padding: '24px 32px',
        position: 'relative',
        overflow: 'hidden',
        minHeight: 140,
        display: 'flex',
        alignItems: 'center',
        borderRadius: 24, // Hardened corners
        border: '1px solid rgba(0, 63, 73, 0.15)',
        boxShadow: '0 8px 32px rgba(0, 63, 73, 0.08)'
      }}
    >
      {/* Dynamic Site Background Asset */}
      {project?.headerBgUrl && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 0,
            backgroundImage: `url(${project.headerBgUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: `${project.headerBgPositionX || 50}% ${project.headerBgPositionY || 50}%`,
            opacity: (project.headerBgOpacity ?? 20) / 100,
            filter: project.headerBgOpacity === 100 ? 'none' : 'brightness(0.7) contrast(1.1)',
            transition: 'all 0.4s ease'
          }}
        />
      )}

      {/* Gradient Overlay for Depth */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1,
          background: 'radial-gradient(circle at 20% 50%, rgba(198, 224, 224, 0.08) 0%, var(--background) 100%)',
          opacity: project?.headerBgOpacity === 100 ? 0 : 1,
          transition: 'opacity 0.4s ease'
        }}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: 32, width: '100%', position: 'relative', zIndex: 2 }}>
        {/* Left - Project Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 4 }}>
              <h1
                style={{
                  fontSize: 28,
                  fontWeight: 900, // Maximum authority
                  letterSpacing: '0.04em',
                  color: '#FFFFFF', // High-contrast White
                  margin: 0,
                  fontFamily: 'var(--font-primary)',
                  textTransform: 'uppercase',
                  textShadow: '0 2px 12px rgba(0,0,0,0.6)'
                }}
              >
                {project?.title && (
                  <>
                    {project.title}
                    {project.projectName && ' — '}
                  </>
                )}
                {project?.projectName && (
                  <span style={{ color: '#FFFFFF', textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
                    {project.projectName}
                  </span>
                )}
              </h1>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 14, fontSize: 13, fontWeight: 600, letterSpacing: '0.01em' }}>
              {(project?.subtitles && project.subtitles.length > 0) &&
                project.subtitles.map((sub, idx) => (
                  <React.Fragment key={`sub-${idx}`}>
                    {idx > 0 && <span style={{ color: 'var(--text-dim)', fontWeight: 300 }}>|</span>}
                      <span style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        color: idx === 0 ? '#FFFFFF' : 'rgba(255, 255, 255, 0.9)',
                        textTransform: idx === 0 ? 'uppercase' : 'none',
                        fontSize: 13,
                        letterSpacing: idx === 0 ? '0.05em' : 'normal',
                        fontWeight: idx === 0 ? 800 : 600,
                        textShadow: '0 1px 4px rgba(0,0,0,0.4)'
                      }}>
                        {idx === 0 && <Activity size={14} style={{ color: 'var(--accent)' }} />}
                        {sub}
                      </span>
                  </React.Fragment>
                ))
              }
              {project?.location && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#FFFFFF', fontWeight: 800, textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>
                  <MapPin size={14} style={{ color: '#FF4C4F' }} />
                  {project.location}
                </span>
              )}

            </div>
          </div>

          {/* Dynamic Report Navigation Badges */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', marginTop: 8 }}>
            {hasDRAccess && (
              <button
                onClick={() => onReportChange?.('DELIVERABLES')}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '8px 20px', borderRadius: 10,
                  background: activeReport === 'DELIVERABLES' ? '#d0ab82' : 'rgba(0, 63, 73, 0.4)',
                  border: `1px solid ${activeReport === 'DELIVERABLES' ? '#d0ab82' : 'rgba(255, 255, 255, 0.2)'}`,
                  cursor: 'pointer',
                  transition: 'all 300ms',
                  boxShadow: activeReport === 'DELIVERABLES' ? '0 0 15px rgba(208, 171, 130, 0.3)' : 'none'
                }}
              >
                <div style={{ 
                  width: 6, height: 6, borderRadius: '50%', 
                  background: activeReport === 'DELIVERABLES' ? '#003f49' : '#FFFFFF',
                }} className={activeReport === 'DELIVERABLES' ? "animate-pulse" : ""} />
                <span style={{ 
                  fontSize: 12, fontWeight: 950, 
                  color: activeReport === 'DELIVERABLES' ? '#000000' : '#FFFFFF', 
                  textTransform: 'uppercase', letterSpacing: '0.08em' 
                }}>
                  Deliverables Registry Report
                </span>
              </button>
            )}

            {hasBIMAccess && (
              <button
                onClick={() => onReportChange?.('BIM_REVIEWS')}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '8px 20px', borderRadius: 10,
                  background: activeReport === 'BIM_REVIEWS' ? '#d0ab82' : 'rgba(0, 63, 73, 0.4)',
                  border: `1px solid ${activeReport === 'BIM_REVIEWS' ? '#d0ab82' : 'rgba(255, 255, 255, 0.2)'}`,
                  cursor: 'pointer',
                  transition: 'all 300ms',
                  boxShadow: activeReport === 'BIM_REVIEWS' ? '0 0 15px rgba(208, 171, 130, 0.3)' : 'none'
                }}
              >
                <div style={{ 
                  width: 6, height: 6, borderRadius: '50%', 
                  background: activeReport === 'BIM_REVIEWS' ? '#003f49' : '#FFFFFF',
                }} className={activeReport === 'BIM_REVIEWS' ? "animate-pulse" : ""} />
                <span style={{ 
                  fontSize: 12, fontWeight: 950, 
                  color: activeReport === 'BIM_REVIEWS' ? '#000000' : '#FFFFFF', 
                  textTransform: 'uppercase', letterSpacing: '0.08em' 
                }}>
                  BIM Reviews Report
                </span>
              </button>
            )}

            {project?.headerBadges?.filter(b => {
              if (!b.isVisible) return false;
              if (b.isAutomated) return b.id !== 'task-count'; // Show automated badges except count
              
              const label = (b.label || '').toUpperCase();
              // Exclude manual duplicates that match our primary navigation buttons or contain common typos
              if (label.includes('DELIVERABLE') || label.includes('DEILVAR') || label.includes('BIM')) return false;
              if (b.id === 'report-type') return false;
              return true;
            }).map((badge) => {


              let displayText = badge.label;
              const color = badge.color || '#D4AF37';


              // Handle Automated Data Injection
              if (badge.isAutomated) {
                if (badge.id === 'date-range') displayText = dateRangeText || 'MONTHLY PERFORMANCE';


              }


              return (
                <span
                  key={badge.id}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '8px 20px', borderRadius: 10,
                    background: badge.id === 'task-count' ? 'var(--teal)' : 'rgba(0, 63, 73, 0.6)', 
                    border: `1px solid rgba(255, 255, 255, 0.2)`,
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                  }}
                >
                  <div style={{ 
                    width: 6, height: 6, borderRadius: '50%', 
                    background: color,
                  }} className={badge.id === 'date-range' ? "animate-pulse" : ""} />
                  <span style={{ 
                    fontSize: 12, fontWeight: 950, color: badge.id === 'task-count' ? 'var(--aqua)' : '#FFFFFF', 
                    textTransform: 'uppercase', letterSpacing: '0.08em' 
                  }}>
                    {displayText}
                  </span>
                </span>
              );
            })}

            {/* Legacy Fallback if no badges defined */}
            {(!project?.headerBadges || project.headerBadges.length === 0) && (
              <>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 9999, background: 'rgba(212, 175, 55, 0.1)', border: '1px solid rgba(212, 175, 55, 0.3)', marginLeft: 0 }}>

                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#D4AF37', boxShadow: '0 0 10px #D4AF37' }} className="animate-pulse" />
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#D4AF37', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{dateRangeText || 'MONTHLY PERFORMANCE'}</span>
                </span>


              </>
            )}
          </div>
        </div>

        {/* Right - Project Logo Overlay */}
        {project?.logoUrl && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            style={{ 
              flexShrink: 0, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              paddingLeft: 32,
              borderLeft: '1px solid rgba(255,255,255,0.08)'
            }}
          >
            <img 
              src={project.logoUrl} 
              alt="Project Identity" 
              style={{ 
                maxHeight: 100, 
                width: 'auto', 
                maxWidth: 280,
                filter: 'brightness(1.2) drop-shadow(0 0 15px rgba(255,255,255,0.1))',
                objectFit: 'contain'
              }} 
            />
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
