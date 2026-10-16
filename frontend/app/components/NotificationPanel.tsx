'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDealPilot } from '../context/DealPilotContext';
import { NotificationItem } from '../types';
import {
  CheckCircleIcon,
  XCircleIcon,
  ChatBubbleIcon,
  CreditCardIcon,
  BellIcon,
  CloseIcon,
} from './Icons';

export function NotificationPanel({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const {
    notifications,
    unreadNotificationsCount,
    markNotificationRead,
    markAllNotificationsRead,
    setActiveDealId,
  } = useDealPilot();

  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  if (!isOpen) return null;

  const filtered = notifications.filter(n => (filter === 'unread' ? !n.read : true));

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

  const handleItemClick = (n: NotificationItem) => {
    markNotificationRead(n.id);
    onClose();
    if (n.dealId) {
      setActiveDealId(n.dealId);
    }
    if (n.actionUrl) {
      router.push(n.actionUrl);
    }
  };

  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      const diffMs = Date.now() - d.getTime();
      const diffMin = Math.floor(diffMs / 60000);
      if (diffMin < 1) return 'Just now';
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHours = Math.floor(diffMin / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="notification-backdrop"
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.25)',
          backdropFilter: 'blur(2px)',
          zIndex: 998,
        }}
      />

      {/* Drawer / Dropdown Panel */}
      <div
        role="dialog"
        aria-label="Notification Center"
        aria-modal="true"
        className="notification-panel page-transition-fade"
        style={{
          position: 'fixed',
          top: 60,
          right: 24,
          width: 400,
          maxWidth: 'calc(100vw - 32px)',
          maxHeight: 'calc(100vh - 80px)',
          background: '#FFFFFF',
          borderRadius: 16,
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 999,
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
              Notifications
            </h3>
            {unreadNotificationsCount > 0 && (
              <span
                style={{
                  background: '#EF4444',
                  color: '#FFFFFF',
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '2px 7px',
                  borderRadius: 99,
                }}
              >
                {unreadNotificationsCount} unread
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {unreadNotificationsCount > 0 && (
              <button
                type="button"
                onClick={markAllNotificationsRead}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--blue-primary)',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '4px 8px',
                }}
              >
                Mark all read
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close notifications"
              style={{
                background: 'none',
                border: 'none',
                color: '#64748b',
                cursor: 'pointer',
                padding: 4,
                display: 'flex',
                alignItems: 'center',
                borderRadius: 4,
              }}
            >
              <CloseIcon />
            </button>
          </div>
        </div>

        {/* Filter Bar & Test Trigger */}
        <div
          style={{
            padding: '10px 20px',
            background: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              type="button"
              onClick={() => setFilter('all')}
              style={{
                background: filter === 'all' ? '#FFFFFF' : 'transparent',
                border: filter === 'all' ? '1px solid #cbd5e1' : '1px solid transparent',
                borderRadius: 6,
                padding: '4px 10px',
                fontSize: 12,
                fontWeight: 600,
                color: filter === 'all' ? '#0f172a' : '#64748b',
                cursor: 'pointer',
              }}
            >
              All ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('unread')}
              style={{
                background: filter === 'unread' ? '#FFFFFF' : 'transparent',
                border: filter === 'unread' ? '1px solid #cbd5e1' : '1px solid transparent',
                borderRadius: 6,
                padding: '4px 10px',
                fontSize: 12,
                fontWeight: 600,
                color: filter === 'unread' ? '#0f172a' : '#64748b',
                cursor: 'pointer',
              }}
            >
              Unread ({unreadNotificationsCount})
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '8px 0',
            maxHeight: 420,
          }}
        >
          {filtered.length === 0 ? (
            <div style={{ padding: '36px 20px', textAlign: 'center', color: '#94a3b8' }}>
              <BellIcon />
              <p style={{ margin: '8px 0 0', fontSize: 13, fontWeight: 500 }}>
                {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
              </p>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: '#cbd5e1' }}>
                You'll be notified when offers are approved, rejected, or paid!
              </p>
            </div>
          ) : (
            filtered.map(item => (
              <div
                key={item.id}
                onClick={() => handleItemClick(item)}
                style={{
                  padding: '12px 20px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  borderBottom: '1px solid #f1f5f9',
                  cursor: 'pointer',
                  background: item.read ? '#FFFFFF' : 'rgba(59, 130, 246, 0.04)',
                  transition: 'background 0.15s ease',
                }}
              >
                <div style={{ marginTop: 2 }}>{getIcon(item.type)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: item.read ? 600 : 700, color: '#0f172a' }}>
                      {item.title}
                    </span>
                    <span style={{ fontSize: 11, color: '#94a3b8', whiteSpace: 'nowrap' }}>
                      {formatTime(item.createdAt)}
                    </span>
                  </div>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: '#475569', lineHeight: 1.35 }}>
                    {item.message}
                  </p>
                  <span style={{ display: 'inline-block', marginTop: 4, fontSize: 11, color: 'var(--blue-primary)', fontWeight: 500 }}>
                    {item.dealTitle}
                  </span>
                </div>
                {!item.read && (
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 99,
                      background: 'var(--blue-primary)',
                      marginTop: 6,
                    }}
                  />
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid #e2e8f0',
            background: '#f8fafc',
            textAlign: 'center',
          }}
        >
          <Link
            href="/notifications"
            onClick={onClose}
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--blue-primary)',
              textDecoration: 'none',
            }}
          >
            View full notification center →
          </Link>
        </div>
      </div>
    </>
  );
}
