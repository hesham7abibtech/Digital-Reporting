'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Cpu, MapPin, Users } from 'lucide-react';
import type { TeamMember, ProjectMetadata, Task } from '@/lib/types';

interface ProjectHeaderProps {
  members?: TeamMember[];
  project?: ProjectMetadata;
  tasks?: Task[];
  dateRangeText?: string;
}

export default function ProjectHeader({
  members,
  project,
  tasks,
  dateRangeText
}: ProjectHeaderProps) {
  const onlineMembers = members?.filter(m => m.isOnline).length ?? 0;

  // AI Status Intelligence
  const { statusLine, statusColor } = (() => {
    const delayedCount = tasks?.filter(t => t.status === 'DELAYED').length ?? 0;

    if (delayedCount > 0) return { statusLine: 'Critical Pipeline Blockage', statusColor: '#ef4444' };
    return { statusLine: project?.statusLine || 'Digital Workflow Online', statusColor: project?.statusColor || '#f59e0b' };
  })();

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
        alignItems: 'center'
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

      {/* Glass Overlay for Depth */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1,
          background: 'radial-gradient(circle at 20% 50%, rgba(10,10,15,0.4) 0%, rgba(10,10,15,0.8) 100%)',
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
                fontWeight: 700,
                letterSpacing: '-0.02em',
                background: 'linear-gradient(to right, #fff, #e2e8f0, #94a3b8)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                margin: 0,
              }}
            >
              {project?.title} - {project?.projectName}
            </h1>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 14, fontSize: 13, fontWeight: 600, letterSpacing: '0.01em' }}>
              {(project?.subtitles && project.subtitles.length > 0) ? (
                project.subtitles.map((sub, idx) => (
                  <React.Fragment key={`sub-${idx}`}>
                    {idx > 0 && <span style={{ color: 'rgba(255,255,255,0.2)', fontWeight: 300 }}>|</span>}
                    <span style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      color: idx === 0 ? '#ffffff' : 'rgba(255, 255, 255, 0.8)',
                      textTransform: idx === 0 ? 'uppercase' : 'none',
                      fontSize: idx === 0 ? 13 : 13,
                      letterSpacing: idx === 0 ? '0.05em' : 'normal'
                    }}>
                      {idx === 0 && <Cpu size={14} style={{ color: '#D4AF37', filter: 'drop-shadow(0 0 5px rgba(212, 175, 55, 0.5))' }} />}
                      {sub}
                    </span>
                  </React.Fragment>
                ))
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <Cpu size={14} style={{ color: '#D4AF37', filter: 'drop-shadow(0 0 5px rgba(212, 175, 55, 0.5))' }} />
                  Digital Project Hub
                </span>
              )}
              <span style={{ color: 'rgba(255,255,255,0.2)', fontWeight: 300 }}>|</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255, 255, 255, 0.8)' }}>
                <MapPin size={14} style={{ color: '#ef4444', filter: 'drop-shadow(0 0 5px rgba(239, 68, 68, 0.3))' }} />
                {project?.location || 'Digital Sector'}
              </span>
            </div>
          </div>

          {/* Dynamic Insight Badges */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
            {project?.headerBadges?.filter(b => b.isVisible).map((badge) => {
              let displayText = badge.label;
              const color = badge.color || '#D4AF37';

              // Handle Automated Data Injection
              if (badge.isAutomated) {
                if (badge.id === 'status-line') displayText = statusLine;
                if (badge.id === 'date-range') displayText = dateRangeText || 'MONTHLY PERFORMANCE';
                if (badge.id === 'task-count') displayText = `Deliverables Count: ${tasks?.length || 0}`;
              }

              return (
                <span
                  key={badge.id}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '6px 16px', borderRadius: 9999,
                    background: `${color}15`, border: `1px solid ${color}40`,
                    backdropFilter: 'blur(10px)',
                  }}
                >
                  <div style={{ 
                    width: 7, height: 7, borderRadius: '50%', 
                    background: color,
                    boxShadow: badge.id === 'task-count' || badge.id === 'date-range' ? `0 0 8px ${color}` : 'none'
                  }} className={badge.id === 'date-range' ? "animate-pulse" : ""} />
                  <span style={{ 
                    fontSize: 13, fontWeight: 800, color, 
                    textTransform: 'uppercase', letterSpacing: '0.06em' 
                  }}>
                    {displayText}
                  </span>
                </span>
              );
            })}

            {/* Legacy Fallback if no badges defined */}
            {(!project?.headerBadges || project.headerBadges.length === 0) && (
              <>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 9999, background: `${statusColor}15`, border: `1px solid ${statusColor}40` }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor }} />
                  <span style={{ fontSize: 14, fontWeight: 700, color: statusColor, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{statusLine}</span>
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 9999, background: 'rgba(212, 175, 55, 0.1)', border: '1px solid rgba(212, 175, 55, 0.3)', marginLeft: 0 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#D4AF37', boxShadow: '0 0 10px #D4AF37' }} className="animate-pulse" />
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#D4AF37', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{dateRangeText || 'MONTHLY PERFORMANCE'}</span>
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '6px 18px', borderRadius: 9999, background: 'rgba(99, 102, 241, 0.12)', border: '1px solid rgba(99, 102, 241, 0.3)', marginLeft: 0, backdropFilter: 'blur(10px)' }}>
                  <Cpu size={14} style={{ color: '#818cf8', filter: 'drop-shadow(0 0 5px rgba(99, 102, 241, 0.4))' }} />
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Deliverables Count: <span style={{ color: '#fff', marginLeft: 4, fontSize: 15, fontWeight: 900 }}>{tasks?.length || 0}</span>
                  </span>
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
