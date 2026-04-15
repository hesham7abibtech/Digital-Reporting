'use client';

import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
}

export default function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const particleCount = 120; // High density nodes
    const connectionDistance = 280; // Large reach
    let particles: Particle[] = [];

    interface ActiveLine {
      p1: number;
      p2: number;
      progress: number;
      speed: number;
      life: number;
      color: string;
    }
    let activeLines: ActiveLine[] = [];

    function resize() {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    function initParticles() {
      particles = [];
      activeLines = [];
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * canvas!.width,
          y: Math.random() * canvas!.height,
          vx: (Math.random() - 0.5) * 0.12,
          vy: (Math.random() - 0.5) * 0.12,
          size: Math.random() * 1.8 + 0.5,
          opacity: Math.random() * 0.4 + 0.2, // Higher visibility
        });
      }
    }

    function animate() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);

      // Update Particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas!.width;
        if (p.x > canvas!.width) p.x = 0;
        if (p.y < 0) p.y = canvas!.height;
        if (p.y > canvas!.height) p.y = 0;

        // Draw node points (Black)
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(0, 0, 0, ${p.opacity * 0.4})`;
        ctx!.fill();

        // High-density spawning
        if (Math.random() > 0.96 && activeLines.length < 60) {
          const targetIdx = Math.floor(Math.random() * particles.length);
          if (targetIdx !== i) {
            const dx = p.x - particles[targetIdx].x;
            const dy = p.y - particles[targetIdx].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < connectionDistance) {
              activeLines.push({
                p1: i,
                p2: targetIdx,
                progress: 0,
                speed: 0.005 + Math.random() * 0.015,
                life: 1,
                color: '0, 0, 0' // Forced Pure Black
              });
            }
          }
        }
      }

      // Update and Draw "Black Ink" Drafting Lines
      activeLines = activeLines.filter(line => line.life > 0);
      for (const line of activeLines) {
        const p1 = particles[line.p1];
        const p2 = particles[line.p2];
        if (!p1 || !p2) continue;

        line.progress = Math.min(1, line.progress + line.speed);
        if (line.progress >= 1) {
          line.life -= 0.004; // Slower fade for better persistence
        }

        const currentX = p1.x + (p2.x - p1.x) * line.progress;
        const currentY = p1.y + (p2.y - p1.y) * line.progress;

        ctx!.beginPath();
        ctx!.moveTo(p1.x, p1.y);
        ctx!.lineTo(currentX, currentY);
        ctx!.strokeStyle = `rgba(0, 0, 0, ${line.life * 0.25})`; // Stronger line opacity
        ctx!.lineWidth = 0.6;
        ctx!.stroke();

        // Junction glow during drawing
        if (line.progress < 1) {
          ctx!.beginPath();
          ctx!.arc(currentX, currentY, 1.2, 0, Math.PI * 2);
          ctx!.fillStyle = `rgba(0, 0, 0, ${line.life * 0.5})`;
          ctx!.fill();
        }
      }

      animationRef.current = requestAnimationFrame(animate);
    }

    resize();
    initParticles();
    animate();

    window.addEventListener('resize', () => {
      resize();
      initParticles();
    });

    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none"
        style={{ zIndex: 0 }}
      />
    </>
  );
}
