'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDealPilot } from '@/context/DealPilotContext';
import { NotificationItem, NotificationType } from '@/types';
import {
  CheckCircleIcon,
  XCircleIcon,
  ChatBubbleIcon,
  CreditCardIcon,
  BellIcon,
} from '@/components/Icons';

export default function NotificationsPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const {
    notifications,
    unreadNotificationsCount,
    markNotificationRead,
    markAllNotificationsRead,
    setActiveDealId,
    triggerTestNotification,
  } = useDealPilot();

  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'approvals' | 'payments' | 'proposals'>('all');

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'approval':
        return <CheckCircleIcon />;
      case 'rejection':
        return <XCircleIcon />;
      case 'payment':
        return <CreditCardIcon />;
      case 'negotiation':
      case 'message':
        return <ChatBubbleIcon />;
      default:
        return <BellIcon />;
    }
  };

  const filtered = notifications.filter(n => {
    if (activeTab === 'unread') return !n.read;
    if (activeTab === 'approvals') return n.type === 'approval' || n.type === 'rejection';
    if (activeTab === 'payments') return n.type === 'payment';
    if (activeTab === 'proposals') return n.type === 'negotiation' || n.type === 'message';
    return true;
  });

  const handleItemClick = (n: NotificationItem) => {
    markNotificationRead(n.id);
    if (n.dealId) {
      setActiveDealId(n.dealId);
    }
    if (n.actionUrl) {
      router.push(n.actionUrl);
    }
  };

  const formatFullDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return '';
    }
  };

  if (!mounted) {
    return (
      <div className="notifications-page" style={{ maxWidth: 920, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ height: 80, background: '#f8fafc', borderRadius: 12, marginBottom: 20 }} />
        <div style={{ height: 320, background: '#f8fafc', borderRadius: 12 }} />
      </div>
    );
  }

  return (
    <div className="notifications-page page-transition-fade" style={{ maxWidth: 920, margin: '0 auto', padding: '24px 16px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <span className="eyebrow">ACTIVITY & ALERTS</span>
          <h1 style={{ fontSize: 26, fontWeight: 700, margin: '4px 0 0', color: '#0f172a' }}>
            Notifications Center
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 14, color: '#64748b' }}>
            Track client approvals, counter-offers, rejections, and PayPal Sandbox payments in real time.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            type="button"
            onClick={triggerTestNotification}
            className="secondary"
            style={{ fontSize: 13, padding: '8px 14px', borderRadius: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <span>⚡ Test Pop Notification</span>
          </button>
          {unreadNotificationsCount > 0 && (
            <button
              type="button"
              onClick={markAllNotificationsRead}
              className="primary"
              style={{ fontSize: 13, padding: '8px 16px', borderRadius: 8 }}
            >
              Mark all as read ({unreadNotificationsCount})
            </button>
          )}
        </div>
      </div>

      {/* Tabs / Filter Navigation */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          borderBottom: '1px solid #e2e8f0',
          marginBottom: 20,
          overflowX: 'auto',
          paddingBottom: 4,
        }}
      >
        {[
          { id: 'all', label: `All (${notifications.length})` },
          { id: 'unread', label: `Unread (${unreadNotificationsCount})` },
          { id: 'approvals', label: 'Approvals & Decisions' },
          { id: 'payments', label: 'Payments' },
          { id: 'proposals', label: 'Proposals & Terms' },
        ].map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid var(--blue-primary)' : '2px solid transparent',
              color: activeTab === tab.id ? 'var(--blue-primary)' : '#64748b',
              fontWeight: activeTab === tab.id ? 700 : 500,
              fontSize: 14,
              padding: '8px 12px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main List */}
      <div
        className="card"
        style={{
          background: '#FFFFFF',
          borderRadius: 14,
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05), 0 0 0 1px #e2e8f0',
          overflow: 'hidden',
        }}
      >
        {filtered.length === 0 ? (
          <div style={{ padding: '64px 20px', textAlign: 'center', color: '#94a3b8' }}>
            <div style={{ marginBottom: 12 }}>
              <BellIcon />
            </div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#334155' }}>
              No notifications to display
            </h3>
            <p style={{ margin: '6px 0 0', fontSize: 13 }}>
              When proposals are approved, rejected, or paid, events will appear here and pop up on screen.
            </p>
          </div>
        ) : (
          filtered.map(item => (
            <div
              key={item.id}
              onClick={() => handleItemClick(item)}
              style={{
                padding: '18px 24px',
                borderBottom: '1px solid #f1f5f9',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 16,
                background: item.read ? '#FFFFFF' : 'rgba(59, 130, 246, 0.03)',
                cursor: 'pointer',
                transition: 'background 0.15s ease',
              }}
            >
              <div style={{ marginTop: 2 }}>{getIcon(item.type)}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 15, fontWeight: item.read ? 600 : 700, color: '#0f172a' }}>
                      {item.title}
                    </span>
                    {!item.read && (
                      <span
                        style={{
                          background: 'rgba(59, 130, 246, 0.15)',
                          color: 'var(--blue-primary)',
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '1px 7px',
                          borderRadius: 99,
                        }}
                      >
                        NEW
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: 12, color: '#94a3b8', whiteSpace: 'nowrap' }}>
                    {formatFullDate(item.createdAt)}
                  </span>
                </div>

                <p style={{ margin: '6px 0 0', fontSize: 14, color: '#475569', lineHeight: 1.5 }}>
                  {item.message}
                </p>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: '#64748b',
                      background: '#f1f5f9',
                      padding: '2px 8px',
                      borderRadius: 6,
                    }}
                  >
                    Project: {item.dealTitle}
                  </span>

                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: 'var(--blue-primary)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    Open deal step →
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
