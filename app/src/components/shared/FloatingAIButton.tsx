'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  X,
  RotateCcw,
  Send,
  Bot,
  User,
  Loader2,
  AlertCircle,
  Sparkles,
  Menu,
  History,
  Trash2,
  ArrowLeft,
  Plus
} from 'lucide-react';
import type { AgentInputItem } from '@openai/agents-core';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

const suggestedPrompts = [
  "Search Deliverables Registry Report",
  "Search BIM Reviews Report"
];

export default function FloatingAIButton() {
  const { user, userProfile, loading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<AgentInputItem[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Firestore & Session States
  const [sessions, setSessions] = useState<any[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [showSessionsList, setShowSessionsList] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [showConfirmDeleteId, setShowConfirmDeleteId] = useState<string | null>(null);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [isDeletingSessionId, setIsDeletingSessionId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Guard: Avoid hydration mismatch by waiting for client-side mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  const loadSessions = async () => {
    if (!user) return;
    try {
      const q = query(
        collection(db, 'chat_sessions'),
        where('userId', '==', user.uid)
      );
      const querySnapshot = await getDocs(q);
      const loadedSessions = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[];
      
      // Sort on client side to avoid composite index requirement
      loadedSessions.sort((a, b) => {
        const aTime = a.updatedAt?.toMillis ? a.updatedAt.toMillis() : (a.updatedAt ? new Date(a.updatedAt).getTime() : 0);
        const bTime = b.updatedAt?.toMillis ? b.updatedAt.toMillis() : (b.updatedAt ? new Date(b.updatedAt).getTime() : 0);
        return bTime - aTime;
      });

      setSessions(loadedSessions);
      return loadedSessions;
    } catch (err) {
      console.error('[Load Sessions Error]:', err);
    }
  };

  // Load sessions and auto-select most recent on login/mount
  useEffect(() => {
    if (user) {
      loadSessions().then((loaded) => {
        if (loaded && loaded.length > 0) {
          setCurrentSessionId(loaded[0].id);
          setHistory(loaded[0].messages || []);
        } else {
          setCurrentSessionId(null);
          setHistory([]);
        }
      });
    } else {
      setSessions([]);
      setCurrentSessionId(null);
      setHistory([]);
    }
  }, [user]);

  // Auto-scroll to the bottom of the chat when new messages are added or when typing state changes
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [history, isTyping, isOpen]);

  if (!mounted || loading) return null;

  // Authorization check: Only show the button for active, approved, and verified users
  const isApproved = userProfile?.isApproved === true || userProfile?.isAdmin === true;
  const isVerified = userProfile?.isVerified === true;
  const isSuspended = userProfile?.status === 'SUSPENDED';

  if (!user || !userProfile || !isApproved || !isVerified || isSuspended) {
    return null;
  }

  // Extract text from user or assistant message items (handles both string and array representations)
  const getMessageText = (item: AgentInputItem): string => {
    const content = 'content' in item ? (item as any).content : undefined;
    if (typeof content === 'string') {
      return content;
    }
    if (Array.isArray(content)) {
      return content
        .map((chunk: any) => {
          if (typeof chunk === 'string') return chunk;
          if (chunk && typeof chunk === 'object') {
            if (chunk.type === 'output_text') return chunk.text;
            if (chunk.type === 'input_text') return chunk.text;
          }
          return '';
        })
        .join('');
    }
    return '';
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userText = input.trim();
    setInput('');
    setErrorMsg(null);
    setIsTyping(true);

    // 1. Create client-side user message
    const newUserMessage: AgentInputItem = {
      role: 'user',
      content: userText,
    };

    const updatedHistory = [...history, newUserMessage];
    setHistory(updatedHistory);

    try {
      // 2. Fetch authenticated Firebase ID token
      const token = await user.getIdToken();

      // 3. Post to AI endpoint
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ messages: updatedHistory }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response from AI Assistant');
      }

      // 4. Update conversation history
      if (data.updatedHistory) {
        setHistory(data.updatedHistory);

        // 5. Persist to Firestore
        try {
          if (!currentSessionId) {
            // Create a new session document
            const newSessionDoc = {
              userId: user.uid,
              title: userText.slice(0, 40) + (userText.length > 40 ? '...' : ''),
              messages: data.updatedHistory,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            };
            const docRef = await addDoc(collection(db, 'chat_sessions'), newSessionDoc);
            setCurrentSessionId(docRef.id);
            await loadSessions();
          } else {
            // Update existing session document
            const sessionRef = doc(db, 'chat_sessions', currentSessionId);
            await updateDoc(sessionRef, {
              messages: data.updatedHistory,
              updatedAt: serverTimestamp()
            });
            await loadSessions();
          }
        } catch (dbErr) {
          console.error('[Firestore Save Error]:', dbErr);
        }
      }
    } catch (err: any) {
      console.error('[AI Chat Error]:', err);
      setErrorMsg(err.message || 'An error occurred. Please try again.');
    } finally {
      setIsTyping(false);
    }
  };

  const handleSelectSession = (session: any) => {
    setCurrentSessionId(session.id);
    setHistory(session.messages || []);
    setShowSessionsList(false);
    setErrorMsg(null);
  };

  const handleDeleteSession = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    setShowConfirmDeleteId(sessionId);
  };

  const handleConfirmDelete = async () => {
    if (!showConfirmDeleteId) return;
    const sessionId = showConfirmDeleteId;
    setIsDeletingSessionId(sessionId);
    try {
      await deleteDoc(doc(db, 'chat_sessions', sessionId));
      if (sessionId === currentSessionId) {
        setCurrentSessionId(null);
        setHistory([]);
      }
      await loadSessions();
    } catch (err) {
      console.error('[Delete Session Error]:', err);
    } finally {
      setIsDeletingSessionId(null);
      setShowConfirmDeleteId(null);
    }
  };

  const handleStartNewChatConfirm = async () => {
    setShowConfirmReset(false);
    setIsCreatingSession(true);
    
    // Simulate setting up secure AI channel
    await new Promise((resolve) => setTimeout(resolve, 800));

    setCurrentSessionId(null);
    setHistory([]);
    setErrorMsg(null);
    setIsCreatingSession(false);
    setShowSessionsList(false);
  };

  // Only render user and assistant message items to the user (filters out system instructions and tool outputs)
  const visibleMessages = history.filter(
    (item) => {
      const role = 'role' in item ? (item as any).role : undefined;
      const content = 'content' in item ? (item as any).content : undefined;
      return (
        (role === 'user' || role === 'assistant') &&
        (typeof content === 'string' || Array.isArray(content))
      );
    }
  );

  return (
    <>
      {/* Floating Action Button - Capsule shape when closed, circular when open */}
      {!isOpen && (
        <motion.div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            borderRadius: '24px',
            padding: '2px', // gives border space for gradient
            background: 'linear-gradient(90deg, var(--teal-light), var(--gold), #10b981, var(--teal-light))',
            backgroundSize: '300% 100%',
            boxShadow: '0 8px 32px rgba(0, 63, 73, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
          animate={{
            backgroundPosition: ['0% 0%', '300% 0%'],
            boxShadow: [
              '0 8px 24px rgba(0, 242, 255, 0.35), 0 0 12px rgba(0, 242, 255, 0.25)',
              '0 8px 32px rgba(208, 171, 130, 0.55), 0 0 20px rgba(208, 171, 130, 0.35)',
              '0 8px 24px rgba(0, 242, 255, 0.35), 0 0 12px rgba(0, 242, 255, 0.25)'
            ]
          }}
          transition={{
            backgroundPosition: {
              duration: 6,
              repeat: Infinity,
              ease: 'linear'
            },
            boxShadow: {
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut'
            }
          }}
        >
          <motion.button
            onClick={() => {
              loadSessions();
              setCurrentSessionId(null);
              setHistory([]);
              setIsOpen(true);
            }}
            style={{
              position: 'relative',
              height: '46px',
              padding: '0 22px',
              borderRadius: '22px',
              background: 'linear-gradient(135deg, rgba(0, 31, 36, 0.95) 0%, rgba(0, 63, 73, 0.95) 100%)', // rich glassmorphic dark teal
              backdropFilter: 'blur(12px)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              overflow: 'hidden',
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            title="REH AI Assistant"
          >
            {/* Premium sheen sweep overlay */}
            <motion.div
              style={{
                position: 'absolute',
                top: 0,
                left: '-100%',
                width: '50%',
                height: '100%',
                background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)',
                transform: 'skewX(-25deg)',
                pointerEvents: 'none',
              }}
              animate={{
                left: ['-100%', '200%']
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                repeatDelay: 4,
                ease: 'easeInOut'
              }}
            />

            {/* Premium Icon Badge Wrapper */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px' }}>
              {/* Rotating outer dashed frame */}
              <motion.div
                style={{
                  position: 'absolute',
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  border: '1.5px dashed rgba(208, 171, 130, 0.75)',
                }}
                animate={{ rotate: 360 }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: 'linear'
                }}
              />
              {/* Pulsing inner glow circle */}
              <motion.div
                style={{
                  position: 'absolute',
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  background: 'rgba(0, 242, 255, 0.15)',
                }}
                animate={{ scale: [0.8, 1.2, 0.8] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
              />
              <Sparkles size={12} color="var(--gold)" style={{ position: 'relative', zIndex: 1, filter: 'drop-shadow(0 0 3px var(--gold))' }} />
            </div>

            <span
              style={{
                fontFamily: 'var(--font-primary), sans-serif',
                fontWeight: 700,
                fontSize: '12px',
                letterSpacing: '0.07em',
                background: 'linear-gradient(135deg, #ffffff 0%, #ffe0b2 40%, var(--gold) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                whiteSpace: 'nowrap',
                textTransform: 'uppercase',
                textShadow: '0 2px 4px rgba(0,0,0,0.15)',
              }}
            >
              REH AI Assistant
            </span>
          </motion.button>
        </motion.div>
      )}

      {isOpen && (
        <motion.div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            borderRadius: '50%',
            padding: '2px', // gives border space for gradient
            background: 'linear-gradient(90deg, var(--teal-light), var(--gold), #10b981, var(--teal-light))',
            backgroundSize: '300% 100%',
            boxShadow: '0 8px 32px rgba(0, 63, 73, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
          animate={{
            backgroundPosition: ['0% 0%', '300% 0%'],
            boxShadow: [
              '0 8px 24px rgba(0, 242, 255, 0.35), 0 0 12px rgba(0, 242, 255, 0.25)',
              '0 8px 32px rgba(208, 171, 130, 0.55), 0 0 20px rgba(208, 171, 130, 0.35)',
              '0 8px 24px rgba(0, 242, 255, 0.35), 0 0 12px rgba(0, 242, 255, 0.25)'
            ]
          }}
          transition={{
            backgroundPosition: {
              duration: 6,
              repeat: Infinity,
              ease: 'linear'
            },
            boxShadow: {
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut'
            }
          }}
        >
          <motion.button
            onClick={() => setIsOpen(false)}
            style={{
              position: 'relative',
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(0, 31, 36, 0.95) 0%, rgba(0, 63, 73, 0.95) 100%)',
              backdropFilter: 'blur(12px)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--cotton)',
              overflow: 'hidden',
            }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            title="Close Assistant"
          >
            {/* Premium sheen sweep overlay */}
            <motion.div
              style={{
                position: 'absolute',
                top: 0,
                left: '-100%',
                width: '50%',
                height: '100%',
                background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)',
                transform: 'skewX(-25deg)',
                pointerEvents: 'none',
              }}
              animate={{
                left: ['-100%', '200%']
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                repeatDelay: 4,
                ease: 'easeInOut'
              }}
            />
            <motion.div
              whileHover={{ rotate: 90 }}
              transition={{ duration: 0.2 }}
              style={{ display: 'flex', alignItems: 'center', zIndex: 1 }}
            >
              <X size={18} color="var(--gold)" style={{ filter: 'drop-shadow(0 0 2px var(--gold))' }} />
            </motion.div>
          </motion.button>
        </motion.div>
      )}

      {/* Chat Drawer / Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            style={{
              position: 'fixed',
              bottom: '96px',
              right: '24px',
              width: '380px',
              maxWidth: 'calc(100vw - 48px)',
              height: '580px',
              maxHeight: 'calc(100vh - 120px)',
              zIndex: 9998,
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 'var(--radius-lg)',
              background: 'rgba(249, 248, 242, 0.96)', // Cotton main background with slight opacity
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid var(--border)',
              boxShadow: '0 20px 50px rgba(0, 63, 73, 0.15)',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                background: 'var(--teal)',
                color: 'var(--cotton)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => setShowSessionsList(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'rgba(249, 248, 242, 0.7)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '4px',
                    borderRadius: '4px',
                    marginRight: '4px',
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--gold)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(249, 248, 242, 0.7)')}
                  title="View History"
                >
                  <Menu size={18} />
                </button>
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#10b981', // Emerald green online indicator
                    boxShadow: '0 0 8px #10b981',
                  }}
                />
                <h3
                  style={{
                    fontFamily: 'var(--font-primary)',
                    fontSize: '13px',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    margin: 0,
                    textTransform: 'uppercase',
                  }}
                >
                  REH Assistant
                </h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {history.length > 0 && (
                  <button
                    onClick={() => setShowConfirmReset(true)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'rgba(249, 248, 242, 0.7)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      padding: '4px',
                      borderRadius: '4px',
                      transition: 'color 0.2s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--gold)')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(249, 248, 242, 0.7)')}
                    title="Start New Chat"
                  >
                    <RotateCcw size={16} />
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'rgba(249, 248, 242, 0.7)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '4px',
                    borderRadius: '4px',
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--cotton)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(249, 248, 242, 0.7)')}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Chat Messages */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              {visibleMessages.length === 0 ? (
                <div
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    color: 'var(--text-secondary)',
                    padding: '0 20px',
                  }}
                >
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: 'rgba(0, 63, 73, 0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '16px',
                      color: 'var(--teal)',
                    }}
                  >
                    <Bot size={24} />
                  </div>
                  <h4
                    style={{
                      fontFamily: 'var(--font-primary)',
                      fontSize: '15px',
                      fontWeight: 700,
                      color: 'var(--gold)',
                      marginBottom: '8px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      textShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                    }}
                  >
                    Welcome, {userProfile?.name || 'Operative'}
                  </h4>
                  <p style={{ fontSize: '12px', lineHeight: '1.5', marginBottom: '8px' }}>
                    I am the REH Digital Grounded Assistant. Ask me anything about reports, directories, platform guidelines, or system functionalities.
                  </p>
                  
                  {/* Last 3 Chats History Section */}
                  {sessions.length > 0 && (
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        width: '100%',
                        marginTop: '16px',
                        textAlign: 'left',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          letterSpacing: '0.08em',
                          color: 'var(--gold)',
                          textTransform: 'uppercase',
                          marginBottom: '4px',
                          borderBottom: '1px solid rgba(208, 171, 130, 0.25)',
                          paddingBottom: '4px',
                        }}
                      >
                        Recent Conversations
                      </div>
                      {sessions.slice(0, 3).map((sess) => {
                        const formattedDate = sess.updatedAt
                          ? new Date(sess.updatedAt.toMillis ? sess.updatedAt.toMillis() : sess.updatedAt).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'Recent';

                        return (
                          <motion.div
                            key={sess.id}
                            onClick={() => {
                              setCurrentSessionId(sess.id);
                              setHistory(sess.messages || []);
                            }}
                            whileHover={{ scale: 1.02, borderColor: 'rgba(0, 242, 255, 0.45)', backgroundColor: 'rgba(0, 63, 73, 0.12)' }}
                            whileTap={{ scale: 0.98 }}
                            style={{
                              padding: '10px 12px',
                              borderRadius: 'var(--radius-md)',
                              background: 'linear-gradient(135deg, rgba(0, 31, 36, 0.03) 0%, rgba(0, 63, 73, 0.05) 100%)',
                              border: '1px solid rgba(208, 171, 130, 0.25)',
                              cursor: 'pointer',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              transition: 'all 0.2s',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                              <div
                                style={{
                                  width: '24px',
                                  height: '24px',
                                  borderRadius: '50%',
                                  background: 'rgba(208, 171, 130, 0.1)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: 'var(--gold)',
                                  flexShrink: 0,
                                }}
                              >
                                <MessageSquare size={12} />
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
                                <span
                                  style={{
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    color: 'var(--teal)',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                  }}
                                >
                                  {sess.title || 'Untitled Session'}
                                </span>
                                <span style={{ fontSize: '9px', color: 'var(--text-secondary)' }}>{formattedDate}</span>
                              </div>
                            </div>
                            <button
                              onClick={(e) => handleDeleteSession(e, sess.id)}
                              disabled={isDeletingSessionId === sess.id}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--text-secondary)',
                                cursor: 'pointer',
                                padding: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                transition: 'color 0.2s',
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
                            >
                              {isDeletingSessionId === sess.id ? (
                                <Loader2 size={12} className="animate-spin" />
                              ) : (
                                <Trash2 size={12} />
                              )}
                            </button>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}

                  {/* Suggested Prompts Section */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      width: '100%',
                      marginTop: '16px',
                      textAlign: 'left',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        color: 'var(--gold)',
                        textTransform: 'uppercase',
                        marginBottom: '4px',
                        borderBottom: '1px solid rgba(208, 171, 130, 0.25)',
                        paddingBottom: '4px',
                      }}
                    >
                      Suggested Topics
                    </div>
                    {suggestedPrompts.map((promptText, idx) => (
                      <button
                        key={idx}
                        onClick={() => setInput(promptText)}
                        style={{
                          background: 'rgba(0, 63, 73, 0.03)',
                          border: '1px solid var(--border)',
                          borderRadius: 'var(--radius-md)',
                          padding: '10px 14px',
                          color: 'var(--teal)',
                          fontSize: '12px',
                          textAlign: 'left',
                          cursor: 'pointer',
                          fontFamily: 'var(--font-sans)',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(208, 171, 130, 0.08)';
                          e.currentTarget.style.borderColor = 'rgba(208, 171, 130, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(0, 63, 73, 0.03)';
                          e.currentTarget.style.borderColor = 'var(--border)';
                        }}
                      >
                        {promptText}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                visibleMessages.map((msg, index) => {
                  const isAssistant = 'role' in msg ? (msg as any).role === 'assistant' : false;
                  const text = getMessageText(msg);

                  return (
                    <div
                      key={index}
                      style={{
                        display: 'flex',
                        gap: '10px',
                        alignSelf: isAssistant ? 'flex-start' : 'flex-end',
                        flexDirection: isAssistant ? 'row' : 'row-reverse',
                        maxWidth: '85%',
                      }}
                    >
                      {/* Avatar */}
                      <div
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          background: isAssistant ? 'var(--teal)' : 'var(--gold)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--cotton)',
                          flexShrink: 0,
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                        }}
                      >
                        {isAssistant ? <Bot size={14} color="#f9f8f2" /> : <User size={14} color="#f9f8f2" />}
                      </div>

                      {/* Content Bubble */}
                      <div
                        style={{
                          background: isAssistant ? '#ffffff' : 'rgba(208, 171, 130, 0.12)',
                          color: 'var(--text-primary)',
                          padding: '10px 14px',
                          borderRadius: 'var(--radius-md)',
                          border: isAssistant ? '1px solid var(--border)' : '1px solid rgba(208, 171, 130, 0.25)',
                          fontSize: '13px',
                          lineHeight: '1.5',
                          boxShadow: isAssistant ? 'var(--shadow-sm)' : 'none',
                          whiteSpace: 'pre-line',
                        }}
                      >
                        {text}
                      </div>
                    </div>
                  );
                })
              )}

              {/* Thinking Indicator */}
              {isTyping && (
                <div
                  style={{
                    display: 'flex',
                    gap: '10px',
                    alignSelf: 'flex-start',
                    maxWidth: '85%',
                  }}
                >
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: 'var(--teal)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--cotton)',
                      flexShrink: 0,
                    }}
                  >
                    <Bot size={14} color="#f9f8f2" />
                  </div>
                  <div
                    style={{
                      background: '#ffffff',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border)',
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      color: 'var(--text-secondary)',
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  >
                    <Loader2 size={14} className="animate-spin" color="var(--teal)" />
                    <span>Analyzing documents...</span>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {errorMsg && (
                <div
                  style={{
                    display: 'flex',
                    gap: '8px',
                    background: 'rgba(239, 68, 68, 0.08)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    borderRadius: 'var(--radius-md)',
                    padding: '10px 14px',
                    color: '#dc2626',
                    fontSize: '12px',
                    alignItems: 'flex-start',
                  }}
                >
                  <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
                  <div>
                    <span style={{ fontWeight: 600 }}>Request Failed:</span> {errorMsg}
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Form Footer */}
            <form
              onSubmit={handleSend}
              style={{
                padding: '16px 20px',
                borderTop: '1px solid var(--border)',
                background: '#ffffff',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask the assistant..."
                  disabled={isTyping}
                  style={{
                    flex: 1,
                    background: 'var(--background)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '10px 14px',
                    fontSize: '13px',
                    outline: 'none',
                    color: 'var(--text-primary)',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--teal)')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
                />
                <button
                  type="submit"
                  disabled={isTyping || !input.trim()}
                  style={{
                    background: 'var(--teal)',
                    color: 'var(--cotton)',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    width: '38px',
                    height: '38px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s, opacity 0.2s',
                    opacity: !input.trim() || isTyping ? 0.6 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (input.trim() && !isTyping) {
                      e.currentTarget.style.backgroundColor = 'var(--primary-light)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (input.trim() && !isTyping) {
                      e.currentTarget.style.backgroundColor = 'var(--teal)';
                    }
                  }}
                >
                  <Send size={16} color="#f9f8f2" />
                </button>
              </div>
              <div
                style={{
                  fontSize: '9px',
                  color: 'var(--text-muted)',
                  textAlign: 'center',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  fontWeight: 500,
                  marginTop: '2px',
                }}
              >
                REH Grounded Search System Active
              </div>
            </form>

            {/* History Panel (Slides in from the left) */}
            <AnimatePresence>
              {showSessionsList && (
                <motion.div
                  initial={{ x: '-100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '-100%' }}
                  transition={{ type: 'tween', duration: 0.25 }}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'rgba(0, 63, 73, 0.98)', // Dark teal solid/almost-solid background
                    backdropFilter: 'blur(16px)',
                    color: 'var(--cotton)',
                    zIndex: 100,
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  {/* History Header */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '16px 20px',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <History size={16} color="var(--gold)" />
                      <span
                        style={{
                          fontFamily: 'var(--font-primary)',
                          fontSize: '13px',
                          fontWeight: 700,
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                        }}
                      >
                        Saved Conversations
                      </span>
                    </div>
                    <button
                      onClick={() => setShowSessionsList(false)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'rgba(255, 255, 255, 0.7)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        padding: '4px',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--gold)')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)')}
                    >
                      <ArrowLeft size={18} />
                    </button>
                  </div>

                  {/* New Session Button */}
                  <div style={{ padding: '16px 20px' }}>
                    <button
                      onClick={() => {
                        if (history.length > 0) {
                          setShowConfirmReset(true);
                        } else {
                          setShowSessionsList(false);
                        }
                      }}
                      style={{
                        width: '100%',
                        padding: '10px',
                        background: 'transparent',
                        border: '1px solid var(--gold)',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--gold)',
                        fontFamily: 'var(--font-sans)',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(208, 171, 130, 0.1)';
                        e.currentTarget.style.boxShadow = '0 0 10px rgba(208, 171, 130, 0.2)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <Plus size={16} />
                      Start New Chat
                    </button>
                  </div>

                  {/* Sessions List */}
                  <div
                    style={{
                      flex: 1,
                      overflowY: 'auto',
                      padding: '0 20px 20px 20px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                    }}
                  >
                    {sessions.length === 0 ? (
                      <div
                        style={{
                          textAlign: 'center',
                          color: 'rgba(255, 255, 255, 0.5)',
                          fontSize: '12px',
                          marginTop: '40px',
                        }}
                      >
                        No saved sessions found.
                      </div>
                    ) : (
                      sessions.map((sess) => {
                        const isActive = sess.id === currentSessionId;
                        const formattedDate = sess.updatedAt
                          ? new Date(sess.updatedAt.toMillis ? sess.updatedAt.toMillis() : sess.updatedAt).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'Recent';

                        return (
                          <div
                            key={sess.id}
                            onClick={() => handleSelectSession(sess)}
                            style={{
                              padding: '12px',
                              borderRadius: 'var(--radius-md)',
                              background: isActive ? 'rgba(208, 171, 130, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                              border: isActive ? '1px solid var(--gold)' : '1px solid rgba(255, 255, 255, 0.05)',
                              cursor: 'pointer',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              transition: 'all 0.2s',
                            }}
                            onMouseEnter={(e) => {
                              if (!isActive) {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isActive) {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)';
                              }
                            }}
                          >
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0, flex: 1, paddingRight: '8px' }}>
                              <span
                                style={{
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  color: isActive ? 'var(--gold)' : 'var(--cotton)',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                }}
                              >
                                {sess.title || 'Untitled Session'}
                              </span>
                              <span style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.4)' }}>{formattedDate}</span>
                            </div>
                            <button
                              onClick={(e) => handleDeleteSession(e, sess.id)}
                              disabled={isDeletingSessionId === sess.id}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: 'rgba(255, 255, 255, 0.4)',
                                cursor: 'pointer',
                                padding: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                transition: 'color 0.2s',
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                              onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255, 255, 255, 0.4)')}
                            >
                              {isDeletingSessionId === sess.id ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <Trash2 size={14} />
                              )}
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Fancy New Session Modal (Renders inside the chat drawer) */}
            <AnimatePresence>
              {showConfirmReset && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'rgba(0, 63, 73, 0.75)', // Dark teal semi-transparent overlay
                    backdropFilter: 'blur(4px)',
                    zIndex: 200,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px',
                  }}
                >
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    style={{
                      background: 'rgba(249, 248, 242, 0.98)', // Cotton background
                      borderRadius: 'var(--radius-lg)',
                      border: '1px solid var(--gold)',
                      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
                      padding: '24px',
                      width: '100%',
                      maxWidth: '300px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      textAlign: 'center',
                    }}
                  >
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: 'rgba(208, 171, 130, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '16px',
                        color: 'var(--gold)',
                      }}
                    >
                      <RotateCcw size={20} />
                    </div>
                    <h4
                      style={{
                        fontFamily: 'var(--font-primary)',
                        fontSize: '16px',
                        fontWeight: 700,
                        color: 'var(--teal)',
                        margin: '0 0 8px 0',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}
                    >
                      Start New Chat?
                    </h4>
                    <p
                      style={{
                        fontSize: '12px',
                        color: 'var(--text-secondary)',
                        lineHeight: '1.5',
                        margin: '0 0 20px 0',
                      }}
                    >
                      Are you sure you want to clear this conversation? Your current session will be saved in your chat history.
                    </p>
                    <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                      <button
                        onClick={() => setShowConfirmReset(false)}
                        style={{
                          flex: 1,
                          padding: '10px',
                          background: 'rgba(0, 63, 73, 0.05)',
                          border: '1px solid var(--border)',
                          borderRadius: 'var(--radius-md)',
                          color: 'var(--teal)',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          fontFamily: 'var(--font-sans)',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0, 63, 73, 0.1)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(0, 63, 73, 0.05)')}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleStartNewChatConfirm}
                        style={{
                          flex: 1,
                          padding: '10px',
                          background: 'var(--teal)',
                          border: 'none',
                          borderRadius: 'var(--radius-md)',
                          color: 'var(--cotton)',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          fontFamily: 'var(--font-sans)',
                          transition: 'all 0.2s',
                          boxShadow: '0 4px 12px rgba(0, 63, 73, 0.2)',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--primary-light)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--teal)')}
                      >
                        Confirm
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Delete Session Confirmation Modal */}
            <AnimatePresence>
              {showConfirmDeleteId && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'rgba(0, 63, 73, 0.75)', // Dark teal semi-transparent overlay
                    backdropFilter: 'blur(4px)',
                    zIndex: 200,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px',
                  }}
                >
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    style={{
                      background: 'rgba(249, 248, 242, 0.98)', // Cotton background
                      borderRadius: 'var(--radius-lg)',
                      border: '1px solid #ef4444', // red warning border
                      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
                      padding: '24px',
                      width: '100%',
                      maxWidth: '300px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      textAlign: 'center',
                      position: 'relative',
                    }}
                  >
                    {isDeletingSessionId ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 0' }}>
                        <Loader2 size={36} className="animate-spin" color="#ef4444" style={{ marginBottom: '16px' }} />
                        <span
                          style={{
                            fontFamily: 'var(--font-primary)',
                            fontSize: '13px',
                            fontWeight: 700,
                            color: 'var(--teal)',
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                          }}
                        >
                          Deleting Session...
                        </span>
                      </div>
                    ) : (
                      <>
                        <div
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: 'rgba(239, 68, 68, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '16px',
                            color: '#ef4444',
                          }}
                        >
                          <Trash2 size={20} />
                        </div>
                        <h4
                          style={{
                            fontFamily: 'var(--font-primary)',
                            fontSize: '15px',
                            fontWeight: 700,
                            color: 'var(--teal)',
                            margin: '0 0 8px 0',
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                          }}
                        >
                          Delete Session?
                        </h4>
                        <p
                          style={{
                            fontSize: '12px',
                            color: 'var(--text-secondary)',
                            lineHeight: '1.5',
                            margin: '0 0 20px 0',
                          }}
                        >
                          Are you sure you want to permanently delete this chat session? This action cannot be undone.
                        </p>
                        <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                          <button
                            onClick={() => setShowConfirmDeleteId(null)}
                            style={{
                              flex: 1,
                              padding: '10px',
                              background: 'rgba(0, 63, 73, 0.05)',
                              border: '1px solid var(--border)',
                              borderRadius: 'var(--radius-md)',
                              color: 'var(--teal)',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              fontFamily: 'var(--font-sans)',
                              transition: 'all 0.2s',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0, 63, 73, 0.1)')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(0, 63, 73, 0.05)')}
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleConfirmDelete}
                            style={{
                              flex: 1,
                              padding: '10px',
                              background: '#ef4444',
                              border: 'none',
                              borderRadius: 'var(--radius-md)',
                              color: 'var(--cotton)',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              fontFamily: 'var(--font-sans)',
                              transition: 'all 0.2s',
                              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = '#dc2626')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = '#ef4444')}
                          >
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Initialize Channel Loading Spinner Overlay */}
            <AnimatePresence>
              {isCreatingSession && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'rgba(249, 248, 242, 0.98)', // Cotton background
                    zIndex: 250,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '16px',
                  }}
                >
                  <Loader2 size={36} className="animate-spin" color="var(--gold)" />
                  <span
                    style={{
                      fontFamily: 'var(--font-primary)',
                      fontSize: '13px',
                      fontWeight: 700,
                      color: 'var(--teal)',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                    }}
                  >
                    Initializing AI Channel...
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
