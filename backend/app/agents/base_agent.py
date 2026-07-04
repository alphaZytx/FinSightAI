from typing import Any
from pydantic import BaseModel


class AgentResult(BaseModel):
    agent_name: str
    status: str
    output: dict[str, Any] = {}
    errors: list[str] = []


class BaseAgent:
    name = "BaseAgent"
    description = "Base class for all agents."

    async def run(self, state: dict) -> AgentResult:
        raise NotImplementedError
