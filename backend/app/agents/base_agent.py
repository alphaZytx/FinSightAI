from typing import Any

from pydantic import BaseModel, Field


class AgentResult(BaseModel):
    agent_name: str
    status: str
    output: dict[str, Any] = Field(default_factory=dict)
    errors: list[str] = Field(default_factory=list)


class BaseAgent:
    name = "BaseAgent"
    description = "Base class for all agents."

    async def run(self, state: dict) -> AgentResult:
        raise NotImplementedError
