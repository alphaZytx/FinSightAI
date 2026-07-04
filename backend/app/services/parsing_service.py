from pathlib import Path
import fitz


class ParsingService:
    def parse_pdf_pages(self, file_path: str) -> list[dict]:
        pages: list[dict] = []
        with fitz.open(file_path) as doc:
            for idx, page in enumerate(doc, start=1):
                pages.append({"page": idx, "text": page.get_text("text")})
        return pages
