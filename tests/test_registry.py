import pytest
from app.models.provider import Provider
from app.services.registry import (
    ProviderRegistry,
    ProviderAlreadyExistsError,
    ProviderNotFoundError,
)


def test_registry_defaults():
    registry = ProviderRegistry(seed_defaults=True)
    providers = registry.list_all()
    assert len(providers) >= 2
    ids = [p.id for p in providers]
    assert "openai" in ids
    assert "ollama" in ids


def test_registry_register_and_get():
    registry = ProviderRegistry(seed_defaults=False)
    new_provider = Provider(
        id="anthropic",
        name="Anthropic",
        base_url="https://api.anthropic.com/v1",
        env_key="ANTHROPIC_API_KEY",
        protocol="anthropic",
    )
    registered = registry.register(new_provider)
    assert registered.id == "anthropic"

    fetched = registry.get("anthropic")
    assert fetched.name == "Anthropic"
    assert fetched.base_url == "https://api.anthropic.com/v1"


def test_registry_duplicate_registration_error():
    registry = ProviderRegistry(seed_defaults=False)
    provider = Provider(
        id="test-provider",
        name="Test",
        base_url="https://api.test.com",
    )
    registry.register(provider)

    with pytest.raises(ProviderAlreadyExistsError):
        registry.register(provider)


def test_registry_get_not_found():
    registry = ProviderRegistry(seed_defaults=False)
    with pytest.raises(ProviderNotFoundError):
        registry.get("non-existent-provider")
