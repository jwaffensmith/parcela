from math import isfinite
from typing import Optional

MAX_PAGE_SIZE = 100


class SearchError(Exception):
    """Invalid search parameters supplied by the caller."""


def _is_non_finite(value: Optional[float]) -> bool:
    return value is not None and not isfinite(value)


def _is_finite(value: Optional[float]) -> bool:
    return value is not None and isfinite(value)


def validate_params(
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    min_bedrooms: Optional[int] = None,
    target_budget: Optional[float] = None,
    page: int = 1,
    page_size: int = 10,
) -> None:
    failures = (
        (page < 1, "page must be >= 1"),
        (page_size < 1, "pageSize must be >= 1"),
        (page_size > MAX_PAGE_SIZE, f"pageSize must be <= {MAX_PAGE_SIZE}"),
        (_is_non_finite(min_price), "minPrice must be a finite number"),
        (_is_non_finite(max_price), "maxPrice must be a finite number"),
        (_is_non_finite(target_budget), "targetBudget must be a finite number"),
        (_is_finite(min_price) and min_price < 0, "minPrice must be >= 0"),
        (_is_finite(max_price) and max_price < 0, "maxPrice must be >= 0"),
        (
            _is_finite(min_price) and _is_finite(max_price) and min_price > max_price,
            "minPrice must not exceed maxPrice",
        ),
        (min_bedrooms is not None and min_bedrooms < 0, "minBedrooms must be >= 0"),
        (_is_finite(target_budget) and target_budget <= 0, "targetBudget must be > 0"),
    )

    messages = [message for failed, message in failures if failed]
    if messages:
        raise SearchError("; ".join(messages))
