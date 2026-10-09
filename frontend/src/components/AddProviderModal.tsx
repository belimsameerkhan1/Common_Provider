import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import type { ProviderCreate } from '../types';

interface AddProviderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProviderCreate) => Promise<void>;
}

export const AddProviderModal: React.FC<AddProviderModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [protocol, setProtocol] = useState('openai');
  const [envKey, setEnvKey] = useState('');
  const [headersJson, setHeadersJson] = useState('');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanId = id.trim().toLowerCase();
    const cleanName = name.trim();
    const cleanBaseUrl = baseUrl.trim();

    if (!cleanId) {
      setFormError('Provider ID is required (e.g., "anthropic" or "groq").');
      return;
    }
    if (!cleanName) {
      setFormError('Provider Name is required.');
      return;
    }
    if (!cleanBaseUrl) {
      setFormError('Base URL is required.');
      return;
    }

    let parsedHeaders: Record<string, string> = {};
    if (headersJson.trim()) {
      try {
        parsedHeaders = JSON.parse(headersJson.trim());
        if (typeof parsedHeaders !== 'object' || Array.isArray(parsedHeaders)) {
          setFormError('Headers must be a valid JSON key-value object.');
          return;
        }
      } catch {
        setFormError('Invalid JSON format in custom headers.');
        return;
      }
    }

    const payload: ProviderCreate = {
      id: cleanId,
      name: cleanName,
      base_url: cleanBaseUrl,
      protocol: protocol.trim(),
      env_key: envKey.trim() || null,
      headers: parsedHeaders,
      models: [],
    };

    setLoading(true);
    try {
      await onSubmit(payload);
      // Reset form on success
      setId('');
      setName('');
      setBaseUrl('');
      setProtocol('openai');
      setEnvKey('');
      setHeadersJson('');
      onClose();
    } catch (err: any) {
      setFormError(err.message || 'Failed to register provider.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">Register Provider</span>
          <button className="btn-icon" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {formError && (
              <div className="banner banner-error">
                <AlertCircle size={15} />
                <span>{formError}</span>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">
                Provider ID <span className="req">*</span>
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. groq, anthropic, mistral"
                value={id}
                onChange={(e) => setId(e.target.value)}
                required
              />
              <span className="form-hint">
                Unique identifier used in API routes: <code>/providers/{'{id}'}</code>
              </span>
            </div>

            <div className="form-group">
              <label className="form-label">
                Provider Name <span className="req">*</span>
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Groq Cloud, Anthropic Claude"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Base URL <span className="req">*</span>
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. https://api.groq.com/openai/v1"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                required
              />
              <span className="form-hint">
                Root endpoint URL for model requests.
              </span>
            </div>

            <div className="form-group">
              <label className="form-label">Wire Protocol</label>
              <select
                className="form-select"
                value={protocol}
                onChange={(e) => setProtocol(e.target.value)}
              >
                <option value="openai">openai (OpenAI / compatible /v1/models)</option>
                <option value="ollama">ollama (Ollama daemon /api/tags)</option>
                <option value="static">static (Predefined static models catalog)</option>
              </select>
              <span className="form-hint">
                Selects the model discoverer protocol adapter.
              </span>
            </div>

            <div className="form-group">
              <label className="form-label">Environment Key Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. GROQ_API_KEY (optional)"
                value={envKey}
                onChange={(e) => setEnvKey(e.target.value)}
              />
              <span className="form-hint">
                The name of the server environment variable storing the API key.
              </span>
            </div>

            <div className="form-group">
              <label className="form-label">Custom Headers (JSON)</label>
              <textarea
                className="form-textarea"
                placeholder='{"User-Agent": "my-agent/1.0"}'
                value={headersJson}
                onChange={(e) => setHeadersJson(e.target.value)}
              />
              <span className="form-hint">
                Optional JSON dictionary of HTTP headers sent with discovery requests.
              </span>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="spinner" style={{ width: 14, height: 14 }} />
                  <span>Registering...</span>
                </>
              ) : (
                'Register provider'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
