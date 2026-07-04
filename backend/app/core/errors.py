class FinSightError(Exception):
    """Base application error."""


class UnsupportedEvidenceError(FinSightError):
    """Raised when an answer has insufficient source evidence."""
