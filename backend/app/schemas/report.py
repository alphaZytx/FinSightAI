from pydantic import BaseModel


class ReportRequest(BaseModel):
    workspace_id: str
    title: str
    company_names: list[str] = []
    sections: list[str] = []
