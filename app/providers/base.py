from abc import ABC, abstractmethod
from typing import List
from app.models.model import Model
from app.models.provider import Provider


class BaseDiscoverer(ABC):
    """Abstract base discoverer for provider-specific model discovery."""

    @abstractmethod
    async def discover(self, provider: Provider) -> List[Model]:
        """
        Discover models available for the given provider.
        Should attempt API-based discovery if possible, with clean fallback
        to predefined or mock models when credentials or services are unavailable.
        """
        pass
