from pathlib import Path
from textwrap import wrap
from uuid import uuid4

from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from app.core.config import settings


class PDFReportService:
    def generate_simple_report(self, title: str, sections: list[dict]) -> str:
        report_dir = Path(settings.REPORT_DIR)
        report_dir.mkdir(parents=True, exist_ok=True)
        path = report_dir / f"report_{uuid4().hex[:12]}.pdf"
        c = canvas.Canvas(str(path), pagesize=A4)
        width, height = A4
        y = height - 72
        c.setTitle(title[:120])
        c.setFont("Helvetica-Bold", 16)
        c.drawString(72, y, title[:80])
        y -= 36
        for section in sections:
            y = self._ensure_space(c, y, height, 42)
            c.setFont("Helvetica-Bold", 12)
            c.drawString(72, y, str(section.get("heading", "Section"))[:90])
            y -= 20
            c.setFont("Helvetica", 10)
            content = str(section.get("content", "")) or "No content available."
            for paragraph in content.splitlines() or [content]:
                for line in wrap(paragraph, width=96) or [""]:
                    y = self._ensure_space(c, y, height, 18)
                    c.drawString(72, y, line)
                    y -= 14
                y -= 4
            y -= 10
        c.save()
        return str(path)

    def _ensure_space(self, c: canvas.Canvas, y: float, height: float, needed: float) -> float:
        if y - needed >= 72:
            return y
        c.showPage()
        return height - 72