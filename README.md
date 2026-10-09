# Common Provider Configuration & Model Discovery Service

A clean, lightweight, and extensible FastAPI microservice providing a **unified LLM provider configuration registry** and **dynamic model discovery**.

---

## 1. Project Purpose

Modern AI coding agents and LLM applications need to interact with diverse providers (OpenAI, Ollama, Anthropic, local vLLM, custom gateways). However:
- Every provider uses different discovery endpoints and formats.
- Credentials and base URLs should be flexibly configured without hardcoding.
- Applications need a single normalized representation of models and capabilities (such as tool calling, vision, and reasoning).

This service delivers an MVP solution:
1. **Provider Configuration Registry**: A centralized registry to configure and manage LLM providers (`id`, `name`, `base_url`, `env_key`, `protocol`, `headers`).
2. **Model Discovery Service**: A protocol-driven abstraction that discovers available models via live APIs when available, and gracefully falls back to static/mock catalogs when offline or without paid API keys.
3. **Normalized Model Representation**: Standardized model metadata including context window size and capability flags (`vision`, `tools`, `reasoning`).

---

## 2. Architecture & Project Structure

### Architecture Flow

```
+-----------------------------------------------------------+
|                       HTTP Clients                        |
|             (cURL, Frontend, Agent Workflows)             |
+-----------------------------------------------------------+
                             |
                             v
+-----------------------------------------------------------+
|                   FastAPI Router (main.py)                |
|      GET /providers               POST /providers         |
|      GET /providers/{id}          GET /providers/{id}/models|
+-----------------------------------------------------------+
              |                                     |
              v                                     v
+---------------------------+        +------------------------------+
|      ProviderRegistry     |        |    ModelDiscoveryService     |
|   (In-Memory Provider DB) |        |    (Protocol Router)         |
+---------------------------+        +------------------------------+
                                                    |
                   +--------------------------------+--------------------+
                   |                                |                    |
                   v                                v                    v
        +--------------------+           +--------------------+  +---------------+
        |  OpenAIDiscoverer  |           |  OllamaDiscoverer  |  |StaticDiscoverer|
        | protocol: "openai" |           | protocol: "ollama" |  | protocol:     |
        | /v1/models + mock  |           | /api/tags + mock   |  |  "static"     |
        +--------------------+           +--------------------+  +---------------+
```

### Directory Structure

```text
commonprovider/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI application and route handlers
│   ├── models/                 # Domain Pydantic schemas
│   │   ├── __init__.py
│   │   ├── model.py            # Model & ModelCapabilities schema
│   │   └── provider.py         # Provider & ProviderCreate schema
│   ├── providers/              # Provider-specific model discoverers
│   │   ├── __init__.py
│   │   ├── base.py             # BaseDiscoverer abstract interface
│   │   ├── openai.py           # OpenAI wire protocol discoverer
│   │   ├── ollama.py           # Ollama local protocol discoverer
│   │   └── static.py           # Static / fallback discoverer
│   └── services/               # Core business services
│       ├── __init__.py
│       ├── registry.py         # In-memory ProviderRegistry
│       └── discovery.py        # ModelDiscoveryService coordinator
├── frontend/                   # Minimalist React + Vite + TypeScript dashboard
│   ├── src/
│   │   ├── components/         # Dashboard, Providers, Models, Sidebar components
│   │   ├── services/           # Typed API service client
│   │   ├── types/              # Matching schema interfaces
│   │   ├── App.tsx             # Root dashboard state coordinator
│   │   ├── App.css             # Developer-tool monochrome styling
│   │   └── index.css           # Design tokens & typography reset
│   ├── package.json
│   └── vite.config.ts          # Dev proxy routing to :8000
├── tests/
│   ├── __init__.py
│   ├── test_api.py             # Full FastAPI HTTP endpoint tests
│   ├── test_discovery.py       # Model discoverer & protocol routing tests
│   └── test_registry.py        # Provider registry unit tests
├── requirements.txt            # Python dependencies
├── Procfile                    # Render/cloud deployment command
├── .gitignore                  # Git ignore rules
└── README.md                   # Documentation and guide
```

---

## 3. Setup & Installation

### Prerequisites
- Python 3.10+ (tested on Python 3.11)
- Node.js 18+ & npm 9+ (tested on Node 22)

### 1. Backend Installation
```bash
# In repository root
pip install -r requirements.txt
```

### 2. Frontend Installation
```bash
cd frontend
npm install
cd ..
```

---

## 4. How to Run Locally

### Step 1: Start the FastAPI Backend
From the repository root:

```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

- **Backend API**: [http://127.0.0.1:8000/](http://127.0.0.1:8000/)
- **Swagger Documentation**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **ReDoc Documentation**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

### Step 2: Start the Frontend Dashboard
In a second terminal:

```bash
cd frontend
npm run dev
```

- **Frontend Dashboard**: [http://localhost:5173/](http://localhost:5173/)

*(The Vite development server is configured with a built-in proxy forwarding `/providers`, `/docs`, and `/openapi.json` directly to the backend at `http://127.0.0.1:8000`).*

