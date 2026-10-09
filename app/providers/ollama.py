import logging
from typing import List
import httpx

from app.models.model import Model, ModelCapabilities
from app.models.provider import Provider
from app.providers.base import BaseDiscoverer

logger = logging.getLogger(__name__)

DEFAULT_OLLAMA_MODELS: List[Model] = [
    Model(
        id="llama3.2:latest",
        name="Llama 3.2 3B",
        provider="ollama",
        context_window=128000,
        capabilities=ModelCapabilities(vision=False, tools=True, reasoning=False),
    ),
    Model(
        id="deepseek-r1:8b",
        name="DeepSeek R1 8B",
        provider="ollama",
        context_window=64000,
        capabilities=ModelCapabilities(vision=False, tools=False, reasoning=True),
    ),
    Model(
        id="mistral:7b",
        name="Mistral 7B Instruct",
        provider="ollama",
        context_window=32768,
        capabilities=ModelCapabilities(vision=False, tools=True, reasoning=False),
    ),
    Model(
        id="llava:7b",
        name="LLaVA 7B Vision",
        provider="ollama",
        context_window=4096,
        capabilities=ModelCapabilities(vision=True, tools=False, reasoning=False),
    ),
]


class OllamaDiscoverer(BaseDiscoverer):
    """
    Model discoverer for Ollama local daemon.
    Queries /api/tags if running, otherwise gracefully falls back to mock/predefined models.
    """

    async def discover(self, provider: Provider) -> List[Model]:
        # If static models were configured on the provider, return them
        if provider.models and len(provider.models) > 0:
            return provider.models

        base = provider.base_url.rstrip("/")
        url = f"{base}/api/tags"

        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                response = await client.get(url, headers=provider.headers or {})
                if response.status_code == 200:
                    payload = response.json()
                    models_data = payload.get("models", [])
                    discovered: List[Model] = []
                    for item in models_data:
                        name = item.get("name", "")
                        model_id = item.get("model", name)
                        discovered.append(
                            Model(
                                id=model_id,
                                name=name,
                                provider=provider.id,
                                context_window=self._infer_context_window(model_id),
                                capabilities=self._infer_capabilities(model_id),
                            )
                        )
                    if discovered:
                        return discovered
        except Exception as exc:
            logger.warning(
                f"Ollama local API unreachable at {url} ({exc}). Using fallback models."
            )

        # Fallback to default local models
        return [
            Model(
                id=m.id,
                name=m.name,
                provider=provider.id,
                context_window=m.context_window,
                capabilities=m.capabilities,
            )
            for m in DEFAULT_OLLAMA_MODELS
        ]

    def _infer_context_window(self, model_id: str) -> int:
        mid = model_id.lower()
        if "llama3" in mid:
            return 128000
        if "deepseek" in mid:
            return 64000
        if "mistral" in mid or "mixtral" in mid:
            return 32768
        return 8192

    def _infer_capabilities(self, model_id: str) -> ModelCapabilities:
        mid = model_id.lower()
        is_reasoning = "r1" in mid or "reason" in mid
        is_vision = "llava" in mid or "vision" in mid
        is_tools = "llama" in mid or "mistral" in mid or "command" in mid
        return ModelCapabilities(
            vision=is_vision,
            tools=is_tools,
            reasoning=is_reasoning,
        )
