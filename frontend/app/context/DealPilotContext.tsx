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
  runAction: (label: string, action: () => Promise<void>) => Promise<void>;
  mutateDeal: (path: string, body?: unknown) => Promise<void>;
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
  triggerNotification: (item: Omit<NotificationItem, 'id' | 'createdAt' | 'read'>) => void;
  triggerTestNotification: () => void;
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
  const prevDealsRef = useRef<Record<string, Deal>>({});
  const initializedRef = useRef<boolean>(false);

  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  const popToast = useCallback((notif: NotificationItem) => {
    setToasts(prev => [notif, ...prev.filter(t => t.id !== notif.id).slice(0, 3)]);
    playNotificationSound(notif.type);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== notif.id));
    }, 6000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const markNotificationRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const triggerNotification = useCallback(
    (item: Omit<NotificationItem, 'id' | 'createdAt' | 'read'>) => {
      const full: NotificationItem = {
        ...item,
        id: 'notif-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
        createdAt: new Date().toISOString(),
        read: false,
      };
      setNotifications(prev => [full, ...prev]);
      popToast(full);
    },
    [popToast]
  );

  const triggerTestNotification = useCallback(() => {
    const sampleDeal = deals.find(d => d.id === activeDealId) || deals[0] || {
      id: 'demo-deal',
      title: 'E-Commerce Website Redesign',
      client: 'Acme Corp',
      freelancer: 'Mithun',
      asking_cents: 35000,
    };
    triggerNotification({
      dealId: sampleDeal.id,
      dealTitle: sampleDeal.title,
      type: 'approval',
      title: 'Proposal Approved!',
      message: `${sampleDeal.client} approved the latest proposal terms. Payment can now be made!`,
      role: 'client',
      actionUrl: `/deals/${sampleDeal.id}/review`,
    });
  }, [activeDealId, deals, triggerNotification]);

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

      const isFirst = !initializedRef.current;
      const prevMap = prevDealsRef.current;
      const newItems: NotificationItem[] = [];

      list.forEach(dealItem => {
        const prev = prevMap[dealItem.id];
        const currentOffer = dealItem.offers.at(-1);
        const prevOffer = prev?.offers.at(-1);

        if (!isFirst && prev) {
          // 1. Check for approvals
          if (currentOffer && prevOffer) {
            const newApprovals = currentOffer.approvals.filter(a => !prevOffer.approvals.includes(a));
            newApprovals.forEach(approver => {
              const actorName = approver === 'client' ? dealItem.client : dealItem.freelancer;
              newItems.push({
                id: `appr-${dealItem.id}-${currentOffer.version}-${approver}-${Date.now()}`,
                dealId: dealItem.id,
                dealTitle: dealItem.title,
                type: 'approval',
                title: approver === role ? 'Proposal Approved' : `${actorName} approved proposal!`,
                message: `Version ${currentOffer.version} of "${dealItem.title}" was approved by ${actorName}.`,
                role: approver,
                createdAt: new Date().toISOString(),
                read: false,
                actionUrl: `/deals/${dealItem.id}/review`,
              });
            });
          }

          // 2. Check for rejection
          if (currentOffer && currentOffer.rejected && prevOffer && !prevOffer.rejected) {
            newItems.push({
              id: `rej-${dealItem.id}-${currentOffer.version}-${Date.now()}`,
              dealId: dealItem.id,
              dealTitle: dealItem.title,
              type: 'rejection',
              title: 'Proposal Rejected',
              message: `Version ${currentOffer.version} of "${dealItem.title}" was rejected. A counter-offer can be made.`,
              role: role === 'client' ? 'freelancer' : 'client',
              createdAt: new Date().toISOString(),
              read: false,
              actionUrl: `/deals/${dealItem.id}/negotiation`,
            });
          }

          // 3. Check for new version / counter-offer
          if (currentOffer && (!prevOffer || currentOffer.version > prevOffer.version)) {
            const author = currentOffer.author;
            const actorName = author === 'client' ? dealItem.client : dealItem.freelancer;
            newItems.push({
              id: `prop-${dealItem.id}-${currentOffer.version}-${Date.now()}`,
              dealId: dealItem.id,
              dealTitle: dealItem.title,
              type: 'negotiation',
              title: 'New Proposal Terms',
              message: `${actorName} submitted Proposal v${currentOffer.version}. Both parties must review & approve.`,
              role: author,
              createdAt: new Date().toISOString(),
              read: false,
              actionUrl: `/deals/${dealItem.id}/review`,
            });
          }

          // 4. Check for payment captured
          if (dealItem.payment?.status === 'paid' && prev.payment?.status !== 'paid') {
            newItems.push({
              id: `pay-${dealItem.id}-${Date.now()}`,
              dealId: dealItem.id,
              dealTitle: dealItem.title,
              type: 'payment',
              title: 'PayPal Payment Verified!',
              message: `Payment of ${money(currentOffer?.terms.amount_cents || dealItem.asking_cents)} confirmed via PayPal Sandbox!`,
              role: 'system',
              createdAt: new Date().toISOString(),
              read: false,
              actionUrl: `/deals/${dealItem.id}/payment`,
            });
          }
        }

        prevMap[dealItem.id] = dealItem;
      });

      if (isFirst) {
        // Initial load: parse historical events from deals
        const historical: NotificationItem[] = [];
        list.forEach(dealItem => {
          (dealItem.events || []).forEach(e => {
            let type: NotificationType = 'system';
            let title = 'Deal Event';
            if (e.message.includes('approved version')) {
              type = 'approval';
              title = `${e.role === 'client' ? dealItem.client : dealItem.freelancer} approved proposal`;
            } else if (e.message.includes('Rejected version')) {
              type = 'rejection';
              title = `Proposal Rejected`;
            } else if (e.message.includes('capture verified')) {
              type = 'payment';
              title = 'PayPal Payment Verified';
            } else if (e.message.includes('Proposed version')) {
              type = 'negotiation';
              title = `New proposal terms by ${e.role}`;
            } else {
              type = 'message';
              title = `Activity on ${dealItem.title}`;
            }

            historical.push({
              id: e.id || `hist-${dealItem.id}-${e.created_at}`,
              dealId: dealItem.id,
              dealTitle: dealItem.title,
              type,
              title,
              message: e.message,
              role: e.role,
              createdAt: e.created_at,
              read: true,
              actionUrl: getResumeRoute(dealItem, dealItem.role || 'freelancer'),
            });
          });
        });

        historical.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setNotifications(historical);
        initializedRef.current = true;
      } else if (newItems.length > 0) {
        newItems.forEach(item => popToast(item));
        setNotifications(prev => [...newItems, ...prev]);
      }

      return list;
    },
    [api, token, role, popToast]
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
    async (label: string, action: () => Promise<void>) => {
      setActionLoading(label);
      setError('');
      try {
        await action();
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
      if (!activeDealId) return;
      await api('/deals/' + activeDealId + path, 'POST', body);
      await refreshDeals();
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
        triggerNotification,
        triggerTestNotification,
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
