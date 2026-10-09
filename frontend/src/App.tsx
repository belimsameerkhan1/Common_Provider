import React, { useState, useEffect, useCallback } from 'react';
import type { NavTab, Provider, ProviderCreate, ServiceHealth } from './types';
import { api } from './services/api';
import { Sidebar } from './components/Sidebar';
import { DashboardOverview } from './components/DashboardOverview';
import { ProvidersView } from './components/ProvidersView';
import { ModelsView } from './components/ModelsView';
import { AddProviderModal } from './components/AddProviderModal';
import { ProviderDetailModal } from './components/ProviderDetailModal';
import './App.css';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavTab>('overview');
  const [providers, setProviders] = useState<Provider[]>([]);
  const [health, setHealth] = useState<ServiceHealth | null>(null);
  const [healthError, setHealthError] = useState(false);
  const [providersLoading, setProvidersLoading] = useState(true);
  const [providersError, setProvidersError] = useState<string | null>(null);

  const [totalDiscoveredModels, setTotalDiscoveredModels] = useState<number>(0);
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);

  // Modals controlled from App level (so overview can trigger them too)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [detailProvider, setDetailProvider] = useState<Provider | null>(null);

  // Fetch health check
  const checkHealth = useCallback(async () => {
    try {
      const data = await api.getHealth();
      setHealth(data);
      setHealthError(false);
    } catch {
      setHealthError(true);
    }
  }, []);

  // Fetch all providers
  const loadProviders = useCallback(async () => {
    setProvidersLoading(true);
    setProvidersError(null);
    try {
      const data = await api.getProviders();
      setProviders(data);
      if (data.length > 0 && !selectedProviderId) {
        setSelectedProviderId(data[0].id);
      }

      // Discover models across providers to populate the actual metrics count
      let modelCount = 0;
      await Promise.allSettled(
        data.map(async (provider) => {
          try {
            const models = await api.getProviderModels(provider.id);
            modelCount += models.length;
          } catch {
            // If discovery fails for a single provider, keep counting others
          }
        })
      );
      setTotalDiscoveredModels(modelCount);
    } catch (err: any) {
      setProvidersError(err.message || 'Failed to load providers.');
    } finally {
      setProvidersLoading(false);
    }
  }, [selectedProviderId]);

  useEffect(() => {
    checkHealth();
    loadProviders();
  }, [checkHealth, loadProviders]);

  const handleCreateProvider = async (data: ProviderCreate) => {
    await api.createProvider(data);
    await loadProviders();
    setSelectedProviderId(data.id);
  };

  const handleViewModels = (providerId: string) => {
    setSelectedProviderId(providerId);
    setCurrentTab('models');
  };

  const handleSelectProviderDetails = (providerId: string) => {
    const found = providers.find((p) => p.id === providerId);
    if (found) {
      setDetailProvider(found);
    }
  };

  return (
    <div className="app-container">
      <Sidebar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        health={health}
        healthError={healthError}
      />

      <main className="main-content">
        {currentTab === 'overview' && (
          <DashboardOverview
            providers={providers}
            totalDiscoveredModels={totalDiscoveredModels}
            loading={providersLoading}
            error={providersError}
            onRefresh={loadProviders}
            onOpenAddModal={() => setIsAddModalOpen(true)}
            onSelectProvider={handleSelectProviderDetails}
            onViewModels={handleViewModels}
          />
        )}

        {currentTab === 'providers' && (
          <ProvidersView
            providers={providers}
            loading={providersLoading}
            error={providersError}
            onRefresh={loadProviders}
            onCreateProvider={handleCreateProvider}
            onViewModels={handleViewModels}
          />
        )}

        {currentTab === 'models' && (
          <ModelsView
            providers={providers}
            selectedProviderId={selectedProviderId}
            onSelectProvider={setSelectedProviderId}
          />
        )}
      </main>

      {/* Global Add Provider Modal */}
      <AddProviderModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleCreateProvider}
      />

      {/* Global Provider Detail Modal */}
      <ProviderDetailModal
        provider={detailProvider}
        onClose={() => setDetailProvider(null)}
        onDiscoverModels={handleViewModels}
      />
    </div>
  );
};

export default App;
