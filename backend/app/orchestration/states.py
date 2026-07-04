from typing import TypedDict, Any


class AgentState(TypedDict, total=False):
    workspace_id: str
    document_id: str
    user_question: str
    results: dict[str, Any]
