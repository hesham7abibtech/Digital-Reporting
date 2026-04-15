'use client';

import { useEffect, useRef } from 'react';

interface MiniChartProps {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
  className?: string;
}

export default function MiniChart({
  data,
  color = '#C5A059',
  width = 80,
  height = 32,
  className = '',
}: MiniChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (!data || data.length === 0) {
      ctx.clearRect(0, 0, width, height);
      return;
    }

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = (max - min) || 1;
    const padding = 2;

    const startTime = performance.now();
    const duration = 1000;
    let frameId: number;

    function draw(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const pointsToShow = Math.max(1, Math.floor(data.length * eased));

      ctx!.clearRect(0, 0, width, height);

      const gradient = ctx!.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, color + '30');
      gradient.addColorStop(1, color + '00');

      const stepX = (width - padding * 2) / (data.length - 1);

      // Fill area
      ctx!.beginPath();
      ctx!.moveTo(padding, height);
      for (let i = 0; i <= pointsToShow && i < data.length; i++) {
        const x = padding + i * stepX;
        const y = height - padding - ((data[i] - min) / range) * (height - padding * 2);
        ctx!.lineTo(x, y);
      }
      const lastVisibleX = padding + Math.min(pointsToShow, data.length - 1) * stepX;
      ctx!.lineTo(lastVisibleX, height);
      ctx!.closePath();
      ctx!.fillStyle = gradient;
      ctx!.fill();

      // Line
      ctx!.beginPath();
      for (let i = 0; i <= pointsToShow && i < data.length; i++) {
        const x = padding + i * stepX;
        const y = height - padding - ((data[i] - min) / range) * (height - padding * 2);
        if (i === 0) ctx!.moveTo(x, y);
        else ctx!.lineTo(x, y);
      }
      ctx!.strokeStyle = color;
      ctx!.lineWidth = 1.5;
      ctx!.lineJoin = 'round';
      ctx!.lineCap = 'round';
      ctx!.stroke();

      // End dot when complete
      if (pointsToShow >= data.length - 1) {
        const lastI = data.length - 1;
        const lx = padding + lastI * stepX;
        const ly = height - padding - ((data[lastI] - min) / range) * (height - padding * 2);
        ctx!.beginPath();
        ctx!.arc(lx, ly, 2.5, 0, Math.PI * 2);
        ctx!.fillStyle = color;
        ctx!.fill();
      }

      if (progress < 1) {
        frameId = requestAnimationFrame(draw);
      }
    }

    // Small delay for DOM readiness
    const timer = setTimeout(() => {
      frameId = requestAnimationFrame(draw);
    }, 200);

    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(frameId);
    };
  }, [data, color, width, height]);

  return (
    <div className={className}>
      <canvas
        ref={canvasRef}
        style={{ width, height, display: 'block' }}
      />
    </div>
  );
}
