import React from 'react';
import { Layers, Server, Box, BookOpen, ExternalLink } from 'lucide-react';
import type { NavTab, ServiceHealth } from '../types';

interface SidebarProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  health: ServiceHealth | null;
  healthError: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  healthError,
}) => {
  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <div className="sidebar-brand">
          <div className="brand-logo">p.</div>
          <span className="brand-name">provider.</span>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`nav-item ${currentTab === 'overview' ? 'active' : ''}`}
            onClick={() => onTabChange('overview')}
          >
            <Layers className="nav-icon" />
            <span>Overview</span>
          </button>

          <button
            className={`nav-item ${currentTab === 'providers' ? 'active' : ''}`}
            onClick={() => onTabChange('providers')}
          >
            <Server className="nav-icon" />
            <span>Providers</span>
          </button>

          <button
            className={`nav-item ${currentTab === 'models' ? 'active' : ''}`}
            onClick={() => onTabChange('models')}
          >
            <Box className="nav-icon" />
            <span>Models</span>
          </button>

          <a
            href="https://common-provider.onrender.com/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="nav-item"
            title="FastAPI Swagger Documentation"
          >
            <BookOpen className="nav-icon" />
            <span style={{ flex: 1, textAlign: 'left' }}>API Docs</span>
            <ExternalLink size={12} style={{ color: 'var(--text-muted)' }} />
          </a>
        </nav>
      </div>

      <div className="sidebar-footer">
        <div className="status-indicator">
          <span className={`status-dot ${healthError ? 'offline' : ''}`} />
          <span>{healthError ? 'API: Offline' : 'API: Online'}</span>
        </div>
      </div>
    </aside>
  );
};
