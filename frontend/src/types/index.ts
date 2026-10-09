export interface ModelCapabilities {
  vision: boolean;
  tools: boolean;
  reasoning: boolean;
}

export interface Model {
  id: string;
  name: string;
  provider: string;
  context_window?: number | null;
  capabilities: ModelCapabilities;
}

export interface Provider {
  id: string;
  name: string;
  base_url: string;
  env_key?: string | null;
  protocol: string;
  models?: Model[];
  headers?: Record<string, string>;
}

export interface ProviderCreate {
  id: string;
  name: string;
  base_url: string;
  env_key?: string | null;
  protocol: string;
  models?: Model[];
  headers?: Record<string, string>;
}

export interface ServiceHealth {
  status: string;
  service: string;
  docs_url: string;
  endpoints: Record<string, string>;
}

export type NavTab = 'overview' | 'providers' | 'models' | 'docs';
