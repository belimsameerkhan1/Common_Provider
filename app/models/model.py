from typing import Optional
from pydantic import BaseModel, Field


class ModelCapabilities(BaseModel):
    vision: bool = False
    tools: bool = False
    reasoning: bool = False


class Model(BaseModel):
    id: str
    name: str
    provider: str
    context_window: Optional[int] = Field(
        default=None,
        description="Maximum context window tokens",
        examples=[128000],
    )
    capabilities: ModelCapabilities = Field(
        default_factory=ModelCapabilities,
        description="Feature capabilities supported by the model",
    )
