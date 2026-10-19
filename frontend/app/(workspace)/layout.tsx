'use client';
import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useDealPilot, getResumeRoute } from '@/context/DealPilotContext';
import { SearchIcon, BellIcon } from '@/components/Icons';
import { AgreementCertificateModal } from '@/components/AgreementCertificateModal';
import { NotificationToaster } from '@/components/NotificationToaster';
import { NotificationPanel } from '@/components/NotificationPanel';
import { JudgeDemoBar } from '@/components/JudgeDemoBar';

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const {
    role,
    deals,
    deal,
    offer,
    logout,
    error,
    actionLoading,
    showCert,
    setShowCert,
    setActiveDealId,
    setNavDirection,
    unreadNotificationsCount,
  } = useDealPilot();

  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // If session is lost and token is empty, redirect to home
  useEffect(() => {
    const hasToken = typeof window !== 'undefined' && sessionStorage.getItem('dealpilot-token');
    if (!role && !hasToken) {
      router.push('/');
    }
  }, [role, router]);

  const filteredDeals = useMemo(() => {
    return deals.filter(
      d =>
        d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.status.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [deals, searchQuery]);

  // Derive topbar title from pathname or active deal
  const breadcrumbSection = useMemo(() => {
    if (pathname === '/dashboard') return 'Overview';
    if (pathname === '/deals/new') return 'Create deal';
    if (deal) return deal.title;
    return 'Workspace';
  }, [pathname, deal]);

  return (
    <div className="app">
      <aside>
        <Link href="/dashboard" className="brand" aria-label="DealPilot AI Dashboard">
          <span className="mark" aria-hidden="true">D↗</span>
          DealPilot<span className="ai">AI</span>
        </Link>

        <div className="search-box">
          <span className="search-icon" aria-hidden="true">
            <SearchIcon />
          </span>
          <input
            type="text"
            className="search-input"
            placeholder="Search deals…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            aria-label="Search deals"
          />
        </div>

        <Link
          href="/dashboard"
          className={`nav ${pathname === '/dashboard' ? 'active' : ''}`}
          onClick={() => {
            setActiveDealId('');
            setNavDirection('none');
          }}
        >
          ▦ Overview
        </Link>

        <Link
          href="/notifications"
          className={`nav ${pathname === '/notifications' ? 'active' : ''}`}
          onClick={() => {
            setActiveDealId('');
            setNavDirection('none');
          }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <BellIcon unread={mounted && unreadNotificationsCount > 0} /> Notifications
          </span>
          {mounted && unreadNotificationsCount > 0 && (
            <span
              style={{
                background: '#EF4444',
                color: '#FFFFFF',
                fontSize: 11,
                fontWeight: 700,
                padding: '1px 6px',
                borderRadius: 99,
              }}
            >
              {unreadNotificationsCount}
            </span>
          )}
        </Link>

        <div className="space-label">YOUR DEALS · {filteredDeals.length}</div>
        <nav>
          {filteredDeals.map(d => {
            const targetRoute = getResumeRoute(d, role);
            const isDealActive = pathname.startsWith(`/deals/${d.id}`);
            return (
              <Link
                key={d.id}
                role="button"
                href={targetRoute}
                className={`deal-nav ${isDealActive ? 'active' : ''}`}
                onClick={() => {
                  setActiveDealId(d.id);
                  setNavDirection('none');
                }}
              >
                <span>{d.title}</span>
                <small>
                  {d.client} · {d.status}
                </small>
              </Link>
            );
          })}
          {!filteredDeals.length && searchQuery && (
            <p className="no-deals-found">No deals match "{searchQuery}"</p>
          )}
        </nav>

        {role === 'freelancer' && (
          <Link
            role="button"
            href="/deals/new"
            className="new-button"
            onClick={() => setNavDirection('none')}
          >
            ＋ New deal
          </Link>
        )}

        <div className="sidebar-bottom">
          <span className="avatar">{role === 'client' ? 'C' : 'F'}</span>
          <div>
            <b>{role || 'User'}</b>
            <small>Private demo access</small>
          </div>
          <button onClick={logout}>Exit</button>
        </div>
      </aside>

      <div className="main">
        {mounted && <JudgeDemoBar />}
        <header className="topbar">
          <div className="topbar-breadcrumb">
            <span>Workspace</span>
            <span>/</span>
            <b>{breadcrumbSection}</b>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              type="button"
              onClick={() => setShowNotifications(!showNotifications)}
              aria-label={`Notifications (${unreadNotificationsCount} unread)`}
              style={{
                background: showNotifications ? '#F1F5F9' : 'transparent',
                border: '1px solid #E2E8F0',
                borderRadius: 8,
                padding: '6px 12px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                color: unreadNotificationsCount > 0 ? 'var(--blue-primary)' : '#475569',
              }}
            >
              <BellIcon unread={mounted && unreadNotificationsCount > 0} />
              <span style={{ fontSize: 13, fontWeight: 600 }}>Notifications</span>
              {mounted && unreadNotificationsCount > 0 && (
                <span
                  style={{
                    background: '#EF4444',
                    color: '#FFFFFF',
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: 99,
                    minWidth: 18,
                    textAlign: 'center',
                    lineHeight: '14px',
                  }}
                >
                  {unreadNotificationsCount}
                </span>
              )}
            </button>

            <div className="badge sandbox-badge">
              <span className="badge-dot" aria-hidden="true" />
              <span>Sandbox demo</span>
            </div>
          </div>
        </header>

        <main>
          {error && (
            <div className="error" role="alert">
              <span>⚠ {error}</span>
            </div>
          )}

          {actionLoading && (
            <div className="action-toast" role="status">
              <span className="spinner spinner-blue" aria-hidden="true" />
              <span>{actionLoading}</span>
            </div>
          )}

          {children}

          <footer>DealPilot AI · From conversation to agreement to payment.</footer>
        </main>
      </div>

      {showCert && deal && offer && (
        <AgreementCertificateModal
          deal={deal}
          offer={offer}
          onClose={() => setShowCert(false)}
        />
      )}

      {mounted && <NotificationToaster />}
      {mounted && (
        <NotificationPanel
          isOpen={showNotifications}
          onClose={() => setShowNotifications(false)}
        />
      )}
    </div>
  );
}
