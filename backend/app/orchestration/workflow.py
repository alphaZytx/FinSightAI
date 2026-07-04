from app.agents.document_agent import DocumentAgent
from app.agents.extraction_agent import ExtractionAgent
from app.agents.red_flag_agent import RedFlagAgent


class AgentWorkflow:
    def __init__(self) -> None:
        self.document_agent = DocumentAgent()
        self.extraction_agent = ExtractionAgent()
        self.red_flag_agent = RedFlagAgent()

    async def run_document_pipeline(self, document_id: str) -> dict:
        state = {"document_id": document_id, "results": {}}
        doc_result = await self.document_agent.run(state)
        state["results"]["document"] = doc_result.model_dump()
        if doc_result.status != "success":
            return state

        extraction_result = await self.extraction_agent.run(state)
        state["results"]["extraction"] = extraction_result.model_dump()

        red_flag_result = await self.red_flag_agent.run(state)
        state["results"]["red_flags"] = red_flag_result.model_dump()
        return state
