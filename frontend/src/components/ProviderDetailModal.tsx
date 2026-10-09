import React, { useState } from 'react';
import { X, Copy, Check, ArrowRight } from 'lucide-react';
import type { Provider } from '../types';

interface ProviderDetailModalProps {
  provider: Provider | null;
  onClose: () => void;
  onDiscoverModels: (providerId: string) => void;
}

export const ProviderDetailModal: React.FC<ProviderDetailModalProps> = ({
  provider,
  onClose,
  onDiscoverModels,
}) => {
  const [copied, setCopied] = useState(false);

  if (!provider) return null;

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(provider, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <span className="modal-title">{provider.name}</span>
            <div style={{ marginTop: 2 }}>
              <span className="badge">{provider.id}</span>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body">
          <div className="detail-item">
            <span className="detail-label">Wire Protocol</span>
            <span className="detail-value">{provider.protocol}</span>
          </div>

          <div className="detail-item">
            <span className="detail-label">Base URL</span>
            <span className="detail-value">{provider.base_url}</span>
          </div>

          <div className="detail-item">
            <span className="detail-label">Authentication Environment Variable</span>
            <span className="detail-value">
              {provider.env_key ? (
                `$${provider.env_key}`
              ) : (
                <span style={{ color: 'var(--text-muted)' }}>None (unauthenticated or local)</span>
              )}
            </span>
          </div>

          <div className="detail-item">
            <span className="detail-label">Custom Headers</span>
            <pre
              style={{
                fontSize: '12px',
                padding: '8px 12px',
                backgroundColor: 'var(--bg-subtle)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                margin: '4px 0 0 0',
                maxHeight: '120px',
                overflowY: 'auto',
              }}
            >
              {provider.headers && Object.keys(provider.headers).length > 0
                ? JSON.stringify(provider.headers, null, 2)
                : 'None'}
            </pre>
          </div>

          <div className="detail-item">
            <span className="detail-label">Predefined Static Models</span>
            <span className="detail-value">
              {provider.models && provider.models.length > 0
                ? `${provider.models.length} static model(s) attached`
                : 'None configured (dynamic discovery will be queried)'}
            </span>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={handleCopyJson}>
            {copied ? <Check size={13} /> : <Copy size={13} />}
            <span>{copied ? 'Copied JSON' : 'Copy JSON'}</span>
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              onClose();
              onDiscoverModels(provider.id);
            }}
          >
            <span>Discover models</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
};
