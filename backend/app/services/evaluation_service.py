class EvaluationService:
    def citation_coverage(self, outputs: list[dict]) -> float:
        if not outputs:
            return 0.0
        cited = sum(1 for item in outputs if item.get("source_chunk_id") or item.get("citations"))
        return cited / len(outputs)
