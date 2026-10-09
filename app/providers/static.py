from typing import List
from app.models.model import Model
from app.models.provider import Provider
from app.providers.base import BaseDiscoverer


class StaticDiscoverer(BaseDiscoverer):
    """
    Fallback discoverer that returns explicitly configured static models
    on the provider definition.
    """

    async def discover(self, provider: Provider) -> List[Model]:
        return provider.models or []
