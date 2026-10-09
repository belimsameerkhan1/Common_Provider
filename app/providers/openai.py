import os
import logging
from typing import List
import httpx

from app.models.model import Model, ModelCapabilities
from app.models.provider import Provider
from app.providers.base import BaseDiscoverer

logger = logging.getLogger(__name__)

# Default static/mock models for OpenAI when API is not reachable or credentials missing
DEFAULT_OPENAI_MODELS: List[Model] = [
    Model(
        id="gpt-4o",
        name="GPT-4o Omnimodal",
        provider="openai",
        context_window=128000,
        capabilities=ModelCapabilities(vision=True, tools=True, reasoning=True),
    ),
    Model(
        id="gpt-4o-mini",
        name="GPT-4o Mini",
        provider="openai",
        context_window=128000,
        capabilities=ModelCapabilities(vision=True, tools=True, reasoning=False),
    ),
    Model(
        id="o1-preview",
        name="OpenAI o1 Reasoning",
        provider="openai",
        context_window=128000,
        capabilities=ModelCapabilities(vision=False, tools=False, reasoning=True),
    ),
    Model(
        id="gpt-3.5-turbo",
        name="GPT-3.5 Turbo",
        provider="openai",
        context_window=16385,
        capabilities=ModelCapabilities(vision=False, tools=True, reasoning=False),
    ),
]


class OpenAIDiscoverer(BaseDiscoverer):
    """
    Model discoverer for OpenAI and OpenAI-compatible wire protocols.
    Performs API-based discovery via /v1/models if accessible,
    or falls back cleanly to predefined/mock models.
    """

    async def discover(self, provider: Provider) -> List[Model]:
        # If user explicitly configured static models for this provider, prefer them
        if provider.models and len(provider.models) > 0:
            return provider.models

        # Check for API key in environment
        api_key = os.getenv(provider.env_key) if provider.env_key else None

        # If API key is present, attempt live API discovery
        if api_key:
            try:
                headers = {
                    "Authorization": f"Bearer {api_key}",
                    "Accept": "application/json",
                    **(provider.headers or {}),
                }
                base = provider.base_url.rstrip("/")
                url = f"{base}/models"

                async with httpx.AsyncClient(timeout=5.0) as client:
                    response = await client.get(url, headers=headers)
                    if response.status_code == 200:
                        payload = response.json()
                        raw_models = payload.get("data", [])
                        discovered: List[Model] = []
                        for item in raw_models:
                            m_id = item.get("id", "")
                            # Filter down to common chat / text models for clarity
                            if any(
                                key in m_id.lower()
                                for key in ["gpt", "o1", "o3", "chat", "text", "davinci"]
                            ):
                                discovered.append(
                                    Model(
                                        id=m_id,
                                        name=m_id,
                                        provider=provider.id,
                                        context_window=self._infer_context_window(m_id),
                                        capabilities=self._infer_capabilities(m_id),
                                    )
                                )
                        if discovered:
                            return discovered
                    else:
                        logger.warning(
                            f"OpenAI API discovery returned status {response.status_code}. Using fallback models."
                        )
            except Exception as exc:
                logger.warning(f"Live OpenAI discovery failed ({exc}). Using fallback models.")

        # Default fallback to static/mock catalog
        return [
            Model(
                id=m.id,
                name=m.name,
                provider=provider.id,
                context_window=m.context_window,
                capabilities=m.capabilities,
            )
            for m in DEFAULT_OPENAI_MODELS
        ]

    def _infer_context_window(self, model_id: str) -> int:
        mid = model_id.lower()
        if "gpt-4o" in mid or "o1" in mid or "gpt-4-turbo" in mid:
            return 128000
        if "gpt-4" in mid:
            return 8192
        if "gpt-3.5" in mid:
            return 16385
        return 32768

    def _infer_capabilities(self, model_id: str) -> ModelCapabilities:
        mid = model_id.lower()
        is_reasoning = "o1" in mid or "o3" in mid or "reasoning" in mid
        is_vision = "vision" in mid or "4o" in mid or "4-turbo" in mid
        is_tools = "turbo" in mid or "4o" in mid or "gpt-4" in mid
        return ModelCapabilities(
            vision=is_vision,
            tools=is_tools,
            reasoning=is_reasoning,
        )
