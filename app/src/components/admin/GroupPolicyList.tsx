'use client';

import React from 'react';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { GroupPolicy } from '@/lib/types';
import { Shield, MoreVertical, Plus, Info } from 'lucide-react';
import { motion } from 'framer-motion';

interface GroupPolicyListProps {
  onEditPolicy: (policy: GroupPolicy) => void;
}

export default function GroupPolicyList({ onEditPolicy }: GroupPolicyListProps) {
  const [snapshot, loading, error] = useCollection(
    query(collection(db, 'policies'), orderBy('name', 'asc'))
  );

  const policies = snapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() })) as GroupPolicy[];

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>Syncing Group Policies...</div>;

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
        <button 
          onClick={() => onEditPolicy({} as any)}
          style={{ 
            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', 
            borderRadius: 10, background: 'rgba(212, 175, 55, 0.1)', color: '#D4AF37', 
            border: '1px solid rgba(212, 175, 55, 0.2)', cursor: 'pointer', fontSize: 13, fontWeight: 700 
          }}
        >
          <Plus size={16} />
          Forge New Policy
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {policies?.map((policy) => (
          <motion.div
            key={policy.id}
            whileHover={{ y: -2 }}
            onClick={() => onEditPolicy(policy)}
            style={{ 
              background: 'linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
              border: '1px solid rgba(212, 175, 55, 0.1)', 
              borderRadius: 14, padding: 16, cursor: 'pointer', transition: 'all 200ms',
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
              position: 'relative', overflow: 'hidden'
            }}
          >
            {policy.isTeammatePolicy && (
               <div style={{ position: 'absolute', top: 0, right: 0, width: 40, height: 40, background: 'linear-gradient(225deg, rgba(212, 175, 55, 0.2) 0%, transparent 50%)' }} />
            )}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(212, 175, 55, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D4AF37', boxShadow: 'inset 0 0 0 1px rgba(212, 175, 55, 0.2)' }}>
                  <Shield size={16} />
                </div>
                <div>
                   <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: 'white', letterSpacing: '0.02em' }}>{policy.name}</h3>
                   <p style={{ fontSize: 10, color: 'rgba(212, 175, 55, 0.7)', margin: '2px 0 0 0', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                     {policy.isTeammatePolicy ? 'TEAM MATE RESTRICTED' : 'ELEVATED AUTHORITY'}
                   </p>
                </div>
              </div>
              <button style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.2)' }}>
                <MoreVertical size={16} />
              </button>
            </div>
            
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: '0 0 12px 0', lineHeight: 1.4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{policy.description || 'No strategic intent defined.'}</p>
            
            <div style={{ display: 'flex', flexWrap: 'nowrap', overflow: 'hidden', gap: 4, maskImage: 'linear-gradient(to right, black 80%, transparent)' }}>
              {Object.entries(policy.modules || {})
                .filter(([_, actions]) => actions.view)
                .map(([module]) => (
                  <span key={module} style={{ fontSize: 9, padding: '4px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.02em', whiteSpace: 'nowrap' }}>
                    {module}
                  </span>
                ))}
            </div>
          </motion.div>
        ))}

        {(!policies || policies.length === 0) && (
          <div style={{ gridColumn: '1 / -1', padding: '60px', textAlign: 'center', background: 'rgba(255,255,255,0.01)', borderRadius: 20, border: '1px dashed rgba(255,255,255,0.05)' }}>
            <Info size={32} style={{ color: 'rgba(255,255,255,0.1)', marginBottom: 16 }} />
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>No Group Policies established. Please create a policy to begin delegating authority.</p>
          </div>
        )}
      </div>
    </div>
  );
}
