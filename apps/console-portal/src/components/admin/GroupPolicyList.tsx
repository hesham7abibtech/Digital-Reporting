'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { GroupPolicy } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { Shield, MoreVertical, Plus, Info, RefreshCw, AlertTriangle, LogIn } from 'lucide-react';
import { motion } from 'framer-motion';
import { t, TEAL, GOLD, MUTED, LINE, DANGER } from '@/lib/adminType';

interface GroupPolicyListProps {
  onEditPolicy: (policy: GroupPolicy) => void;
}

export default function GroupPolicyList({ onEditPolicy }: GroupPolicyListProps) {
  const { user, logout } = useAuth();
  const [policies, setPolicies] = useState<GroupPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  // Distinguish "genuinely no policies" from "couldn't load them" — the old code
  // swallowed every error into an empty list, so a dead session or 403 showed the
  // misleading "No Group Policies established" message.
  const [error, setError] = useState<{ message: string; needsAuth: boolean } | null>(null);

  const fetchPolicies = useCallback(async () => {
    if (!user) return;
    setError(null);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/admin/policies', { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) {
        const detail = await res.json().catch(() => ({}));
        if (res.status === 401) throw Object.assign(new Error('Your session has expired. Please sign in again to manage policies.'), { needsAuth: true });
        if (res.status === 403) throw new Error('You don’t have permission to view Group Policies (admin/owner access required).');
        throw new Error(detail.error || `Could not load policies (HTTP ${res.status}).`);
      }
      const data = await res.json();
      setPolicies((data.policies || []).sort((a: GroupPolicy, b: GroupPolicy) => (a.name || '').localeCompare(b.name || '')));
    } catch (e: any) {
      setError({ message: e.message || 'Could not load Group Policies.', needsAuth: !!e.needsAuth });
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

  if (loading) return <div style={{ padding: 40, textAlign: 'center', ...t.body }}>Syncing Group Policies…</div>;

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginBottom: 20 }}>
        <button onClick={fetchPolicies} title="Refresh"
          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 16px', borderRadius: 10, background: '#fff', color: TEAL, border: `1px solid ${LINE}`, cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
          <RefreshCw size={15} /> Refresh
        </button>
        <button onClick={() => onEditPolicy({} as any)}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10, background: `linear-gradient(135deg, ${TEAL}, #015a68)`, color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 800, boxShadow: '0 6px 16px rgba(0,63,73,0.25)' }}>
          <Plus size={16} /> Forge New Policy
        </button>
      </div>

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', marginBottom: 18, borderRadius: 14,
          background: 'rgba(220,38,38,0.05)', border: '1px solid rgba(220,38,38,0.25)' }}>
          <AlertTriangle size={20} color={DANGER} style={{ flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ ...t.bodyStrong, color: DANGER }}>Couldn’t load Group Policies</div>
            <div style={{ ...t.caption, marginTop: 2 }}>{error.message}</div>
          </div>
          {error.needsAuth ? (
            <button onClick={() => logout()}
              style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 10, background: DANGER, color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
              <LogIn size={15} /> Sign in again
            </button>
          ) : (
            <button onClick={fetchPolicies}
              style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 10, background: '#fff', color: DANGER, border: '1px solid rgba(220,38,38,0.3)', cursor: 'pointer', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
              <RefreshCw size={15} /> Retry
            </button>
          )}
        </div>
      )}

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
                    <h3 style={{ ...t.cardTitle, margin: 0 }}>{policy.name}</h3>
                    <p style={{ fontSize: 11, color: policy.isTeammatePolicy ? GOLD : TEAL, margin: '3px 0 0 0', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {policy.isTeammatePolicy ? 'Team Mate Restricted' : 'Elevated Authority'}
                    </p>
                  </div>
                </div>
                <MoreVertical size={16} color="#94a3b8" />
              </div>
              <p style={{ ...t.caption, margin: '0 0 12px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {policy.description || 'No strategic intent defined.'}
              </p>
              <div style={{ display: 'flex', flexWrap: 'nowrap', overflow: 'hidden', gap: 5, maskImage: 'linear-gradient(to right, black 82%, transparent)' }}>
                {Object.entries(policy.modules || {}).filter(([, a]: any) => a?.view).map(([module]) => (
                  <span key={module} style={{ fontSize: 10, padding: '4px 9px', borderRadius: 6, background: '#f1f5f9', color: '#475569', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.03em', whiteSpace: 'nowrap' }}>{module}</span>
                ))}
              </div>
            </motion.div>
          );
        })}

        {policies.length === 0 && !error && (
          <div style={{ gridColumn: '1 / -1', padding: '60px', textAlign: 'center', background: '#f8fafc', borderRadius: 20, border: '1px dashed #cbd5e1' }}>
            <Info size={32} style={{ color: '#94a3b8', marginBottom: 16 }} />
            <p style={{ ...t.body, color: MUTED }}>No Group Policies established. Create a policy to begin delegating authority.</p>
          </div>
        )}
      </div>
    </div>
  );
}
