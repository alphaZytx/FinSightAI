"""Professional PDF report generation for FinSightAI.

Uses reportlab's platypus framework for structured, styled documents
instead of raw canvas drawing.
"""

from datetime import datetime
from pathlib import Path
from uuid import uuid4

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch, mm
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    NextPageTemplate,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)

from app.core.config import settings

# ── Colour palette ────────────────────────────────────────────────
PRIMARY = colors.HexColor("#4F46E5")       # Indigo-600
PRIMARY_LIGHT = colors.HexColor("#818CF8") # Indigo-400
PRIMARY_BG = colors.HexColor("#EEF2FF")    # Indigo-50
DARK = colors.HexColor("#111827")           # Gray-900
GRAY_700 = colors.HexColor("#374151")
GRAY_500 = colors.HexColor("#6B7280")
GRAY_300 = colors.HexColor("#D1D5DB")
GRAY_100 = colors.HexColor("#F3F4F6")
WHITE = colors.white
RED = colors.HexColor("#DC2626")
AMBER = colors.HexColor("#D97706")
EMERALD = colors.HexColor("#059669")

SEVERITY_COLORS = {
    "critical": colors.HexColor("#DC2626"),
    "high": colors.HexColor("#EA580C"),
    "medium": colors.HexColor("#D97706"),
    "low": colors.HexColor("#6B7280"),
}

PAGE_WIDTH, PAGE_HEIGHT = A4
LEFT_MARGIN = 60
RIGHT_MARGIN = 60
TOP_MARGIN = 60
BOTTOM_MARGIN = 60


