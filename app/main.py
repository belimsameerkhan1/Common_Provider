from typing import List
from fastapi import FastAPI, HTTPException, status
from fastapi.responses import JSONResponse

from app.models.model import Model
from app.models.provider import Provider, ProviderCreate
from app.services.registry import (
    ProviderRegistry,
    ProviderAlreadyExistsError,
    ProviderNotFoundError,
)
from app.services.discovery import ModelDiscoveryService

from fastapi.middleware.cors import CORSMiddleware

# Initialize FastAPI application
app = FastAPI(
    title="Common Provider Configuration & Model Discovery Service",
    description="Unified API for multi-provider LLM configurations and dynamic model discovery.",
    version="1.0.0",
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory service instances
registry = ProviderRegistry()
discovery_service = ModelDiscoveryService()


@app.get("/", tags=["Health"])
def root():
    """Service status and quick links."""
    return {
        "status": "online",
        "service": "Common Provider Configuration & Model Discovery Service",
        "docs_url": "/docs",
        "endpoints": {
            "list_providers": "GET /providers",
            "get_provider": "GET /providers/{provider_id}",
            "register_provider": "POST /providers",
            "discover_models": "GET /providers/{provider_id}/models",
        },
    }


@app.get("/providers", response_model=List[Provider], tags=["Providers"])
def list_providers():
    """List all registered LLM providers."""
    return registry.list_all()


@app.get("/providers/{provider_id}", response_model=Provider, tags=["Providers"])
def get_provider(provider_id: str):
    """Retrieve details for a specific provider by its ID."""
    try:
        return registry.get(provider_id)
    except ProviderNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        )


@app.post(
    "/providers",
    response_model=Provider,
    status_code=status.HTTP_201_CREATED,
    tags=["Providers"],
)
def register_provider(provider_in: ProviderCreate):
    """Register a new LLM provider."""
    try:
        new_provider = Provider(**provider_in.model_dump())
        return registry.register(new_provider)
    except ProviderAlreadyExistsError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        )


@app.get(
    "/providers/{provider_id}/models",
    response_model=List[Model],
    tags=["Models"],
)
async def get_provider_models(provider_id: str):
    """Discover available models for a given provider."""
    try:
        provider = registry.get(provider_id)
    except ProviderNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        )

    models = await discovery_service.discover_models(provider)
    return models
