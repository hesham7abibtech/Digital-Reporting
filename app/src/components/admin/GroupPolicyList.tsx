'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { GroupPolicy } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { Shield, MoreVertical, Plus, Info, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

interface GroupPolicyListProps {
  onEditPolicy: (policy: GroupPolicy) => void;
}

const TEAL = '#003f49';

export default function GroupPolicyList({ onEditPolicy }: GroupPolicyListProps) {
  const { user } = useAuth();
  const [policies, setPolicies] = useState<GroupPolicy[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPolicies = useCallback(async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/admin/policies', { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('load failed');
      const data = await res.json();
      setPolicies((data.policies || []).sort((a: GroupPolicy, b: GroupPolicy) => (a.name || '').localeCompare(b.name || '')));
    } catch {
      setPolicies([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Initial load + refresh whenever a policy is saved/deleted (realtime within session).
  useEffect(() => {
    fetchPolicies();
    const onChange = () => fetchPolicies();
    window.addEventListener('policies:changed', onChange);
    return () => window.removeEventListener('policies:changed', onChange);
  }, [fetchPolicies]);

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Syncing Group Policies…</div>;

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginBottom: 20 }}>
        <button onClick={fetchPolicies} title="Refresh"
          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 16px', borderRadius: 10, background: '#fff', color: TEAL, border: '1px solid #e2e8f0', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
          <RefreshCw size={15} /> Refresh
        </button>
        <button onClick={() => onEditPolicy({} as any)}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10, background: `linear-gradient(135deg, ${TEAL}, #015a68)`, color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 800, boxShadow: '0 6px 16px rgba(0,63,73,0.25)' }}>
          <Plus size={16} /> Forge New Policy
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {policies.map((policy) => {
          return (
            <motion.div key={policy.id} whileHover={{ y: -3 }} onClick={() => onEditPolicy(policy)}
              style={{ background: '#fff', border: '1px solid #e8edf2', borderRadius: 16, padding: 16, cursor: 'pointer',
                boxShadow: '0 4px 18px rgba(16,24,40,0.05)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 11, background: 'rgba(0,63,73,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: TEAL }}>
                    <Shield size={17} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: '#0f172a' }}>{policy.name}</h3>
                    <p style={{ fontSize: 10, color: policy.isTeammatePolicy ? '#b58a3c' : TEAL, margin: '2px 0 0 0', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {policy.isTeammatePolicy ? 'Team Mate Restricted' : 'Elevated Authority'}
                    </p>
                  </div>
                </div>
                <MoreVertical size={16} color="#94a3b8" />
              </div>
              <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 12px 0', lineHeight: 1.4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {policy.description || 'No strategic intent defined.'}
              </p>
              <div style={{ display: 'flex', flexWrap: 'nowrap', overflow: 'hidden', gap: 4, maskImage: 'linear-gradient(to right, black 82%, transparent)' }}>
                {Object.entries(policy.modules || {}).filter(([, a]: any) => a?.view).map(([module]) => (
                  <span key={module} style={{ fontSize: 9, padding: '4px 8px', borderRadius: 6, background: '#f1f5f9', color: '#475569', textTransform: 'uppercase', fontWeight: 800, whiteSpace: 'nowrap' }}>{module}</span>
                ))}
              </div>
            </motion.div>
          );
        })}

        {policies.length === 0 && (
          <div style={{ gridColumn: '1 / -1', padding: '60px', textAlign: 'center', background: '#f8fafc', borderRadius: 20, border: '1px dashed #cbd5e1' }}>
            <Info size={32} style={{ color: '#94a3b8', marginBottom: 16 }} />
            <p style={{ color: '#64748b', fontSize: 14 }}>No Group Policies established. Create a policy to begin delegating authority.</p>
          </div>
        )}
      </div>
    </div>
  );
}
