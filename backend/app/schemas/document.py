from pydantic import BaseModel


class DocumentRecord(BaseModel):
    id: str
    workspace_id: str
    company_name: str
    fiscal_year: str
    document_type: str
    file_name: str
    status: str
