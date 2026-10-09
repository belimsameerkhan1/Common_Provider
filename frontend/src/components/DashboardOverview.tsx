import React from 'react';
import { Plus, ArrowRight, RefreshCw, AlertCircle, Server } from 'lucide-react';
import type { Provider } from '../types';

interface DashboardOverviewProps {
  providers: Provider[];
  totalDiscoveredModels: number;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onOpenAddModal: () => void;
  onSelectProvider: (providerId: string) => void;
  onViewModels: (providerId: string) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  providers,
  totalDiscoveredModels,
  loading,
  error,
  onRefresh,
  onOpenAddModal,
  onSelectProvider,
  onViewModels,
}) => {
  const uniqueProtocols = Array.from(new Set(providers.map((p) => p.protocol)));

  return (
    <div className="page-container">
      <header className="page-header">
        <div className="header-title-group">
          <h1>Model providers</h1>
          <p>Manage integrations and discover available models from one place.</p>
        </div>
        <div className="header-actions">
          <button
            className="btn btn-secondary btn-sm"
            onClick={onRefresh}
            disabled={loading}
            title="Refresh providers"
          >
            <RefreshCw size={13} className={loading ? 'spinner' : ''} />
            <span>Refresh</span>
          </button>
          <button className="btn btn-primary" onClick={onOpenAddModal}>
            <Plus size={14} />
            <span>Add provider</span>
          </button>
        </div>
      </header>

      {error && (
        <div className="banner banner-error">
          <AlertCircle size={16} />
          <div style={{ flex: 1 }}>{error}</div>
          <button className="btn btn-secondary btn-sm" onClick={onRefresh}>
            Retry
          </button>
        </div>
      )}

      {/* Metrics Summary */}
      <div className="metrics-grid">
        <div className="metric-card">
          <span className="metric-label">Registered providers</span>
          <span className="metric-value">{loading ? '—' : providers.length}</span>
          <span className="metric-subtext">Active integration endpoints</span>
        </div>

        <div className="metric-card">
          <span className="metric-label">Discovered models</span>
          <span className="metric-value">
            {loading ? '—' : totalDiscoveredModels}
          </span>
          <span className="metric-subtext">Across connected provider services</span>
        </div>

        <div className="metric-card">
          <span className="metric-label">Supported protocols</span>
          <span className="metric-value">{loading ? '—' : uniqueProtocols.length}</span>
          <span className="metric-subtext">
            {uniqueProtocols.length > 0 ? uniqueProtocols.join(', ') : 'None'}
          </span>
        </div>
      </div>

      {/* Connected Providers List */}
      <section className="content-section">
        <div className="section-header">
          <h2 className="section-title">Connected providers</h2>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            {providers.length} registered
          </span>
        </div>

        {loading && providers.length === 0 ? (
          <div className="state-box">
            <div className="spinner" />
            <p className="state-title">Loading providers...</p>
            <p className="state-desc">Querying backend registry.</p>
          </div>
        ) : providers.length === 0 ? (
          <div className="state-box">
            <Server size={32} style={{ color: 'var(--text-muted)' }} />
            <p className="state-title">No providers configured</p>
            <p className="state-desc">
              Get started by registering an LLM provider integration.
            </p>
            <button className="btn btn-primary" onClick={onOpenAddModal}>
              <Plus size={14} />
              <span>Add provider</span>
            </button>
          </div>
        ) : (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Provider</th>
                  <th>Protocol</th>
                  <th>Base URL</th>
                  <th>Authentication</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {providers.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 600 }}>{p.name}</span>
                        <span
                          style={{
                            fontSize: '11.5px',
                            fontFamily: 'var(--font-mono)',
                            color: 'var(--text-secondary)',
                          }}
                        >
                          {p.id}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className="badge">{p.protocol}</span>
                    </td>
                    <td>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '12.5px',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        {p.base_url}
                      </span>
                    </td>
                    <td>
                      {p.env_key ? (
                        <span className="badge badge-muted">${p.env_key}</span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                          No auth key
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => onSelectProvider(p.id)}
                        >
                          Details
                        </button>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => onViewModels(p.id)}
                        >
                          <span>Discover</span>
                          <ArrowRight size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
