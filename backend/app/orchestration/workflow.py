from app.agents.comparison_agent import ComparisonAgent
from app.agents.document_agent import DocumentAgent
from app.agents.extraction_agent import ExtractionAgent
from app.agents.red_flag_agent import RedFlagAgent


class AgentWorkflow:
    """Coordinates document-triggered work and exposes workspace-level analysis."""

    def __init__(self) -> None:
        self.document_agent = DocumentAgent()
        self.extraction_agent = ExtractionAgent()
        self.red_flag_agent = RedFlagAgent()
        self.comparison_agent = ComparisonAgent()

    async def run_document_pipeline(self, document_id: str) -> dict:
        state = {"document_id": document_id, "results": {}}
        document_result = await self.document_agent.run(state)
        state["results"]["document"] = document_result.model_dump()
        if document_result.status != "success":
            return state

        state["workspace_id"] = document_result.output.get("workspace_id")
        extraction_result = await self.extraction_agent.run(state)
        state["results"]["extraction"] = extraction_result.model_dump()

        red_flag_result = await self.red_flag_agent.run(state)
        state["results"]["red_flags"] = red_flag_result.model_dump()

        if state["workspace_id"]:
            comparison_result = await self.comparison_agent.run(state)
            state["results"]["comparison"] = comparison_result.model_dump()
        return state

    async def run_workspace_comparison(self, workspace_id: str) -> dict:
        return (await self.comparison_agent.run({"workspace_id": workspace_id})).model_dump()
