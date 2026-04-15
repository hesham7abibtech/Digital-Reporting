'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

interface BrandedLoaderProps {
  isLoading: boolean;
  onFinished?: () => void;
}

export default function BrandedLoader({ isLoading, onFinished }: BrandedLoaderProps) {
  const [showProgress, setShowProgress] = useState(false);
  const [statusIndex, setStatusIndex] = useState(0);

  const statuses = [
    "ESTABLISHING SECURE CONNECTION",
    "SYNCHRONIZING GLOBAL REGISTRY",
    "HYDRATING INTELLIGENCE VECTORS",
    "OPTIMIZING HYBRID BRIDGE",
    "READY"
  ];

  useEffect(() => {
    const timer = setTimeout(() => setShowProgress(true), 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isLoading) {
      setStatusIndex(statuses.length - 1);
      const timer = setTimeout(() => {
        if (onFinished) onFinished();
      }, 500);
      return () => clearTimeout(timer);
    }

    const interval = setInterval(() => {
      setStatusIndex(prev => (prev + 1) % (statuses.length - 1));
    }, 1500);
    return () => clearInterval(interval);
  }, [isLoading, onFinished]);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'var(--background)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden'
          }}
        >
          {/* Ambient Glow Background */}
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            style={{
              position: 'absolute',
              width: '100vw',
              height: '100vh',
              background: 'radial-gradient(circle at center, rgba(198, 224, 224, 0.3) 0%, transparent 70%)',
              pointerEvents: 'none'
            }}
          />

          {/* Logo / Brand Name */}
          <div style={{ position: 'relative', marginBottom: 44 }}>
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: { staggerChildren: 0.3 }
                }
              }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12
              }}
            >
              <motion.h1
                variants={{
                  hidden: { y: 20, opacity: 0 },
                  visible: { y: 0, opacity: 1, transition: { duration: 0.8, ease: "easeOut" } }
                }}
                className="brand-heading"
                style={{
                  color: 'var(--text-primary)',
                  margin: 0,
                  textShadow: '0 4px 15px rgba(0,0,0,0.3)',
                }}
              >
                InSite
              </motion.h1>
              
              <motion.div
                variants={{
                  hidden: { width: 0, opacity: 0 },
                  visible: { width: 100, opacity: 1, transition: { duration: 1, ease: "easeInOut" } }
                }}
                style={{
                  height: 1,
                  background: 'linear-gradient(90deg, transparent, var(--accent), transparent)'
                }}
              />
              
              <motion.p
                variants={{
                  hidden: { y: 10, opacity: 0 },
                  visible: { y: 0, opacity: 0.7, transition: { duration: 0.8, ease: "easeOut" } }
                }}
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: '0.2em',
                  color: 'var(--text-primary)',
                  margin: 0,
                  textTransform: 'uppercase',
                  textAlign: 'center',
                  maxWidth: 320,
                  lineHeight: 1.6
                }}
              >
                Division of KEO International Consultants
              </motion.p>
            </motion.div>
          </div>

          {/* Central Animated Element */}
          <div style={{ position: 'relative', width: 120, height: 120 }}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              style={{
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                border: '2px solid rgba(255, 255, 255, 0.05)',
                borderTopColor: 'var(--secondary)',
                borderBottomColor: 'var(--secondary)',
                position: 'relative'
              }}
            />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
              style={{
                position: 'absolute',
                top: 20, left: 20, right: 20, bottom: 20,
                borderRadius: '50%',
                border: '1px solid rgba(255, 255, 255, 0.03)',
                borderLeftColor: 'var(--accent)',
                borderRightColor: 'var(--accent)'
              }}
            />
          </div>

          {/* Status Label */}
          <div style={{ marginTop: 40, height: 20, display: 'flex', alignItems: 'center' }}>
            <AnimatePresence mode="wait">
              {showProgress && (
                <motion.p
                  key={statusIndex}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.4 }}
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: '0.2em',
                    color: statusIndex === statuses.length - 1 ? 'var(--text-primary)' : 'var(--text-muted)',
                    margin: 0,
                    textAlign: 'center'
                  }}
                >
                  {statuses[statusIndex]}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom Bar Indicator */}
          <div style={{
            position: 'absolute',
            bottom: 60,
            width: 200,
            height: 2,
            backgroundColor: 'rgba(255,255,255,0.03)',
            borderRadius: 1,
            overflow: 'hidden'
          }}>
            <motion.div
              animate={{
                x: ['-100%', '100%']
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              style={{
                width: '60%',
                height: '100%',
                background: 'linear-gradient(90deg, transparent, var(--primary), transparent)'
              }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
