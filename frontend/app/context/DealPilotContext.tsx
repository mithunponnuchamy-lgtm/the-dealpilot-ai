'use client';
import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Deal, Offer, Terms, Suggestion, NotificationItem, NotificationType } from '../types';
import { playNotificationSound } from '../utils/sound';

export type { Deal, Offer, Terms, Suggestion, NotificationItem, NotificationType };

export function resolveApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('dealpilot-api-url');
    if (saved && saved.trim()) return saved.trim().replace(/\/+$/, '');

    // In a browser on cloud hosting (e.g. Render, Vercel), if NEXT_PUBLIC_API_URL isn't an external HTTPS URL:
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      const envUrl = process.env.NEXT_PUBLIC_API_URL;
      if (envUrl && envUrl.startsWith('https://')) {
        return envUrl.replace(/\/+$/, '');
      }
      return '/api/proxy';
    }
  }
  return (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/+$/, '');
}

export const API = resolveApiBaseUrl();
export const money = (c: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(c / 100);
export const lines = (s: string) =>
  s.split('\n').map(x => x.trim()).filter(Boolean);

export const initialTerms: Terms = {
  deliverables: ['Home page', 'About page', 'Contact page'],
  exclusions: ['Hosting and domain fees'],
  amount_cents: 25000,
  currency: 'USD',
  delivery_days: 7,
  revisions: 1,
  payment_terms: 'Full payment upfront; work starts after payment.',
};

export function getResumeRoute(deal: Deal, _role: string): string {
  const offer = deal.offers.at(-1);
  if (deal.status === 'paid') return `/deals/${deal.id}/payment`;
  if (offer && offer.approvals.length === 2) return `/deals/${deal.id}/payment`;
  if (offer) return `/deals/${deal.id}/review`;
  if (deal.requirements) return `/deals/${deal.id}/proposal`;
  return `/deals/${deal.id}/brief`;
}

export function getResumeLabel(deal: Deal, role: string): string {
  const offer = deal.offers.at(-1);
  if (deal.status === 'paid') return 'View payment →';
  if (offer && offer.approvals.length === 2) {
    return role === 'client' ? 'Go to checkout →' : 'Awaiting payment →';
  }
  if (offer) return 'Review proposal →';
  if (deal.requirements) return 'Draft proposal →';
  return 'Start brief →';
}

interface DealPilotContextType {
  token: string;
  role: string;
  configured: { ai_configured: boolean; ai_provider: string; paypal_configured: boolean };
  health: string;
  deals: Deal[];
  activeDealId: string;
  setActiveDealId: (id: string) => void;
  deal?: Deal;
  offer?: Offer;
  api: (path: string, method?: string, body?: unknown, t?: string) => Promise<any>;
  refreshDeals: (t?: string) => Promise<Deal[]>;
  loadDeal: (id: string) => Promise<Deal | undefined>;
  runAction: <T = unknown>(label: string, action: () => Promise<T>) => Promise<T>;
  mutateDeal: (path: string, body?: unknown) => Promise<any>;
  login: (t: string, targetDealId?: string) => Promise<{ role: string; dealId: string }>;
  logout: () => void;
  createDeal: (data: {
    title: string;
    client: string;
    freelancer: string;
    asking_cents: number;
    minimum_cents: number;
  }) => Promise<{ deal: Deal; client_token: string }>;
  invitation: string;
  setInvitation: (url: string) => void;
  showInviteLink: boolean;
  setShowInviteLink: (b: boolean) => void;
  copied: boolean;
  copyInvite: () => void;
  showCert: boolean;
  setShowCert: (b: boolean) => void;
  suggestion: Suggestion | null;
  setSuggestion: (s: Suggestion | null) => void;
  actionLoading: string;
  error: string;
  setError: (e: string) => void;
  navDirection: 'forward' | 'backward' | 'none';
  setNavDirection: (d: 'forward' | 'backward' | 'none') => void;
  // Draft preservation
  drafts: Record<string, { requirements?: string; proposalTerms?: Terms }>;
  setDraftRequirements: (dealId: string, text: string) => void;
  setDraftProposalTerms: (dealId: string, terms: Terms) => void;
  apiUrl: string;
  updateApiUrl: (url: string) => void;
  checkHealth: (url?: string) => void;
  notifications: NotificationItem[];
  unreadNotificationsCount: number;
  toasts: NotificationItem[];
  dismissToast: (id: string) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  loadJudgeDemo: () => Promise<{ dealId: string; clientToken: string }>;
  switchRole: (targetRole: 'freelancer' | 'client') => Promise<void>;
}

function getReadNotifIds(): Set<string> {
  try {
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem('dealpilot-read-notifs');
      if (raw) return new Set(JSON.parse(raw));
    }
  } catch {}
  return new Set();
}