def _build_styles() -> dict:
    """Build a complete set of paragraph styles for the report."""
    base = getSampleStyleSheet()
    styles = {}

    styles["title"] = ParagraphStyle(
        "ReportTitle",
        parent=base["Title"],
        fontName="Helvetica-Bold",
        fontSize=22,
        leading=28,
        textColor=DARK,
        spaceAfter=6,
    )
    styles["subtitle"] = ParagraphStyle(
        "ReportSubtitle",
        parent=base["Normal"],
        fontName="Helvetica",
        fontSize=11,
        leading=14,
        textColor=GRAY_500,
        spaceAfter=20,
    )
    styles["heading"] = ParagraphStyle(
        "SectionHeading",
        parent=base["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=14,
        leading=18,
        textColor=PRIMARY,
        spaceBefore=20,
        spaceAfter=10,
        borderWidth=0,
        borderPadding=0,
    )
    styles["body"] = ParagraphStyle(
        "BodyText",
        parent=base["Normal"],
        fontName="Helvetica",
        fontSize=9.5,
        leading=14,
        textColor=DARK,
        alignment=TA_JUSTIFY,
        spaceAfter=8,
    )
    styles["body_bold"] = ParagraphStyle(
        "BodyBold",
        parent=styles["body"],
        fontName="Helvetica-Bold",
    )
    styles["bullet"] = ParagraphStyle(
        "Bullet",
        parent=styles["body"],
        leftIndent=18,
        bulletIndent=6,
        spaceAfter=4,
    )
    styles["citation"] = ParagraphStyle(
        "Citation",
        parent=base["Normal"],
        fontName="Courier",
        fontSize=7.5,
        leading=10,
        textColor=GRAY_500,
        spaceAfter=3,
    )
    styles["footer"] = ParagraphStyle(
        "Footer",
        parent=base["Normal"],
        fontName="Helvetica",
        fontSize=7,
        leading=9,
        textColor=GRAY_500,
        alignment=TA_CENTER,
    )
    styles["page_number"] = ParagraphStyle(
        "PageNumber",
        parent=base["Normal"],
        fontName="Helvetica",
        fontSize=8,
        textColor=GRAY_500,
        alignment=TA_RIGHT,
    )
    styles["cover_title"] = ParagraphStyle(
        "CoverTitle",
        parent=base["Title"],
        fontName="Helvetica-Bold",
        fontSize=28,
        leading=36,
        textColor=DARK,
        alignment=TA_LEFT,
        spaceAfter=12,
    )
    styles["cover_subtitle"] = ParagraphStyle(
        "CoverSubtitle",
        parent=base["Normal"],
        fontName="Helvetica",
        fontSize=12,
        leading=16,
        textColor=GRAY_500,
        alignment=TA_LEFT,
        spaceAfter=6,
    )
    styles["toc_item"] = ParagraphStyle(
        "TOCItem",
        parent=base["Normal"],
        fontName="Helvetica",
        fontSize=10,
        leading=18,
        textColor=DARK,
        leftIndent=10,
    )
    return styles


class PDFReportService:
    """Generate professionally styled analyst PDF reports."""

    def generate_simple_report(self, title: str, sections: list[dict]) -> str:
        report_dir = Path(settings.REPORT_DIR)
        report_dir.mkdir(parents=True, exist_ok=True)
        path = report_dir / f"report_{uuid4().hex[:12]}.pdf"
        styles = _build_styles()

        # Build the document with page templates
        doc = BaseDocTemplate(
            str(path),
            pagesize=A4,
            leftMargin=LEFT_MARGIN,
            rightMargin=RIGHT_MARGIN,
            topMargin=TOP_MARGIN,
            bottomMargin=BOTTOM_MARGIN,
            title=title[:120],
            author="FinSightAI",
        )

        frame_width = PAGE_WIDTH - LEFT_MARGIN - RIGHT_MARGIN
        frame_height = PAGE_HEIGHT - TOP_MARGIN - BOTTOM_MARGIN

        # Cover page frame (no header/footer decorations)
        cover_frame = Frame(LEFT_MARGIN, BOTTOM_MARGIN, frame_width, frame_height, id="cover")
        cover_template = PageTemplate(id="cover", frames=[cover_frame], onPage=self._cover_page_decorator)

        # Content page frame
        content_frame = Frame(LEFT_MARGIN, BOTTOM_MARGIN + 20, frame_width, frame_height - 20, id="content")
        content_template = PageTemplate(id="content", frames=[content_frame], onPage=self._content_page_decorator)

        doc.addPageTemplates([cover_template, content_template])

        # Build flowables
        story = []

        # ── Cover Page ──
        story.append(Spacer(1, 160))
        story.append(Paragraph("FinSightAI", styles["subtitle"]))
        story.append(Spacer(1, 8))
        story.append(Paragraph(self._escape(title[:100]), styles["cover_title"]))
        story.append(Spacer(1, 12))
        story.append(Paragraph(f"Generated {datetime.now().strftime('%B %d, %Y at %I:%M %p')}", styles["cover_subtitle"]))
        story.append(Paragraph("Confidential — For Internal Use Only", styles["cover_subtitle"]))
        story.append(Spacer(1, 40))

        # Accent line on cover
        accent_table = Table([[""]], colWidths=[80])
        accent_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), PRIMARY),
            ("LINEBELOW", (0, 0), (-1, -1), 3, PRIMARY),
            ("TOPPADDING", (0, 0), (-1, -1), 0),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
        ]))
        story.append(accent_table)

        # ── Table of Contents ──
        story.append(NextPageTemplate("content"))
        story.append(PageBreak())
        story.append(Paragraph("Table of Contents", styles["heading"]))
        story.append(Spacer(1, 10))
        for idx, section in enumerate(sections, 1):
            heading = section.get("heading", f"Section {idx}")
            story.append(Paragraph(f"{idx}. &nbsp;&nbsp;{self._escape(heading)}", styles["toc_item"]))
        story.append(Spacer(1, 20))

        # Divider line
        divider = Table([[""]], colWidths=[frame_width])
        divider.setStyle(TableStyle([
            ("LINEBELOW", (0, 0), (-1, -1), 0.5, GRAY_300),
            ("TOPPADDING", (0, 0), (-1, -1), 0),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
        ]))

        # ── Report Sections ──
        for section in sections:
            heading = section.get("heading", "Section")
            content = str(section.get("content", "")) or "No content available."

            story.append(Spacer(1, 6))

            # Section heading with accent bar
            heading_table = Table(
                [[Paragraph(self._escape(heading), styles["heading"])]],
                colWidths=[frame_width],
            )
            heading_table.setStyle(TableStyle([
                ("LEFTPADDING", (0, 0), (-1, -1), 10),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("LINEBELOW", (0, 0), (-1, -1), 1.5, PRIMARY_LIGHT),
            ]))
            story.append(heading_table)
            story.append(Spacer(1, 8))

            # Determine section type for special formatting
            heading_lower = heading.lower()

            if "citation" in heading_lower or "appendix" in heading_lower:
                # Citation appendix — monospaced, compact
                for line in content.splitlines():
                    line = line.strip()
                    if line:
                        story.append(Paragraph(self._escape(line), styles["citation"]))
            elif "red flag" in heading_lower or "risk" in heading_lower:
                # Risk section — color-coded severity
                self._add_risk_content(story, content, styles, frame_width)
            else:
                # Standard narrative section
                self._add_body_content(story, content, styles)

            story.append(Spacer(1, 8))
            story.append(divider)

        # ── Disclaimer footer ──
        story.append(Spacer(1, 30))
        disclaimer = (
            "<i>This report was generated by FinSightAI using AI-assisted analysis of uploaded financial documents. "
            "All findings are source-grounded and should be independently verified before making investment decisions. "
            "This document is confidential and intended for internal research purposes only.</i>"
        )
        story.append(Paragraph(disclaimer, styles["citation"]))

        doc.build(story)
        return str(path)

    def _add_body_content(self, story: list, content: str, styles: dict) -> None:
        """Add formatted body paragraphs, handling bullet points and emphasis."""
        for paragraph in content.splitlines():
            paragraph = paragraph.strip()
            if not paragraph:
                continue

            if paragraph.startswith(("- ", "• ", "* ")):
                # Bullet point
                bullet_text = paragraph.lstrip("-•* ").strip()
                story.append(Paragraph(f"•&nbsp;&nbsp;{self._escape(bullet_text)}", styles["bullet"]))
            elif paragraph.startswith(("#", "##", "###")):
                # Sub-heading within content — make bold
                heading_text = paragraph.lstrip("# ").strip()
                story.append(Spacer(1, 6))
                story.append(Paragraph(f"<b>{self._escape(heading_text)}</b>", styles["body_bold"]))
            else:
                # Regular paragraph — apply inline formatting
                formatted = self._format_inline(paragraph)
                story.append(Paragraph(formatted, styles["body"]))

    def _add_risk_content(self, story: list, content: str, styles: dict, frame_width: float) -> None:
        """Add risk items with severity-colored indicators."""
        for line in content.splitlines():
            line = line.strip()
            if not line:
                continue

            # Try to parse severity tag
            severity = "medium"
            for sev in ("critical", "high", "medium", "low"):
                if f"[{sev.upper()}]" in line:
                    severity = sev
                    line = line.replace(f"[{sev.upper()}]", "").strip()
                    break

            color = SEVERITY_COLORS.get(severity, GRAY_500)
            severity_label = severity.upper()

            # Build a styled risk row
            sev_style = ParagraphStyle(
                "SeverityLabel",
                fontName="Helvetica-Bold",
                fontSize=7,
                textColor=WHITE,
                alignment=TA_CENTER,
            )
            body_style = styles["body"]

            sev_cell = Paragraph(severity_label, sev_style)
            content_cell = Paragraph(self._format_inline(line), body_style)

            row_table = Table(
                [[sev_cell, content_cell]],
                colWidths=[55, frame_width - 65],
            )
            row_table.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (0, 0), color),
                ("BACKGROUND", (1, 0), (1, 0), GRAY_100),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ("ROUNDEDCORNERS", [3, 3, 3, 3]),
            ]))
            story.append(row_table)
            story.append(Spacer(1, 4))

    def _format_inline(self, text: str) -> str:
        """Convert markdown-ish inline formatting to reportlab XML tags."""
        text = self._escape(text)
        # Bold: **text** or __text__
        import re
        text = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", text)
        text = re.sub(r"__(.+?)__", r"<b>\1</b>", text)
        # Italic: *text* or _text_ (but not inside bold markers)
        text = re.sub(r"(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)", r"<i>\1</i>", text)
        # Citation references — make them stand out
        text = re.sub(r"\[S(\d+)\]", r'<font color="#4F46E5"><b>[S\1]</b></font>', text)
        return text

    def _escape(self, text: str) -> str:
        """Escape XML special characters for reportlab Paragraph."""
        return (
            text.replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
        )

    def _cover_page_decorator(self, canvas, doc):
        """Draw decorations on the cover page."""
        canvas.saveState()
        # Top accent stripe
        canvas.setFillColor(PRIMARY)
        canvas.rect(0, PAGE_HEIGHT - 8, PAGE_WIDTH, 8, fill=1, stroke=0)
        # Bottom accent stripe
        canvas.setFillColor(PRIMARY)
        canvas.rect(0, 0, PAGE_WIDTH, 4, fill=1, stroke=0)
        # Brand text bottom-right
        canvas.setFont("Helvetica", 7)
        canvas.setFillColor(GRAY_500)
        canvas.drawRightString(PAGE_WIDTH - LEFT_MARGIN, 20, "Powered by FinSightAI")
        canvas.restoreState()

    def _content_page_decorator(self, canvas, doc):
        """Draw header and footer decorations on content pages."""
        canvas.saveState()
        # Top accent line
        canvas.setStrokeColor(PRIMARY)
        canvas.setLineWidth(1.5)
        canvas.line(LEFT_MARGIN, PAGE_HEIGHT - TOP_MARGIN + 15, PAGE_WIDTH - RIGHT_MARGIN, PAGE_HEIGHT - TOP_MARGIN + 15)
        # Header text
        canvas.setFont("Helvetica", 7)
        canvas.setFillColor(GRAY_500)
        canvas.drawString(LEFT_MARGIN, PAGE_HEIGHT - TOP_MARGIN + 20, "FinSightAI — Analyst Report")
        canvas.drawRightString(PAGE_WIDTH - RIGHT_MARGIN, PAGE_HEIGHT - TOP_MARGIN + 20, datetime.now().strftime("%B %Y"))
        # Footer
        canvas.setFont("Helvetica", 7)
        canvas.setFillColor(GRAY_500)
        canvas.drawString(LEFT_MARGIN, BOTTOM_MARGIN - 10, "Confidential — For Internal Use Only")
        canvas.drawRightString(PAGE_WIDTH - RIGHT_MARGIN, BOTTOM_MARGIN - 10, f"Page {doc.page}")
        # Bottom accent line
        canvas.setStrokeColor(GRAY_300)
        canvas.setLineWidth(0.5)
        canvas.line(LEFT_MARGIN, BOTTOM_MARGIN + 5, PAGE_WIDTH - RIGHT_MARGIN, BOTTOM_MARGIN + 5)
        canvas.restoreState()