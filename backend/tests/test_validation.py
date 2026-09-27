from math import inf, nan

import pytest

from validation import SearchError, validate_params


def test_default_params_are_accepted() -> None:
    validate_params()


def test_full_valid_param_set_is_accepted() -> None:
    validate_params(
        min_price=100_000,
        max_price=900_000,
        min_bedrooms=0,
        target_budget=500_000,
        page=3,
        page_size=25,
    )


def test_equal_min_and_max_price_is_allowed() -> None:
    validate_params(min_price=450_000, max_price=450_000)


def test_page_below_one_is_rejected() -> None:
    with pytest.raises(SearchError, match="page must be >= 1"):
        validate_params(page=0)


def test_page_size_below_one_is_rejected() -> None:
    with pytest.raises(SearchError, match="pageSize must be >= 1"):
        validate_params(page_size=0)


def test_page_size_above_the_cap_is_rejected() -> None:
    with pytest.raises(SearchError, match="pageSize must be <= 100"):
        validate_params(page_size=101)


def test_page_size_at_the_cap_is_accepted() -> None:
    validate_params(page_size=100)


def test_negative_min_price_is_rejected() -> None:
    with pytest.raises(SearchError, match="minPrice must be >= 0"):
        validate_params(min_price=-1)


def test_negative_max_price_is_rejected() -> None:
    with pytest.raises(SearchError, match="maxPrice must be >= 0"):
        validate_params(max_price=-1)


def test_min_price_above_max_price_is_rejected() -> None:
    with pytest.raises(SearchError, match="minPrice must not exceed maxPrice"):
        validate_params(min_price=900_000, max_price=100_000)


def test_negative_min_bedrooms_is_rejected() -> None:
    with pytest.raises(SearchError, match="minBedrooms must be >= 0"):
        validate_params(min_bedrooms=-1)


def test_zero_target_budget_is_rejected() -> None:
    with pytest.raises(SearchError, match="targetBudget must be > 0"):
        validate_params(target_budget=0)


def test_negative_target_budget_is_rejected() -> None:
    with pytest.raises(SearchError, match="targetBudget must be > 0"):
        validate_params(target_budget=-500)


def test_nan_min_price_is_rejected() -> None:
    with pytest.raises(SearchError, match="minPrice must be a finite number"):
        validate_params(min_price=nan)


def test_nan_max_price_is_rejected() -> None:
    with pytest.raises(SearchError, match="maxPrice must be a finite number"):
        validate_params(max_price=nan)


def test_nan_target_budget_is_rejected() -> None:
    with pytest.raises(SearchError, match="targetBudget must be a finite number"):
        validate_params(target_budget=nan)


def test_infinite_min_price_is_rejected() -> None:
    with pytest.raises(SearchError, match="minPrice must be a finite number"):
        validate_params(min_price=inf)


def test_a_non_finite_value_is_reported_once_not_per_comparison() -> None:
    with pytest.raises(SearchError, match="^minPrice must be a finite number$"):
        validate_params(min_price=-inf, max_price=100_000)


def test_every_failure_is_reported_at_once() -> None:
    with pytest.raises(SearchError, match="page must be >= 1; pageSize must be >= 1"):
        validate_params(page=0, page_size=0)
