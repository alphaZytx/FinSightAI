"""Print curl commands for uploading demo PDFs from sample_data/documents."""

from __future__ import annotations

import argparse
from pathlib import Path


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("workspace_id")
    parser.add_argument("--company", default="Demo Company")
    parser.add_argument("--fiscal-year", default="2025")
    parser.add_argument("--api", default="http://localhost:8000/api/v1")
    parser.add_argument("--documents-dir", default="sample_data/documents")
    args = parser.parse_args()

    docs = sorted(Path(args.documents_dir).glob("*.pdf"))
    if not docs:
        print(f"No PDFs found in {args.documents_dir}. Place demo PDFs there first.")
        return

    for pdf in docs:
        print(
            "curl.exe -X POST "
            f"{args.api}/documents/upload "
            f"-F workspace_id={args.workspace_id} "
            f"-F company_name=\"{args.company}\" "
            f"-F fiscal_year={args.fiscal_year} "
            "-F document_type=annual_report "
            "-F auto_ingest=true "
            f"-F file=@\"{pdf}\""
        )


if __name__ == "__main__":
    main()