from typing import Dict, List
from app.models.model import Model
from app.models.provider import Provider
from app.providers.base import BaseDiscoverer
from app.providers.openai import OpenAIDiscoverer
from app.providers.ollama import OllamaDiscoverer
from app.providers.static import StaticDiscoverer


class ModelDiscoveryService:
    """
    Service coordinating model discovery across different provider protocols.
    """

    def __init__(self):
        self._discoverers: Dict[str, BaseDiscoverer] = {}
        self._default_fallback = StaticDiscoverer()
        self._register_default_discoverers()

    def _register_default_discoverers(self) -> None:
        openai_disc = OpenAIDiscoverer()
        ollama_disc = OllamaDiscoverer()
        static_disc = StaticDiscoverer()

        self.register_discoverer("openai", openai_disc)
        self.register_discoverer("responses", openai_disc)
        self.register_discoverer("ollama", ollama_disc)
        self.register_discoverer("static", static_disc)

    def register_discoverer(self, protocol: str, discoverer: BaseDiscoverer) -> None:
        """Register a model discoverer for a specific wire protocol."""
        self._discoverers[protocol.lower()] = discoverer

    def get_discoverer(self, protocol: str) -> BaseDiscoverer:
        """Retrieve discoverer for a given protocol or fallback to static discoverer."""
        return self._discoverers.get(protocol.lower(), self._default_fallback)

    async def discover_models(self, provider: Provider) -> List[Model]:
        """Discover models for a given provider configuration."""
        discoverer = self.get_discoverer(provider.protocol)
        return await discoverer.discover(provider)
