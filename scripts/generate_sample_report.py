"""Generate a PDF report through the local FinSightAI API."""

from __future__ import annotations

import argparse
import json
from urllib import request


def post_json(url: str, payload: dict) -> dict:
    data = json.dumps(payload).encode("utf-8")
    req = request.Request(url, data=data, headers={"Content-Type": "application/json"}, method="POST")
    with request.urlopen(req, timeout=60) as response:
        return json.loads(response.read().decode("utf-8"))


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("workspace_id")
    parser.add_argument("--title", default="FinSightAI Analyst Report")
    parser.add_argument("--api", default="http://localhost:8000/api/v1")
    args = parser.parse_args()
    result = post_json(f"{args.api}/reports/generate", {"workspace_id": args.workspace_id, "title": args.title})
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()