---

## 5. Deployment Considerations

### Backend (Render / Cloud Platform)
- **Environment**: Python 3
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- The repository includes a [Procfile](file:///c:/Users/SAMEER/Project/commonprovider/Procfile) which Render and compatible PaaS platforms automatically detect.
- Environment variables: Optional provider keys (e.g. `OPENAI_API_KEY`, `GROQ_API_KEY`) can be set as secret environment variables on the hosting platform.

### Frontend (Vercel / Netlify / Render Static Site)
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Publish Directory**: `frontend/dist`
- **Environment Variable**: Set `VITE_API_BASE_URL` to your deployed backend URL (e.g. `https://your-commonprovider.onrender.com`). If hosted on the same domain behind a reverse proxy, leave unset to use relative paths.

---

## 6. API Endpoints & Examples

### 1. Root Status
- **Method**: `GET /`
- **Description**: Returns service health and quick navigation links.

**Response (200 OK):**
```json
{
  "status": "online",
  "service": "Common Provider Configuration & Model Discovery Service",
  "docs_url": "/docs",
  "endpoints": {
    "list_providers": "GET /providers",
    "get_provider": "GET /providers/{provider_id}",
    "register_provider": "POST /providers",
    "discover_models": "GET /providers/{provider_id}/models"
  }
}
```

---

### 2. List Providers
- **Method**: `GET /providers`
- **Description**: Lists all registered providers. Out-of-the-box, default configurations for `openai` and `ollama` are pre-seeded.

**Response (200 OK):**
```json
[
  {
    "id": "openai",
    "name": "OpenAI",
    "base_url": "https://api.openai.com/v1",
    "env_key": "OPENAI_API_KEY",
    "protocol": "openai",
    "models": [],
    "headers": {
      "User-Agent": "common-provider-service/1.0"
    }
  },
  {
    "id": "ollama",
    "name": "Ollama Local",
    "base_url": "http://localhost:11434",
    "env_key": null,
    "protocol": "ollama",
    "models": [],
    "headers": {}
  }
]
```

---

### 3. Get Provider Details
- **Method**: `GET /providers/{provider_id}`
- **Description**: Retrieve a specific provider by ID. Returns `404 Not Found` if provider does not exist.

**Example Request:**
```bash
curl http://127.0.0.1:8000/providers/openai
```

**Response (200 OK):**
```json
{
  "id": "openai",
  "name": "OpenAI",
  "base_url": "https://api.openai.com/v1",
  "env_key": "OPENAI_API_KEY",
  "protocol": "openai",
  "models": [],
  "headers": {
    "User-Agent": "common-provider-service/1.0"
  }
}
```

---

### 4. Register a Provider
- **Method**: `POST /providers`
- **Description**: Registers a new provider. Returns `201 Created` or `409 Conflict` if duplicate ID.

**Example Request:**
```bash
curl -X POST http://127.0.0.1:8000/providers \
  -H "Content-Type: application/json" \
  -d '{
    "id": "groq",
    "name": "Groq Cloud",
    "base_url": "https://api.groq.com/openai/v1",
    "env_key": "GROQ_API_KEY",
    "protocol": "openai",
    "headers": {
      "X-Custom-Routing": "true"
    }
  }'
```

**Response (201 Created):**
```json
{
  "id": "groq",
  "name": "Groq Cloud",
  "base_url": "https://api.groq.com/openai/v1",
  "env_key": "GROQ_API_KEY",
  "protocol": "openai",
  "models": [],
  "headers": {
    "X-Custom-Routing": "true"
  }
}
```

---

### 5. Discover Models
- **Method**: `GET /providers/{provider_id}/models`
- **Description**: Triggers model discovery for the provider according to its wire protocol.

**Example Request:**
```bash
curl http://127.0.0.1:8000/providers/openai/models
```

**Response (200 OK):**
```json
[
  {
    "id": "gpt-4o",
    "name": "GPT-4o Omnimodal",
    "provider": "openai",
    "context_window": 128000,
    "capabilities": {
      "vision": true,
      "tools": true,
      "reasoning": true
    }
  },
  {
    "id": "gpt-4o-mini",
    "name": "GPT-4o Mini",
    "provider": "openai",
    "context_window": 128000,
    "capabilities": {
      "vision": true,
      "tools": true,
      "reasoning": false
    }
  },
  {
    "id": "o1-preview",
    "name": "OpenAI o1 Reasoning",
    "provider": "openai",
    "context_window": 128000,
    "capabilities": {
      "vision": false,
      "tools": false,
      "reasoning": true
    }
  },
  {
    "id": "gpt-3.5-turbo",
    "name": "GPT-3.5 Turbo",
    "provider": "openai",
    "context_window": 16385,
    "capabilities": {
      "vision": false,
      "tools": true,
      "reasoning": false
    }
  }
]
```

---

## 7. How Provider Configuration Works

1. **Environment-Driven Credentials**:
   Rather than storing sensitive API keys in configs or memory, each provider specifies an `env_key` (e.g. `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`). The service accesses `os.getenv(provider.env_key)` only when making external requests.
2. **Wire Protocol Abstraction**:
   The `protocol` field specifies how the service communicates with the provider (`"openai"`, `"ollama"`, `"static"`). Custom endpoints that mimic the OpenAI wire format (like Groq, DeepSeek, or vLLM) simply specify `"protocol": "openai"` alongside their custom `base_url`.
3. **Custom Headers & Options**:
   Optional `headers` allow injecting authorization headers, organization IDs, or routing proxy flags.
4. **Predefined Models**:
   Providers can optionally specify static `models` in their configuration. If specified, these take precedence or serve as an offline catalog.

---

## 8. How Model Discovery Works

Model discovery is abstracted through the `BaseDiscoverer` interface:

```python
class BaseDiscoverer(ABC):
    @abstractmethod
    async def discover(self, provider: Provider) -> List[Model]:
        pass
```

The discovery workflow follows a robust hierarchy:
1. **Predefined Override**: If the provider configuration explicitly includes static models in `provider.models`, they are returned directly.
2. **Live API Discovery**:
   - For `protocol="openai"`: Queries `GET {base_url}/models` with Bearer auth.
   - For `protocol="ollama"`: Queries `GET {base_url}/api/tags`.
3. **Graceful Static Fallback**:
   - If the API key is not set, network requests fail, or the local daemon is offline, the discoverer returns a curated default catalog.
   - **Benefit**: Demonstrating and testing the entire system requires **zero paid API keys and zero active local servers**.
4. **Normalized Capabilities**:
   - The discoverer infers and standardizes model capabilities (`vision`, `tools`, `reasoning`) and token context limits into a single uniform `Model` schema.

---

## 9. How to Add Another Provider

Adding a new provider protocol takes only 3 simple steps:

### Step 1: Implement the Discoverer
Create a class implementing `BaseDiscoverer` in `app/providers/`:

```python
from app.providers.base import BaseDiscoverer
from app.models.model import Model, ModelCapabilities
from app.models.provider import Provider

class AnthropicDiscoverer(BaseDiscoverer):
    async def discover(self, provider: Provider) -> list[Model]:
        # Perform live discovery or return catalog
        return [
            Model(
                id="claude-3-7-sonnet",
                name="Claude 3.7 Sonnet",
                provider=provider.id,
                context_window=200000,
                capabilities=ModelCapabilities(vision=True, tools=True, reasoning=True),
            )
        ]
```

### Step 2: Register in `ModelDiscoveryService`
In `app/services/discovery.py`:

```python
self.register_discoverer("anthropic", AnthropicDiscoverer())
```

### Step 3: Register the Provider via API
Send a `POST /providers` request:

```bash
curl -X POST http://127.0.0.1:8000/providers \
  -H "Content-Type: application/json" \
  -d '{
    "id": "anthropic",
    "name": "Anthropic",
    "base_url": "https://api.anthropic.com/v1",
    "env_key": "ANTHROPIC_API_KEY",
    "protocol": "anthropic"
  }'
```

Now `GET /providers/anthropic/models` will automatically discover Anthropic models!

---

## 10. Design Decisions

- **In-Memory Registry**: Kept minimal with an in-memory dictionary. No unnecessary database (Postgres, SQLite) or ORM overhead for an MVP.
- **Fail-Safe Discovery**: Every discoverer includes static fallback behavior so unit tests and demonstrations run without requiring paid API keys or active background daemons.
- **Protocol Decoupling**: Separation of `Provider` configuration from `Model` discovery allows any OpenAI-compatible provider (Groq, Together, DeepSeek, vLLM) to reuse the `OpenAIDiscoverer` simply by setting `"protocol": "openai"`.
- **Zero-Dependency Tests**: All unit and integration tests execute directly with standard pytest and standard library `asyncio`.

---

## 11. Research Basis

This architecture was informed by analyzing common patterns across production AI developer tools:

1. **Qwen Code**:
   - Separation of provider configuration and model discovery.
   - Centralized model registry and protocol/API abstraction.
   - Credentials resolved dynamically via environment variables (`env_key`).
2. **Claude Code**:
   - Configuration-driven provider selection.
   - Support for custom base URLs (`base_url`) allowing switching between cloud and proxy gateways.
   - Clean provider routing.
3. **OpenAI Codex**:
   - `model_providers` schema separating provider identity, endpoint, and wire API protocol.
   - Support for custom and self-hosted providers.

*(Note: The implementation was built from scratch to meet the core architectural principles of these systems without copying their proprietary code.)*

---

## 12. Running the Test Suite

Run all unit and integration tests using `pytest`:

```bash
python -m pytest -v
```

### Test Coverage Highlights:
- Provider registration, retrieval, listing, and duplicate validation.
- OpenAI protocol discovery (API parsing and fallback).
- Ollama protocol discovery (API parsing and fallback).
- Custom static provider registration and discovery.
- 404 and 409 error handling across all HTTP endpoints.
