'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Clock, ArrowRight, Shield, Zap, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

export default function VerifySuccessPage() {
  return (
    <div className="min-h-screen bg-[#002d35] flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Industrial Grid & Ambient Glow */}
      <div className="absolute inset-0 opacity-20 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#d0ab82 0.5px, transparent 0.5px)', backgroundSize: '40px 40px' }} />
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#d0ab82]/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#003f49]/30 blur-[120px] rounded-full pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-md w-full bg-[#003f49]/40 backdrop-blur-3xl border border-[#d0ab82]/20 rounded-[32px] p-10 text-center relative z-10 shadow-[0_20px_50px_rgba(0,0,0,0.3)]"
      >
        {/* Verification Aura */}
        <div className="flex justify-center mb-8 relative">
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute inset-0 bg-[#d0ab82]/20 blur-2xl rounded-full"
          />
          <motion.div 
            initial={{ rotate: -180, scale: 0 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ type: 'spring', damping: 15, stiffness: 100, delay: 0.2 }}
            className="w-24 h-24 bg-gradient-to-br from-[#003f49] to-[#002d35] rounded-[24px] flex items-center justify-center border border-[#d0ab82]/40 shadow-[0_0_40px_rgba(208,171,130,0.3)] relative z-10"
          >
            <ShieldCheck className="w-12 h-12 text-[#d0ab82]" />
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h1 className="text-3xl font-black text-white mb-3 tracking-tight uppercase italic">Identity Verified</h1>
          <div className="h-1 w-12 bg-[#d0ab82] mx-auto mb-6 rounded-full" />
          <p className="text-[#94A3B8] mb-8 text-lg font-medium leading-relaxed">
            Your cryptographic signature has been validated against the REH secure registry.
          </p>
        </motion.div>

        {/* Status Protocol Card */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-[#002d35]/60 border-l-4 border-[#d0ab82] rounded-2xl p-6 mb-8 text-left backdrop-blur-md"
        >
          <div className="flex items-start gap-4">
            <div className="mt-1 bg-[#d0ab82]/10 p-2.5 rounded-xl border border-[#d0ab82]/20">
              <Clock className="w-5 h-5 text-[#d0ab82]" />
            </div>
            <div>
              <h3 className="text-[#d0ab82] font-black text-xs uppercase tracking-widest mb-1">Security Protocol: Pending</h3>
              <p className="text-sm text-[#94A3B8] leading-relaxed font-medium">
                Your account is now in the <span className="text-white font-bold">Manual Review Queue</span>. Our administrators will authorize your access clearance shortly.
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="space-y-4"
        >
          <Link 
            href="/login"
            className="group w-full flex items-center justify-center gap-3 bg-[#d0ab82] hover:bg-[#e2bc93] text-[#002d35] font-black py-4 px-8 rounded-2xl transition-all shadow-[0_10px_30px_rgba(208,171,130,0.2)] hover:shadow-[0_15px_40px_rgba(208,171,130,0.35)] hover:-translate-y-1 active:scale-95 text-sm uppercase tracking-tighter"
          >
            Enter Command Center
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </Link>
          
          <div className="flex items-center justify-center gap-6 pt-4">
            <div className="flex items-center gap-2 text-[10px] text-[#475569] font-bold uppercase tracking-widest">
              <Lock size={12} /> Secure
            </div>
            <div className="flex items-center gap-2 text-[10px] text-[#475569] font-bold uppercase tracking-widest">
              <Shield size={12} /> Encrypted
            </div>
            <div className="flex items-center gap-2 text-[10px] text-[#475569] font-bold uppercase tracking-widest">
              <Zap size={12} /> Instant
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Footer Branding */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="mt-12 text-center"
      >
        <p className="text-[#475569] text-[11px] font-black uppercase tracking-[0.4em] flex items-center gap-4">
          <span className="w-12 h-[1px] bg-[#d0ab82]/30"></span>
          REH Digital Reporting
          <span className="w-12 h-[1px] bg-[#d0ab82]/30"></span>
        </p>
      </motion.div>
    </div>
  );
}
