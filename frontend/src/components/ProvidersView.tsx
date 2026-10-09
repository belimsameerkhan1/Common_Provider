import React, { useState } from 'react';
import { Plus, Search, Server, RefreshCw, AlertCircle, ArrowRight } from 'lucide-react';
import type { Provider, ProviderCreate } from '../types';
import { AddProviderModal } from './AddProviderModal';
import { ProviderDetailModal } from './ProviderDetailModal';

interface ProvidersViewProps {
  providers: Provider[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onCreateProvider: (data: ProviderCreate) => Promise<void>;
  onViewModels: (providerId: string) => void;
}

export const ProvidersView: React.FC<ProvidersViewProps> = ({
  providers,
  loading,
  error,
  onRefresh,
  onCreateProvider,
  onViewModels,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);

  const filteredProviders = providers.filter((p) => {
    const term = searchTerm.toLowerCase();
    return (
      p.id.toLowerCase().includes(term) ||
      p.name.toLowerCase().includes(term) ||
      p.protocol.toLowerCase().includes(term) ||
      p.base_url.toLowerCase().includes(term)
    );
  });

  return (
    <div className="page-container">
      <header className="page-header">
        <div className="header-title-group">
          <h1>Providers</h1>
          <p>Configure LLM endpoints, wire protocols, and authentication settings.</p>
        </div>
        <div className="header-actions">
          <button
            className="btn btn-secondary btn-sm"
            onClick={onRefresh}
            disabled={loading}
          >
            <RefreshCw size={13} className={loading ? 'spinner' : ''} />
            <span>Refresh</span>
          </button>
          <button className="btn btn-primary" onClick={() => setIsAddOpen(true)}>
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

      {/* Filter and count bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <div className="search-bar">
          <Search size={14} style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search providers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
          Showing {filteredProviders.length} of {providers.length} providers
        </span>
      </div>

      {/* Table list */}
      {loading && providers.length === 0 ? (
        <div className="state-box">
          <div className="spinner" />
          <p className="state-title">Loading providers...</p>
        </div>
      ) : filteredProviders.length === 0 ? (
        <div className="state-box">
          <Server size={32} style={{ color: 'var(--text-muted)' }} />
          <p className="state-title">
            {searchTerm ? 'No matching providers found' : 'No providers registered yet'}
          </p>
          <p className="state-desc">
            {searchTerm
              ? `No provider matches "${searchTerm}". Try a different filter.`
              : 'Register your first provider to begin model discovery.'}
          </p>
          {!searchTerm && (
            <button className="btn btn-primary" onClick={() => setIsAddOpen(true)}>
              <Plus size={14} />
              <span>Add provider</span>
            </button>
          )}
        </div>
      ) : (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Protocol</th>
                <th>Base URL</th>
                <th>Environment Auth</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProviders.map((provider) => (
                <tr
                  key={provider.id}
                  className="clickable"
                  onClick={() => setSelectedProvider(provider)}
                >
                  <td>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 600,
                        fontSize: '13px',
                      }}
                    >
                      {provider.id}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 500 }}>{provider.name}</span>
                  </td>
                  <td>
                    <span className="badge">{provider.protocol}</span>
                  </td>
                  <td>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '12px',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {provider.base_url}
                    </span>
                  </td>
                  <td>
                    {provider.env_key ? (
                      <span className="badge badge-muted">${provider.env_key}</span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                        None
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
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setSelectedProvider(provider)}
                      >
                        Details
                      </button>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => onViewModels(provider.id)}
                      >
                        <span>Models</span>
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

      {/* Add Provider Modal */}
      <AddProviderModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSubmit={onCreateProvider}
      />

      {/* Provider Details Modal */}
      <ProviderDetailModal
        provider={selectedProvider}
        onClose={() => setSelectedProvider(null)}
        onDiscoverModels={onViewModels}
      />
    </div>
  );
};
