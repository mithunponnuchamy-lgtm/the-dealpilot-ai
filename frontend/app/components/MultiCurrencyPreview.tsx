'use client';
import { useState } from 'react';

interface CurrencyRate {
  code: string;
  name: string;
  symbol: string;
  rate: number; // rate per 1 USD
  flag: string;
}

const RATES: CurrencyRate[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$', rate: 1.0, flag: '🇺🇸' },
  { code: 'GBP', name: 'British Pound', symbol: '£', rate: 0.77, flag: '🇬🇧' },
  { code: 'EUR', name: 'Euro', symbol: '€', rate: 0.92, flag: '🇪🇺' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', rate: 1.38, flag: '🇨🇦' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', rate: 1.51, flag: '🇦🇺' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', rate: 84.10, flag: '🇮🇳' },
];

export function MultiCurrencyPreview({ amountCents }: { amountCents: number }) {
  const [selectedCode, setSelectedCode] = useState<string>('GBP');
  const usdAmount = amountCents / 100;
  const currentCurrency = RATES.find(r => r.code === selectedCode) || RATES[1];

  const localAmount = (usdAmount * currentCurrency.rate).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <div className="card currency-preview-card">
      <div className="currency-preview-header">
        <div className="currency-brand-wrap">
          <span className="currency-icon">🌐</span>
          <div>
            <h4 className="currency-title">PayPal Cross-Border Multi-Currency Preview</h4>
            <p className="currency-subtitle">
              Client can pay in their local currency; freelancer receives guaranteed USD.
            </p>
          </div>
        </div>
        <span className="paypal-fx-badge">PayPal Global FX Engine</span>
      </div>

      <div className="currency-pill-selector">
        {RATES.map(curr => (
          <button
            key={curr.code}
            type="button"
            className={`currency-pill-btn ${selectedCode === curr.code ? 'active' : ''}`}
            onClick={() => setSelectedCode(curr.code)}
          >
            <span>{curr.flag}</span>
            <b>{curr.code}</b>
          </button>
        ))}
      </div>

      <div className="currency-conversion-grid">
        <div className="currency-stat-box client-pays">
          <span className="stat-label">CLIENT PAYS ({currentCurrency.code})</span>
          <div className="stat-val-row">
            <span className="stat-symbol">{currentCurrency.symbol}</span>
            <span className="stat-num">{localAmount}</span>
            <span className="stat-code">{currentCurrency.code}</span>
          </div>
          <small className="stat-note">
            Indicative FX rate: 1 USD = {currentCurrency.rate} {currentCurrency.code}
          </small>
        </div>

        <div className="currency-arrow-divider">
          <span>⇄</span>
        </div>

        <div className="currency-stat-box freelancer-receives">
          <span className="stat-label">FREELANCER RECEIVES (USD)</span>
          <div className="stat-val-row">
            <span className="stat-symbol">$</span>
            <span className="stat-num">
              {usdAmount.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
            <span className="stat-code">USD</span>
          </div>
          <small className="stat-note green">
            ✓ 100% Guaranteed payout · Protected from FX shifts
          </small>
        </div>
      </div>

      <div className="currency-footer-bar">
        <div className="fx-guarantee-badge">
          <span className="shield-check">🛡️</span>
          <span>Zero Currency Risk: Freelancer payout amount is locked in contract terms.</span>
        </div>
        <span className="fx-settlement-tag">PayPal Sandbox Auto-Conversion</span>
      </div>
    </div>
  );
}
