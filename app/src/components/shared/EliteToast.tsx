'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X, Zap, ShieldAlert, Radio } from 'lucide-react';

type ToastType = 'SUCCESS' | 'ERROR' | 'INFO';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'SUCCESS') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div style={{ position: 'fixed', bottom: 40, left: '50%', transform: 'translateX(-50%)', zIndex: 99999, display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center' }}>
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: 60, scale: 0.9, filter: 'blur(10px)' }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
              style={{
                minWidth: 380,
                background: 'linear-gradient(135deg, rgba(20, 20, 30, 0.9) 0%, rgba(10, 10, 15, 0.95) 100%)',
                backdropFilter: 'blur(30px) saturate(180%)',
                borderRadius: 20,
                padding: '20px 24px',
                display: 'flex',
                alignItems: 'center',
                gap: 18,
                position: 'relative',
                overflow: 'hidden',
                border: `1px solid ${
                  toast.type === 'SUCCESS' ? 'rgba(16, 185, 129, 0.3)' : 
                  toast.type === 'ERROR' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(212, 175, 55, 0.3)'
                }`,
                boxShadow: `0 24px 60px rgba(0,0,0,0.6), 0 0 20px ${
                  toast.type === 'SUCCESS' ? 'rgba(16, 185, 129, 0.1)' : 
                  toast.type === 'ERROR' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(212, 175, 55, 0.1)'
                }`,
              }}
            >
              {/* Ultra Elite Scanline Effect */}
              <div 
                style={{ 
                  position: 'absolute', top: 0, left: 0, right: 0, height: 1, 
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
                  animation: 'scanline 2s linear infinite'
                }} 
              />
              <style>{`
                @keyframes scanline {
                  0% { transform: translateY(-100%) }
                  100% { transform: translateY(4000%) }
                }
              `}</style>

              <div style={{ 
                width: 44, height: 44, borderRadius: 14, 
                background: toast.type === 'SUCCESS' ? 'rgba(16, 185, 129, 0.15)' : toast.type === 'ERROR' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(212, 175, 55, 0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `inset 0 0 12px ${
                  toast.type === 'SUCCESS' ? 'rgba(16, 185, 129, 0.2)' : 
                  toast.type === 'ERROR' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(212, 175, 55, 0.2)'
                }`
              }}>
                {toast.type === 'SUCCESS' && <Zap size={22} color="#10b981" style={{ filter: 'drop-shadow(0 0 8px #10b981)' }} />}
                {toast.type === 'ERROR' && <ShieldAlert size={22} color="#ef4444" style={{ filter: 'drop-shadow(0 0 8px #ef4444)' }} />}
                {toast.type === 'INFO' && <Radio size={22} color="#D4AF37" style={{ filter: 'drop-shadow(0 0 8px #D4AF37)' }} />}
              </div>
              
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ 
                  fontSize: 11, fontWeight: 900, 
                  color: toast.type === 'SUCCESS' ? '#10b981' : toast.type === 'ERROR' ? '#ef4444' : '#D4AF37', 
                  textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 2,
                  display: 'flex', alignItems: 'center', gap: 6
                }}>
                  <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'currentColor' }} />
                  {toast.type === 'SUCCESS' ? 'Protocol Executed' : toast.type === 'ERROR' ? 'System Breach' : 'Data Beacon'}
                </div>
                <div style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 600, letterSpacing: '0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {toast.message}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ height: 24, width: 1, background: 'rgba(255,255,255,0.08)' }} />
                <button 
                  onClick={() => removeToast(toast.id)}
                  style={{ 
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', 
                    color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: 6,
                    borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                    e.currentTarget.style.color = '#fff';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                    e.currentTarget.style.color = 'rgba(255,255,255,0.4)';
                  }}
                >
                  <X size={15} />
                </button>
              </div>

              {/* Progress Bar */}
              <motion.div
                initial={{ scaleX: 1 }}
                animate={{ scaleX: 0 }}
                transition={{ duration: 5, ease: 'linear' }}
                style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0, height: 2,
                  background: toast.type === 'SUCCESS' ? '#10b981' : toast.type === 'ERROR' ? '#ef4444' : '#D4AF37',
                  transformOrigin: 'left',
                  boxShadow: `0 0 10px ${
                    toast.type === 'SUCCESS' ? '#10b981' : 
                    toast.type === 'ERROR' ? '#ef4444' : '#D4AF37'
                  }`
                }}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
