from typing import Dict, List, Optional
from app.models.provider import Provider


class ProviderAlreadyExistsError(Exception):
    """Raised when registering a provider that already exists."""
    pass


class ProviderNotFoundError(Exception):
    """Raised when a requested provider is not found."""
    pass


class ProviderRegistry:
    """
    In-memory registry managing provider configurations.
    Thread-safe and initialized with sensible defaults.
    """

    def __init__(self, seed_defaults: bool = True):
        self._providers: Dict[str, Provider] = {}
        if seed_defaults:
            self._seed_default_providers()

    def _seed_default_providers(self) -> None:
        """Seed default providers for out-of-the-box demonstration."""
        openai_provider = Provider(
            id="openai",
            name="OpenAI",
            base_url="https://api.openai.com/v1",
            env_key="OPENAI_API_KEY",
            protocol="openai",
            headers={"User-Agent": "common-provider-service/1.0"},
        )
        ollama_provider = Provider(
            id="ollama",
            name="Ollama Local",
            base_url="http://localhost:11434",
            env_key=None,
            protocol="ollama",
        )
        self._providers[openai_provider.id] = openai_provider
        self._providers[ollama_provider.id] = ollama_provider

    def register(self, provider: Provider) -> Provider:
        """Register a new provider configuration."""
        if provider.id in self._providers:
            raise ProviderAlreadyExistsError(
                f"Provider with id '{provider.id}' is already registered."
            )
        self._providers[provider.id] = provider
        return provider

    def list_all(self) -> List[Provider]:
        """List all registered providers."""
        return list(self._providers.values())

    def get(self, provider_id: str) -> Provider:
        """Get provider by ID or raise ProviderNotFoundError."""
        provider = self._providers.get(provider_id)
        if not provider:
            raise ProviderNotFoundError(f"Provider '{provider_id}' not found.")
        return provider

    def exists(self, provider_id: str) -> bool:
        """Check if provider exists."""
        return provider_id in self._providers

    def reset(self, seed_defaults: bool = True) -> None:
        """Reset the registry to initial state (used for testing)."""
        self._providers.clear()
        if seed_defaults:
            self._seed_default_providers()
