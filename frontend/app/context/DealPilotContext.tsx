'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Deal, Offer, Terms, Suggestion } from '../types';

export type { Deal, Offer, Terms, Suggestion };

export const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
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
}

const DealPilotContext = createContext<DealPilotContextType | null>(null);

export function DealPilotProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

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

  const deal = deals.find(x => x.id === activeDealId);
  const offer = deal?.offers.at(-1);

  const api = useCallback(
    async (path: string, method = 'GET', body?: unknown, t = token) => {
      const r = await fetch(API + path, {
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
    [token]
  );

  const refreshDeals = useCallback(
    async (t = token) => {
      if (!t) return [];
      const list: Deal[] = await api('/deals', 'GET', undefined, t);
      setDeals(list);
      return list;
    },
    [api, token]
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

  // Health check & session bootstrap
  useEffect(() => {
    fetch(API + '/health')
      .then(r => {
        if (!r.ok) throw Error();
        return r.json();
      })
      .then(() => setHealth('API connected'))
      .catch(() => setHealth('API offline'));

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
