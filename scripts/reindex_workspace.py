"""Re-run ingestion for one or more document IDs through the local FinSightAI API."""

from __future__ import annotations

import argparse
import json
from urllib import request


def post(url: str) -> dict:
    req = request.Request(url, data=b"", method="POST")
    with request.urlopen(req, timeout=120) as response:
        return json.loads(response.read().decode("utf-8"))


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("document_ids", nargs="+")
    parser.add_argument("--api", default="http://localhost:8000/api/v1")
    args = parser.parse_args()
    for document_id in args.document_ids:
        result = post(f"{args.api}/documents/{document_id}/ingest")
        print(json.dumps({document_id: result}, indent=2))


if __name__ == "__main__":
    main()