from typing import Dict, List, Optional
from pydantic import BaseModel, Field
from app.models.model import Model


class ProviderBase(BaseModel):
    id: str = Field(..., description="Unique provider identifier, e.g. 'openai'")
    name: str = Field(..., description="Human-friendly provider name, e.g. 'OpenAI'")
    base_url: str = Field(..., description="API endpoint root URL")
    env_key: Optional[str] = Field(
        default=None,
        description="Environment variable name for authentication key, e.g. 'OPENAI_API_KEY'",
    )
    protocol: str = Field(
        default="openai",
        description="Wire protocol / adapter key, e.g. 'openai', 'ollama', 'static'",
    )
    models: Optional[List[Model]] = Field(
        default_factory=list,
        description="Predefined or static models associated with this provider",
    )
    headers: Optional[Dict[str, str]] = Field(
        default_factory=dict,
        description="Optional custom HTTP headers for provider requests",
    )


class ProviderCreate(ProviderBase):
    pass


class Provider(ProviderBase):
    pass