function saveReadNotifIds(ids: Set<string>) {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem('dealpilot-read-notifs', JSON.stringify(Array.from(ids)));
    }
  } catch {}
}

const DealPilotContext = createContext<DealPilotContextType | null>(null);

export function DealPilotProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [apiUrl, setApiUrlState] = useState<string>('');
  const [token, setToken] = useState('');
  const [role, setRole] = useState('');
  const [configured, setConfigured] = useState({
    ai_configured: false,
    ai_provider: '',
    paypal_configured: false,
  });
  const [health, setHealth] = useState('Connecting');
  const [deals, setDeals] = useState<Deal[]>([]);
  const [activeDealId, setActiveDealId] = useState('');

  const [invitation, setInvitation] = useState('');
  const [showInviteLink, setShowInviteLink] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showCert, setShowCert] = useState(false);
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);

  const [actionLoading, setActionLoading] = useState('');
  const [error, setError] = useState('');
  const [navDirection, setNavDirection] = useState<'forward' | 'backward' | 'none'>('none');

  // Drafts keyed by deal ID
  const [drafts, setDrafts] = useState<Record<string, { requirements?: string; proposalTerms?: Terms }>>({});

  // Real-time notifications and toasts
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [toasts, setToasts] = useState<NotificationItem[]>([]);
  const playedSoundIdsRef = useRef<Set<string>>(new Set());

  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  const dismissToast = useCallback((id: string) => {
    // Manually closed by clicking X button:
    // 1. Mark as read in localStorage so it will not pop up again
    const readIds = getReadNotifIds();
    readIds.add(id);
    saveReadNotifIds(readIds);

    // 2. Remove from active toasts immediately
    setToasts(prev => prev.filter(t => t.id !== id));

    // 3. Mark read in notifications list so unread counter decrements immediately
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markNotificationRead = useCallback((id: string) => {
    const readIds = getReadNotifIds();
    readIds.add(id);
    saveReadNotifIds(readIds);

    setToasts(prev => prev.filter(t => t.id !== id));
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    const readIds = getReadNotifIds();
    notifications.forEach(n => readIds.add(n.id));
    saveReadNotifIds(readIds);

    setToasts([]);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, [notifications]);

  const deal = deals.find(x => x.id === activeDealId);
  const offer = deal?.offers.at(-1);

  const api = useCallback(
    async (path: string, method = 'GET', body?: unknown, t = token) => {
      const base = apiUrl || resolveApiBaseUrl();
      const r = await fetch(base + path, {
        method,
        headers: {
          Authorization: 'Bearer ' + t,
          ...(body ? { 'Content-Type': 'application/json' } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      const data = await r.json();
      if (!r.ok) {
        throw Error(
          typeof data.detail === 'string'
            ? data.detail
            : 'Check the form fields and try again.'
        );
      }
      return data;
    },
    [apiUrl, token]
  );

  const refreshDeals = useCallback(
    async (t = token) => {
      if (!t) return [];
      const list: Deal[] = await api('/deals', 'GET', undefined, t);
      setDeals(list);

      // Persistent record of read notifications
      const readIds = getReadNotifIds();
      const realNotifications: NotificationItem[] = [];

      list.forEach(dealItem => {
        const currentOffer = dealItem.offers.at(-1);

        if (role === 'client') {
          // ==========================================
          // CLIENT SIDE: "Waiting for your approval for this project"
          // ==========================================
          if (
            currentOffer &&
            !currentOffer.approvals.includes('client') &&
            !currentOffer.rejected &&
            !dealItem.frozen &&
            !dealItem.cancelled
          ) {
            const notifId = `client-wait-${dealItem.id}-v${currentOffer.version}`;
            const item: NotificationItem = {
              id: notifId,
              dealId: dealItem.id,
              dealTitle: dealItem.title,
              type: 'approval',
              title: 'Waiting for your approval for this project',
              message: `Proposal v${currentOffer.version} for "${dealItem.title}" is waiting for your review and approval.`,
              role: 'freelancer',
              createdAt: currentOffer.created_at || dealItem.created_at || new Date().toISOString(),
              read: readIds.has(notifId),
              actionUrl: `/deals/${dealItem.id}/review`,
            };
            realNotifications.push(item);
          }
        } else if (role === 'freelancer') {
          // ==========================================
          // FREELANCER SIDE:
          // 1. "Accepted the proposal"
          // 2. "Rejected the proposal"
          // 3. "Paid for the project"
          // ==========================================
          dealItem.offers.forEach(o => {
            // 1. Client accepted the proposal
            if (o.approvals.includes('client')) {
              const notifId = `fl-accepted-${dealItem.id}-v${o.version}`;
              const item: NotificationItem = {
                id: notifId,
                dealId: dealItem.id,
                dealTitle: dealItem.title,
                type: 'approval',
                title: 'Accepted the proposal',
                message: `${dealItem.client} accepted the proposal for "${dealItem.title}".`,
                role: 'client',
                createdAt: o.created_at || dealItem.created_at || new Date().toISOString(),
                read: readIds.has(notifId),
                actionUrl: `/deals/${dealItem.id}/review`,
              };
              realNotifications.push(item);
            }

            // 2. Client rejected the proposal
            if (o.rejected) {
              const notifId = `fl-rejected-${dealItem.id}-v${o.version}`;
              const item: NotificationItem = {
                id: notifId,
                dealId: dealItem.id,
                dealTitle: dealItem.title,
                type: 'rejection',
                title: 'Rejected the proposal',
                message: `${dealItem.client} rejected the proposal for "${dealItem.title}".`,
                role: 'client',
                createdAt: o.created_at || dealItem.created_at || new Date().toISOString(),
                read: readIds.has(notifId),
                actionUrl: `/deals/${dealItem.id}/negotiation`,
              };
              realNotifications.push(item);
            }
          });

          // 3. Client paid for the project
          if (dealItem.payment?.status === 'paid') {
            const notifId = `fl-paid-${dealItem.id}`;
            const item: NotificationItem = {
              id: notifId,
              dealId: dealItem.id,
              dealTitle: dealItem.title,
              type: 'payment',
              title: 'Paid for the project',
              message: `${dealItem.client} paid for the project "${dealItem.title}".`,
              role: 'client',
              createdAt: dealItem.payment.paid_at || dealItem.created_at || new Date().toISOString(),
              read: readIds.has(notifId),
              actionUrl: `/deals/${dealItem.id}/payment`,
            };
            realNotifications.push(item);
          }
        }
      });

      // Sort real notifications descending by time
      realNotifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setNotifications(realNotifications);

      // Unread notifications stay popped up until manually closed by clicking X button!
      const unreadItems = realNotifications.filter(n => !n.read);
      setToasts(unreadItems.slice(0, 4));

      // Play chime once per unique notification
      unreadItems.forEach(notif => {
        if (!playedSoundIdsRef.current.has(notif.id)) {
          playedSoundIdsRef.current.add(notif.id);
          playNotificationSound(notif.type);
        }
      });

      return list;
    },
    [api, token, role]
  );

  const loadDeal = useCallback(
    async (id: string) => {
      if (!token) return undefined;
      const list = await refreshDeals();
      const found = list.find(d => d.id === id);
      if (found) setActiveDealId(id);
      return found;
    },
    [token, refreshDeals]
  );

  const runAction = useCallback(
    async <T,>(label: string, action: () => Promise<T>): Promise<T> => {
      setActionLoading(label);
      setError('');
      try {
        return await action();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Request failed.');
        void refreshDeals();
        throw e;
      } finally {
        setActionLoading('');
      }
    },
    [refreshDeals]
  );

  const mutateDeal = useCallback(
    async (path: string, body?: unknown) => {
      if (!activeDealId) return undefined;
      const res = await api('/deals/' + activeDealId + path, 'POST', body);
      await refreshDeals();
      return res;
    },
    [activeDealId, api, refreshDeals]
  );

  const login = useCallback(
    async (t: string, targetDealId?: string) => {
      const s = await api('/session', 'GET', undefined, t);
      setToken(t);
      setRole(s.role);
      setConfigured({
        ai_configured: s.ai_configured,
        ai_provider: s.ai_provider,
        paypal_configured: s.paypal_configured,
      });
      sessionStorage.setItem('dealpilot-token', t);

      const list: Deal[] = await api('/deals', 'GET', undefined, t);
      setDeals(list);

      const resolvedDealId = targetDealId || s.deal_id || list[0]?.id || '';
      if (resolvedDealId) {
        setActiveDealId(resolvedDealId);
      }
      return { role: s.role, dealId: resolvedDealId };
    },
    [api]
  );

  const logout = useCallback(() => {
    sessionStorage.removeItem('dealpilot-token');
    setToken('');
    setRole('');
    setDeals([]);
    setActiveDealId('');
    setInvitation('');
    setError('');
    router.push('/');
  }, [router]);

  const createDeal = useCallback(
    async (data: {
      title: string;
      client: string;
      freelancer: string;
      asking_cents: number;
      minimum_cents: number;
    }) => {
      const r = await api('/deals', 'POST', data);
      await refreshDeals();
      setActiveDealId(r.deal.id);
      const inviteUrl = `${location.origin}/?deal=${r.deal.id}#invite=${r.client_token}`;
      setInvitation(inviteUrl);
      return r;
    },
    [api, refreshDeals]
  );

  const copyInvite = useCallback(() => {
    if (!invitation) return;
    navigator.clipboard.writeText(invitation);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [invitation]);

  const setDraftRequirements = useCallback((dealId: string, text: string) => {
    setDrafts(prev => ({ ...prev, [dealId]: { ...prev[dealId], requirements: text } }));
  }, []);

  const setDraftProposalTerms = useCallback((dealId: string, terms: Terms) => {
    setDrafts(prev => ({ ...prev, [dealId]: { ...prev[dealId], proposalTerms: terms } }));
  }, []);

  const loadJudgeDemo = useCallback(async () => {
    setActionLoading('Initializing Hackathon Judge Showcase Deal…');
    setError('');
    try {
      const base = apiUrl || resolveApiBaseUrl();
      const r = await fetch(base + '/demo/seed', { method: 'POST' });
      if (!r.ok) throw new Error('Failed to seed judge demo deal.');
      const data = await r.json();

      const { deal_id, client_token, freelancer_token } = data;
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('dealpilot-client-token-' + deal_id, client_token);
        sessionStorage.setItem('dealpilot-freelancer-token', freelancer_token);
      }

      await login(freelancer_token, deal_id);
      setActiveDealId(deal_id);
      router.push(`/deals/${deal_id}/review`);
      return { dealId: deal_id, clientToken: client_token };
    } catch (err: any) {
      setError(err?.message || 'Failed to initialize judge demo.');
      throw err;
    } finally {
      setActionLoading('');
    }
  }, [apiUrl, login, router]);

  const switchRole = useCallback(
    async (targetRole: 'freelancer' | 'client') => {
      if (!activeDealId) return;
      setActionLoading(`Switching view to ${targetRole === 'client' ? 'Client' : 'Freelancer'}…`);
      setError('');
      try {
        if (targetRole === 'client') {
          let clientToken =
            typeof window !== 'undefined'
              ? sessionStorage.getItem('dealpilot-client-token-' + activeDealId)
              : null;
          if (!clientToken) {
            const tokenRes = await api(`/deals/${activeDealId}/client-token`, 'GET');
            clientToken = tokenRes.client_token;
            if (typeof window !== 'undefined' && clientToken) {
              sessionStorage.setItem('dealpilot-client-token-' + activeDealId, clientToken);
            }
          }
          if (!clientToken) throw new Error('Could not obtain client token for this deal.');
          await login(clientToken, activeDealId);
        } else {
          const freelancerToken =
            (typeof window !== 'undefined'
              ? sessionStorage.getItem('dealpilot-freelancer-token')
              : null) || 'l23kTxGL6jBc21F0AMTvB2A6VYJfzco0VcqBqsZxTlbz2qGi';
          await login(freelancerToken, activeDealId);
        }
      } catch (err: any) {
        setError(err?.message || 'Failed to switch role.');
      } finally {
        setActionLoading('');
      }
    },
    [activeDealId, api, login]
  );

  const checkHealth = useCallback((urlToTest?: string) => {
    const base = urlToTest !== undefined ? urlToTest : (apiUrl || resolveApiBaseUrl());
    setHealth('Connecting');
    fetch(base + '/health')
      .then(r => {
        if (!r.ok) throw Error();
        return r.json();
      })
      .then(() => setHealth('API connected'))
      .catch(() => setHealth('API offline'));
  }, [apiUrl]);

  const updateApiUrl = useCallback((newUrl: string) => {
    const cleaned = newUrl.trim().replace(/\/+$/, '');
    if (typeof window !== 'undefined') {
      if (cleaned) {
        localStorage.setItem('dealpilot-api-url', cleaned);
      } else {
        localStorage.removeItem('dealpilot-api-url');
      }
    }
    const resolved = resolveApiBaseUrl();
    setApiUrlState(resolved);
    checkHealth(resolved);
  }, [checkHealth]);

  // Health check & session bootstrap
  useEffect(() => {
    const initialUrl = resolveApiBaseUrl();
    setApiUrlState(initialUrl);
    checkHealth(initialUrl);

    const invite = typeof window !== 'undefined' ? new URLSearchParams(location.hash.slice(1)).get('invite') : null;
    const dealParam = typeof window !== 'undefined' ? new URLSearchParams(location.search).get('deal') : null;
    const saved = invite || (typeof window !== 'undefined' ? sessionStorage.getItem('dealpilot-token') : null);

    if (invite) {
      history.replaceState(null, '', location.pathname + location.search);
    }

    if (saved) {
      void login(saved, dealParam || undefined)
        .then(({ dealId, role: currentRole }) => {
          // If on home entry screen, navigate into workspace
          if (pathname === '/') {
            if (dealId && currentRole === 'client') {
              const targetDeal = deals.find(d => d.id === dealId);
              const route = targetDeal ? getResumeRoute(targetDeal, currentRole) : `/deals/${dealId}/review`;
              router.push(route);
            } else {
              router.push('/dashboard');
            }
          }
        })
        .catch(() => {
          sessionStorage.removeItem('dealpilot-token');
        });
    }
  }, []);

  // Periodic background synchronization and tab focus sync
  useEffect(() => {
    if (!token) return;
    const handleFocus = () => {
      void refreshDeals();
    };
    window.addEventListener('focus', handleFocus);
    const interval = setInterval(() => {
      void refreshDeals();
    }, 4000);
    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(interval);
    };
  }, [token, refreshDeals]);

  return (
    <DealPilotContext.Provider
      value={{
        token,
        role,
        configured,
        health,
        deals,
        activeDealId,
        setActiveDealId,
        deal,
        offer,
        api,
        refreshDeals,
        loadDeal,
        runAction,
        mutateDeal,
        login,
        logout,
        createDeal,
        invitation,
        setInvitation,
        showInviteLink,
        setShowInviteLink,
        copied,
        copyInvite,
        showCert,
        setShowCert,
        suggestion,
        setSuggestion,
        actionLoading,
        error,
        setError,
        navDirection,
        setNavDirection,
        drafts,
        setDraftRequirements,
        setDraftProposalTerms,
        apiUrl,
        updateApiUrl,
        checkHealth,
        notifications,
        unreadNotificationsCount,
        toasts,
        dismissToast,
        markNotificationRead,
        markAllNotificationsRead,
        loadJudgeDemo,
        switchRole,
      }}
    >
      {children}
    </DealPilotContext.Provider>
  );
}

export function useDealPilot() {
  const context = useContext(DealPilotContext);
  if (!context) {
    throw new Error('useDealPilot must be used within a DealPilotProvider');
  }
  return context;
}
