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
            whileHover={{ y: -4 }}
            onClick={() => onEditPolicy(policy)}
            style={{ 
              background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', 
              borderRadius: 16, padding: 24, cursor: 'pointer', transition: 'all 200ms' 
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(212, 175, 55, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D4AF37' }}>
                <Shield size={20} />
              </div>
              <button style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.2)' }}>
                <MoreVertical size={16} />
              </button>
            </div>
            
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 8px 0', color: 'white' }}>{policy.name}</h3>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: '0 0 20px 0', lineHeight: 1.5, height: 40, overflow: 'hidden' }}>{policy.description}</p>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {Object.entries(policy.modules || {})
                .filter(([_, actions]) => actions.view)
                .map(([module]) => (
                  <span key={module} style={{ fontSize: 10, padding: '4px 8px', borderRadius: 4, background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', fontWeight: 800 }}>
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
