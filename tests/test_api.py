import pytest
from fastapi.testclient import TestClient
from app.main import app, registry


@pytest.fixture(autouse=True)
def reset_registry():
    """Reset registry to clean state before each test."""
    registry.reset(seed_defaults=True)
    yield


@pytest.fixture
def client():
    return TestClient(app)


def test_root_endpoint(client):
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert "endpoints" in data


def test_list_providers(client):
    response = client.get("/providers")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    ids = [p["id"] for p in data]
    assert "openai" in ids
    assert "ollama" in ids


def test_get_single_provider(client):
    response = client.get("/providers/openai")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == "openai"
    assert data["name"] == "OpenAI"
    assert data["protocol"] == "openai"


def test_get_provider_not_found(client):
    response = client.get("/providers/non-existent-provider")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_register_provider_success(client):
    new_provider_payload = {
        "id": "groq",
        "name": "Groq Fast Inference",
        "base_url": "https://api.groq.com/openai/v1",
        "env_key": "GROQ_API_KEY",
        "protocol": "openai",
        "models": [],
        "headers": {"X-Custom": "TestHeader"},
    }
    response = client.post("/providers", json=new_provider_payload)
    assert response.status_code == 201
    data = response.json()
    assert data["id"] == "groq"
    assert data["name"] == "Groq Fast Inference"

    # Verify provider now appears in list
    list_resp = client.get("/providers")
    provider_ids = [p["id"] for p in list_resp.json()]
    assert "groq" in provider_ids


def test_register_duplicate_provider_conflict(client):
    duplicate_payload = {
        "id": "openai",
        "name": "Duplicate OpenAI",
        "base_url": "https://api.openai.com/v1",
    }
    response = client.post("/providers", json=duplicate_payload)
    assert response.status_code == 409
    assert "already registered" in response.json()["detail"].lower()


def test_discover_models_for_openai(client):
    response = client.get("/providers/openai/models")
    assert response.status_code == 200
    models = response.json()
    assert isinstance(models, list)
    assert len(models) > 0
    first_model = models[0]
    assert "id" in first_model
    assert "name" in first_model
    assert "provider" in first_model
    assert "capabilities" in first_model
    assert first_model["provider"] == "openai"


def test_discover_models_for_ollama(client):
    response = client.get("/providers/ollama/models")
    assert response.status_code == 200
    models = response.json()
    assert isinstance(models, list)
    assert len(models) > 0
    ids = [m["id"] for m in models]
    assert any("llama" in m_id or "mistral" in m_id for m_id in ids)


def test_discover_models_provider_not_found(client):
    response = client.get("/providers/unknown-provider/models")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_register_and_discover_custom_provider(client):
    payload = {
        "id": "deepseek-custom",
        "name": "DeepSeek API",
        "base_url": "https://api.deepseek.com",
        "protocol": "static",
        "models": [
            {
                "id": "deepseek-chat",
                "name": "DeepSeek V3",
                "provider": "deepseek-custom",
                "context_window": 64000,
                "capabilities": {
                    "vision": False,
                    "tools": True,
                    "reasoning": False,
                },
            },
            {
                "id": "deepseek-reasoner",
                "name": "DeepSeek R1",
                "provider": "deepseek-custom",
                "context_window": 64000,
                "capabilities": {
                    "vision": False,
                    "tools": True,
                    "reasoning": True,
                },
            },
        ],
    }
    create_resp = client.post("/providers", json=payload)
    assert create_resp.status_code == 201

    models_resp = client.get("/providers/deepseek-custom/models")
    assert models_resp.status_code == 200
    models = models_resp.json()
    assert len(models) == 2
    assert models[0]["id"] == "deepseek-chat"
    assert models[1]["capabilities"]["reasoning"] is True
