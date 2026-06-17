'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, CheckCircle2, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function VerifySuccessPage() {
  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Industrial Grid Background (Ultra-Subtle) */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#002d35 0.5px, transparent 0.5px)', backgroundSize: '80px 80px' }} />
      
      {/* Card Container (Dark Teal Authority) */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-[540px] w-full bg-[#002d35] rounded-[42px] p-12 shadow-[0_50px_100px_rgba(0,45,53,0.3)] text-center relative z-10 border border-[#d0ab82]/10"
      >
        {/* Institutional Authority Logos (Positioned for Clearance) */}
        <div className="flex items-center justify-center gap-8 mb-14 mt-4 opacity-90">
          <img src="/logos/modon_logo.png" alt="MODON" className="h-6 object-contain filter brightness-0 invert" />
          <div className="w-[1px] h-6 bg-white/10"></div>
          <img src="/logos/insite_logo.png" alt="Insite" className="h-6 object-contain filter brightness-0 invert" />
        </div>

        {/* Security Shield Anchor (Floating Badge Aesthetic) */}
        <motion.div 
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="w-20 h-20 bg-gradient-to-br from-[#d0ab82]/20 to-transparent rounded-[24px] flex items-center justify-center mx-auto mb-8 border border-[#d0ab82]/20 shadow-2xl backdrop-blur-sm"
        >
          <ShieldCheck className="w-10 h-10 text-[#d0ab82] drop-shadow-[0_0_10px_rgba(208,171,130,0.3)]" />
        </motion.div>

        <h1 className="text-[26px] font-black text-white mb-3 tracking-[-0.01em] uppercase italic leading-tight">Security Protocol</h1>
        <p className="text-white/50 text-[13px] font-bold mb-12 leading-relaxed max-w-[340px] mx-auto">
          Your security profile has been initialized. Please complete the following stages:
        </p>

        {/* Verification Matrix (Decompressed) */}
        <div className="space-y-4 mb-12 text-left">
          {/* Stage 01: Confirmed */}
          <div className="flex gap-5 p-6 rounded-[28px] bg-white/5 border border-white/10">
            <div className="w-10 h-10 rounded-full bg-[#d0ab82] flex items-center justify-center flex-shrink-0 shadow-[0_0_20px_rgba(208,171,130,0.25)]">
              <CheckCircle2 size={20} color="#002d35" />
            </div>
            <div className="flex flex-col justify-center">
              <h3 className="text-[#d0ab82] font-black text-[12px] uppercase tracking-[0.12em] mb-0.5 italic">01 Identity Verification</h3>
              <p className="text-[12px] text-white/40 leading-relaxed font-bold">
                Verification link dispatched to your registry. confirmed.
              </p>
            </div>
          </div>

          {/* Stage 02: Evaluation */}
          <div className="flex gap-5 p-6 rounded-[28px] bg-white/[0.01] border border-white/5">
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0 border border-white/10">
              <span className="text-[13px] font-black text-white/30">02</span>
            </div>
            <div className="flex flex-col justify-center">
              <h3 className="text-white/30 font-black text-[12px] uppercase tracking-[0.12em] mb-0.5 italic">02 Administrative Clearance</h3>
              <p className="text-[12px] text-white/20 leading-relaxed font-bold">
                Pending manual review by high-authority administrator.
              </p>
            </div>
          </div>
        </div>

        {/* Return to Portal Command */}
        <Link 
          href="/login"
          className="group w-full flex items-center justify-center gap-3 bg-[#d0ab82] hover:bg-[#c49e75] text-[#002d35] font-black py-6 rounded-[20px] transition-all shadow-[0_15px_40px_rgba(208,171,130,0.2)] hover:-translate-y-0.5 active:scale-95 text-[14px] uppercase tracking-[0.15em] italic"
        >
          Return to Access Portal
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </motion.div>

      {/* Institutional Branding Footer (High Clearance) */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="mt-12 text-center"
      >
        <p className="text-[#002d35]/20 text-[11px] font-black uppercase tracking-[0.5em] flex items-center justify-center gap-8">
          <span className="w-16 h-[1px] bg-[#002d35]/5"></span>
          REH Digital Reporting
          <span className="w-16 h-[1px] bg-[#002d35]/5"></span>
        </p>
      </motion.div>
    </div>
  );
}
