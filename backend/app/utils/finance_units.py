UNIT_MULTIPLIERS = {
    "thousand": 1_000,
    "million": 1_000_000,
    "billion": 1_000_000_000,
    "crore": 10_000_000,
}


def normalize_unit(value: float, unit: str) -> float:
    return value * UNIT_MULTIPLIERS.get(unit.lower(), 1)
