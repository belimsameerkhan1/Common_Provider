import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  Search,
  Box,
  Copy,
  Check,
  AlertCircle,
  Eye,
  Wrench,
  Brain,
  Info,
} from 'lucide-react';
import type { Provider, Model } from '../types';
import { api } from '../services/api';

interface ModelsViewProps {
  providers: Provider[];
  selectedProviderId: string | null;
  onSelectProvider: (providerId: string) => void;
}

const KNOWN_FALLBACK_IDS = new Set([
  'gpt-4o',
  'gpt-4o-mini',
  'o1-preview',
  'gpt-3.5-turbo',
  'llama3.2:latest',
  'deepseek-r1:8b',
  'mistral:7b',
  'llava:7b',
]);

export const ModelsView: React.FC<ModelsViewProps> = ({
  providers,
  selectedProviderId,
  onSelectProvider,
}) => {
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const activeProvider =
    providers.find((p) => p.id === selectedProviderId) || providers[0] || null;

  const fetchModels = async (providerId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getProviderModels(providerId);
      setModels(data);
    } catch (err: any) {
      setError(err.message || 'Failed to discover models for this provider.');
      setModels([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeProvider) {
      fetchModels(activeProvider.id);
    } else {
      setModels([]);
    }
  }, [activeProvider?.id]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const filteredModels = models.filter((m) => {
    const term = searchTerm.toLowerCase();
    return m.id.toLowerCase().includes(term) || m.name.toLowerCase().includes(term);
  });

  // Determine discovery context notice
  const getDiscoveryStatusNotice = () => {
    if (!activeProvider) return null;

    if (activeProvider.protocol === 'static') {
      return {
        type: 'info',
        text: 'Static Configuration: Models are loaded directly from the provider schema definition.',
      };
    }

    if (activeProvider.protocol === 'openai') {
      if (!activeProvider.env_key) {
        return {
          type: 'info',
          text: 'Fallback Catalog: No environment key configured on this provider. Live discovery requires an API key; showing default catalog.',
        };
      }
      return {
        type: 'info',
        text: `Live Wire Discovery: Queries ${activeProvider.base_url}/models using $${activeProvider.env_key}. If external API is unreachable or key invalid, default models are served.`,
      };
    }

    if (activeProvider.protocol === 'ollama') {
      return {
        type: 'info',
        text: `Local Discovery: Queries ${activeProvider.base_url}/api/tags. If local Ollama daemon is offline, default local model catalog is served.`,
      };
    }

    return null;
  };

  const statusNotice = getDiscoveryStatusNotice();

  return (
    <div className="page-container">
      <header className="page-header">
        <div className="header-title-group">
          <h1>Model discovery</h1>
          <p>
            Dynamically query model capabilities, token limits, and wire protocols.
          </p>
        </div>
        <div className="header-actions">
          {activeProvider && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => fetchModels(activeProvider.id)}
              disabled={loading}
            >
              <RefreshCw size={13} className={loading ? 'spinner' : ''} />
              <span>Retry / Discover</span>
            </button>
          )}
        </div>
      </header>

      {/* Provider Selector Chips */}
      {providers.length > 0 && (
        <div className="provider-picker">
          {providers.map((p) => (
            <button
              key={p.id}
              className={`provider-chip ${activeProvider?.id === p.id ? 'active' : ''}`}
              onClick={() => onSelectProvider(p.id)}
            >
              <span>{p.name}</span>
              <span className="chip-badge">{p.protocol}</span>
            </button>
          ))}
        </div>
      )}

      {/* Discovery Context Explanation Banner */}
      {statusNotice && (
        <div className="banner banner-info">
          <Info size={15} style={{ flexShrink: 0, marginTop: 1 }} />
          <span style={{ fontSize: '12.5px' }}>{statusNotice.text}</span>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="banner banner-error">
          <AlertCircle size={16} />
          <div style={{ flex: 1 }}>{error}</div>
          {activeProvider && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => fetchModels(activeProvider.id)}
            >
              Retry
            </button>
          )}
        </div>
      )}

      {/* Search and Model Count Bar */}
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
            placeholder="Search discovered models..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
          {loading ? 'Discovering...' : `${filteredModels.length} models discovered`}
        </span>
      </div>

      {/* Models Table / State */}
      {loading ? (
        <div className="state-box">
          <div className="spinner" />
          <p className="state-title">Discovering models...</p>
          <p className="state-desc">
            Querying {activeProvider?.name} via {activeProvider?.protocol} protocol.
          </p>
        </div>
      ) : !activeProvider ? (
        <div className="state-box">
          <Box size={32} style={{ color: 'var(--text-muted)' }} />
          <p className="state-title">No provider selected</p>
          <p className="state-desc">Please register or select a provider first.</p>
        </div>
      ) : filteredModels.length === 0 ? (
        <div className="state-box">
          <Box size={32} style={{ color: 'var(--text-muted)' }} />
          <p className="state-title">No models discovered</p>
          <p className="state-desc">
            {searchTerm
              ? `No model found matching "${searchTerm}".`
              : `No models returned for provider "${activeProvider.name}".`}
          </p>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => fetchModels(activeProvider.id)}
          >
            Retry discovery
          </button>
        </div>
      ) : (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Model Name & ID</th>
                <th>Source</th>
                <th>Context Window</th>
                <th>Capabilities</th>
                <th style={{ textAlign: 'right' }}>Copy ID</th>
              </tr>
            </thead>
            <tbody>
              {filteredModels.map((model) => {
                const isDefaultFallback = KNOWN_FALLBACK_IDS.has(model.id);

                return (
                  <tr key={model.id}>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 600 }}>{model.name}</span>
                        <span
                          style={{
                            fontSize: '11.5px',
                            fontFamily: 'var(--font-mono)',
                            color: 'var(--text-secondary)',
                          }}
                        >
                          {model.id}
                        </span>
                      </div>
                    </td>
                    <td>
                      {activeProvider.protocol === 'static' ? (
                        <span className="badge badge-muted">Config Catalog</span>
                      ) : isDefaultFallback ? (
                        <span className="badge badge-muted">Fallback Catalog</span>
                      ) : (
                        <span className="badge badge-filled">Live Discovered</span>
                      )}
                    </td>
                    <td>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '12.5px',
                        }}
                      >
                        {model.context_window
                          ? `${model.context_window.toLocaleString()} tokens`
                          : '—'}
                      </span>
                    </td>
                    <td>
                      <div className="caps-container">
                        <span
                          className={`cap-badge ${model.capabilities.vision ? 'active' : 'inactive'}`}
                          title="Vision capability"
                        >
                          <Eye size={10} style={{ marginRight: 3, verticalAlign: -1 }} />
                          vision
                        </span>
                        <span
                          className={`cap-badge ${model.capabilities.tools ? 'active' : 'inactive'}`}
                          title="Tool calling capability"
                        >
                          <Wrench size={10} style={{ marginRight: 3, verticalAlign: -1 }} />
                          tools
                        </span>
                        <span
                          className={`cap-badge ${model.capabilities.reasoning ? 'active' : 'inactive'}`}
                          title="Reasoning / Thinking capability"
                        >
                          <Brain size={10} style={{ marginRight: 3, verticalAlign: -1 }} />
                          reasoning
                        </span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleCopy(model.id)}
                        title="Copy model ID"
                      >
                        {copiedId === model.id ? (
                          <>
                            <Check size={12} />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy size={12} />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
