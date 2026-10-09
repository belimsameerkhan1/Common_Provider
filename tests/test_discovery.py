import asyncio
import httpx
from app.models.model import Model, ModelCapabilities
from app.models.provider import Provider
from app.providers.openai import OpenAIDiscoverer
from app.providers.ollama import OllamaDiscoverer
from app.providers.static import StaticDiscoverer
from app.services.discovery import ModelDiscoveryService


def test_openai_discoverer_fallback():
    async def run_test():
        discoverer = OpenAIDiscoverer()
        provider = Provider(
            id="openai",
            name="OpenAI",
            base_url="https://api.openai.com/v1",
            env_key="NON_EXISTENT_KEY_12345",
            protocol="openai",
        )
        models = await discoverer.discover(provider)
        assert len(models) > 0
        model_ids = [m.id for m in models]
        assert "gpt-4o" in model_ids
        assert "gpt-4o-mini" in model_ids

        # Check capabilities of gpt-4o
        gpt4o = next(m for m in models if m.id == "gpt-4o")
        assert gpt4o.capabilities.vision is True
        assert gpt4o.capabilities.tools is True
        assert gpt4o.capabilities.reasoning is True

    asyncio.run(run_test())


def test_openai_discoverer_mock_api(monkeypatch):
    async def run_test():
        discoverer = OpenAIDiscoverer()
        monkeypatch.setenv("TEST_OPENAI_KEY", "sk-mock-key")

        mock_response_data = {
            "data": [
                {"id": "gpt-4o"},
                {"id": "o1-preview"},
                {"id": "whisper-1"},  # should be filtered out by chat/text filter
            ]
        }

        class MockAsyncClient:
            def __init__(self, *args, **kwargs):
                pass

            async def __aenter__(self):
                return self

            async def __aexit__(self, *args):
                pass

            async def get(self, url, headers=None):
                return httpx.Response(
                    status_code=200,
                    json=mock_response_data,
                    request=httpx.Request("GET", url),
                )

        monkeypatch.setattr(httpx, "AsyncClient", MockAsyncClient)

        provider = Provider(
            id="openai-mock",
            name="OpenAI Mock",
            base_url="https://api.openai.com/v1",
            env_key="TEST_OPENAI_KEY",
            protocol="openai",
        )

        models = await discoverer.discover(provider)
        assert len(models) == 2
        ids = [m.id for m in models]
        assert "gpt-4o" in ids
        assert "o1-preview" in ids

    asyncio.run(run_test())


def test_ollama_discoverer_fallback():
    async def run_test():
        discoverer = OllamaDiscoverer()
        provider = Provider(
            id="ollama",
            name="Ollama Local",
            base_url="http://localhost:11434",
            protocol="ollama",
        )
        models = await discoverer.discover(provider)
        assert len(models) > 0
        ids = [m.id for m in models]
        assert "llama3.2:latest" in ids
        assert "deepseek-r1:8b" in ids

    asyncio.run(run_test())


def test_ollama_discoverer_live_mock(monkeypatch):
    async def run_test():
        discoverer = OllamaDiscoverer()
        mock_response_data = {
            "models": [
                {"name": "mistral:latest", "model": "mistral:latest"},
                {"name": "deepseek-r1:14b", "model": "deepseek-r1:14b"},
            ]
        }

        class MockAsyncClient:
            def __init__(self, *args, **kwargs):
                pass

            async def __aenter__(self):
                return self

            async def __aexit__(self, *args):
                pass

            async def get(self, url, headers=None):
                return httpx.Response(
                    status_code=200,
                    json=mock_response_data,
                    request=httpx.Request("GET", url),
                )

        monkeypatch.setattr(httpx, "AsyncClient", MockAsyncClient)

        provider = Provider(
            id="ollama",
            name="Ollama Local",
            base_url="http://localhost:11434",
            protocol="ollama",
        )
        models = await discoverer.discover(provider)
        assert len(models) == 2
        ids = [m.id for m in models]
        assert "mistral:latest" in ids
        assert "deepseek-r1:14b" in ids

    asyncio.run(run_test())


def test_static_discoverer_and_predefined():
    async def run_test():
        provider = Provider(
            id="custom",
            name="Custom AI",
            base_url="https://custom.ai/api",
            protocol="static",
            models=[
                Model(
                    id="custom-llm-1",
                    name="Custom LLM v1",
                    provider="custom",
                    context_window=32000,
                    capabilities=ModelCapabilities(
                        vision=False, tools=True, reasoning=False
                    ),
                )
            ],
        )
        discoverer = StaticDiscoverer()
        models = await discoverer.discover(provider)
        assert len(models) == 1
        assert models[0].id == "custom-llm-1"
        assert models[0].context_window == 32000

    asyncio.run(run_test())


def test_discovery_service_routing():
    async def run_test():
        service = ModelDiscoveryService()
        provider = Provider(
            id="openai-test",
            name="OpenAI Test",
            base_url="https://api.openai.com/v1",
            protocol="openai",
        )
        models = await service.discover_models(provider)
        assert len(models) > 0

    asyncio.run(run_test())
