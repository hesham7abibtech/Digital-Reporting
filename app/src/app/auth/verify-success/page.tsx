'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Clock, ArrowRight, Mail } from 'lucide-react';
import { motion } from 'framer-motion';

export default function VerifySuccessPage() {
  return (
    <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Industrial Grid Background */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#d0ab82 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-[#1E293B]/80 backdrop-blur-xl border border-[#d0ab82]/20 rounded-3xl p-8 text-center relative z-10 shadow-2xl"
      >
        {/* Success Icon */}
        <div className="flex justify-center mb-6">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 12 }}
            className="w-20 h-20 bg-[#003f49] rounded-2xl flex items-center justify-center border border-[#d0ab82]/30 shadow-[0_0_30px_rgba(208,171,130,0.2)]"
          >
            <ShieldCheck className="w-10 h-10 text-[#d0ab82]" />
          </motion.div>
        </div>

        <h1 className="text-3xl font-bold text-white mb-3 tracking-tight">Identity Verified</h1>
        <p className="text-[#94A3B8] mb-8 text-lg">
          Your email has been successfully validated.
        </p>

        {/* Status Card */}
        <div className="bg-[#0F172A]/50 border border-[#d0ab82]/10 rounded-2xl p-6 mb-8 text-left">
          <div className="flex items-start gap-4">
            <div className="mt-1 bg-[#d0ab82]/10 p-2 rounded-lg">
              <Clock className="w-5 h-5 text-[#d0ab82]" />
            </div>
            <div>
              <h3 className="text-white font-semibold mb-1">Administrative Approval Pending</h3>
              <p className="text-sm text-[#64748B] leading-relaxed">
                As part of our high-security industrial protocol, your account is now in the queue for manual review. You will receive an email once your access is granted.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <Link 
            href="/login"
            className="w-full flex items-center justify-center gap-2 bg-[#d0ab82] hover:bg-[#c09b72] text-[#0F172A] font-bold py-4 px-6 rounded-xl transition-all shadow-lg active:scale-95"
          >
            Return to Login
            <ArrowRight className="w-5 h-5" />
          </Link>
          
          <p className="text-xs text-[#475569] italic">
            Reference ID: REH-{Math.random().toString(36).substring(2, 8).toUpperCase()}
          </p>
        </div>
      </motion.div>

      {/* Footer Branding */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-12 text-center"
      >
        <p className="text-[#475569] text-sm font-bold uppercase tracking-widest flex items-center gap-2">
          <span className="w-8 h-[1px] bg-[#475569]"></span>
          REH Digital Reporting
          <span className="w-8 h-[1px] bg-[#475569]"></span>
        </p>
      </motion.div>
    </div>
  );
}
