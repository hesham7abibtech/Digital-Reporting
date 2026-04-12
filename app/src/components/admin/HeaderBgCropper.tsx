'use client';

import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Crop, Check, Image as ImageIcon, Loader2 } from 'lucide-react';

interface HeaderBgCropperProps {
  image: string;
  onCropComplete: (croppedImage: Blob) => void;
  onCancel: () => void;
}

export default function HeaderBgCropper({ image, onCropComplete, onCancel }: HeaderBgCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropChange = (crop: { x: number; y: number }) => {
    setCrop(crop);
  };

  const onZoomChange = (zoom: number) => {
    setZoom(zoom);
  };

  const onCropAreaComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.setAttribute('crossOrigin', 'anonymous');
      image.src = url;
    });

  const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: any
  ): Promise<Blob> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) throw new Error('Failed to get canvas context');

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
      }, 'image/jpeg', 0.9);
    });
  };

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;
    setIsProcessing(true);
    try {
      const croppedBlob = await getCroppedImg(image, croppedAreaPixels);
      onCropComplete(croppedBlob);
    } catch (e) {
      console.error('Cropping failure:', e);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.9)',
      backdropFilter: 'blur(20px)',
      zIndex: 10000,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 40
    }}>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        style={{
          width: '100%',
          maxWidth: 1000,
          background: 'rgba(15, 15, 20, 0.95)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 32,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          height: '80vh',
          boxShadow: '0 50px 100px rgba(0,0,0,0.8)'
        }}
      >
        <div style={{ padding: '24px 32px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(212, 175, 55, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
              <Crop size={18} color="#D4AF37" />
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 900, color: 'white', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Banner Optimization Protocol</h3>
              <p style={{ fontSize: 10, color: 'rgba(212, 175, 55, 0.6)', fontWeight: 800, margin: 0, letterSpacing: '0.1em' }}>PRECISION CROP // 12:1 ULTRA-PANORAMA</p>
            </div>
          </div>
          <button onClick={onCancel} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={18} /></button>
        </div>

        <div style={{ flex: 1, position: 'relative', background: '#050508' }}>
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={12 / 1}
            onCropChange={onCropChange}
            onCropComplete={onCropAreaComplete}
            onZoomChange={onZoomChange}
            classes={{
              containerClassName: 'crop-container',
              mediaClassName: 'crop-media',
              cropAreaClassName: 'crop-area'
            }}
          />
        </div>

        <div style={{ padding: '24px 32px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, flex: 1 }}>
            <span style={{ fontSize: 11, fontWeight: 900, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>Zoom Level</span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              style={{ flex: 1, maxWidth: 300, accentColor: '#D4AF37' }}
            />
          </div>

          <button
            onClick={handleConfirm}
            disabled={isProcessing}
            style={{
              padding: '12px 32px',
              background: '#D4AF37',
              color: '#0a0a0f',
              border: 'none',
              borderRadius: 12,
              fontWeight: 900,
              fontSize: 14,
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              boxShadow: '0 10px 20px rgba(212, 175, 55, 0.2)'
            }}
          >
            {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
            COMMIT CROP
          </button>
        </div>
      </motion.div>
      
      <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', gap: 12, color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
        <ImageIcon size={14} />
        <span>Optimizing for ultra-wide viewport. Select the focal area of your project.</span>
      </div>
    </div>
  );
}
