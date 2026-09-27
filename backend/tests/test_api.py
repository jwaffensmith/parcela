from math import ceil

from fastapi.testclient import TestClient

from main import app
from sample_feed import AVAILABLE_PROPERTIES
from search import DEFAULT_PAGE_SIZE

client = TestClient(app)


def test_the_api_root_is_not_a_dead_end() -> None:
    assert client.get("/").status_code == 200


def test_the_api_root_points_at_the_other_endpoints() -> None:
    body = client.get("/").json()

    assert [body["docs"], body["health"], body["search"]] == ["/docs", "/health", "/search"]


def test_health_reports_ok() -> None:
    response = client.get("/health")

    assert response.json() == {"status": "ok"}


def test_search_without_params_returns_every_distinct_property() -> None:
    body = client.get("/search").json()

    assert body["total"] == AVAILABLE_PROPERTIES
    assert body["page"] == 1
    assert body["pageSize"] == DEFAULT_PAGE_SIZE
    assert body["totalPages"] == ceil(AVAILABLE_PROPERTIES / DEFAULT_PAGE_SIZE)


def test_a_merged_result_exposes_its_duplicates() -> None:
    results = client.get("/search?pageSize=100").json()["results"]
    merged = [entry for entry in results if entry["duplicates"]]

    assert merged[0]["duplicates"][0]["source"].startswith("MLS_")


def test_a_property_listed_once_reports_an_empty_duplicates_list() -> None:
    results = client.get("/search?pageSize=100").json()["results"]

    assert any(entry["duplicates"] == [] for entry in results)


def test_results_use_camel_case_keys() -> None:
    first = client.get("/search").json()["results"][0]

    assert {"listedDate", "relevanceScore"} <= set(first)


def test_camel_case_query_params_are_accepted() -> None:
    body = client.get("/search?minBedrooms=4&pageSize=50").json()

    assert body["pageSize"] == 50
    assert all(entry["bedrooms"] >= 4 for entry in body["results"])


def test_an_inverted_price_range_is_a_bad_request() -> None:
    response = client.get("/search?minPrice=900000&maxPrice=100000")

    assert response.status_code == 400
    assert response.json() == {"detail": "minPrice must not exceed maxPrice"}


def test_a_non_positive_page_size_is_a_bad_request() -> None:
    response = client.get("/search?pageSize=0")

    assert response.status_code == 400
    assert response.json()["detail"] == "pageSize must be >= 1"


def test_a_non_numeric_price_is_a_bad_request_not_a_crash() -> None:
    response = client.get("/search?minPrice=abc")

    assert response.status_code == 400
    assert "minPrice" in response.json()["detail"]


def test_a_nan_target_budget_is_a_bad_request_not_a_crash() -> None:
    response = client.get("/search?targetBudget=nan")

    assert response.status_code == 400
    assert response.json()["detail"] == "targetBudget must be a finite number"


def test_a_nan_min_price_is_a_bad_request_not_a_silent_empty_result() -> None:
    response = client.get("/search?minPrice=nan")

    assert response.status_code == 400
    assert response.json()["detail"] == "minPrice must be a finite number"


def test_an_unknown_status_is_a_bad_request() -> None:
    response = client.get("/search?status=leased")

    assert response.status_code == 400


def test_a_city_with_no_matches_is_an_empty_success() -> None:
    response = client.get("/search?city=Atlantis")

    assert response.status_code == 200
    assert response.json()["results"] == []


def test_a_page_past_the_end_is_an_empty_success() -> None:
    response = client.get("/search?page=99")

    assert response.status_code == 200
    assert response.json()["results"] == []


def test_error_responses_never_leak_a_stack_trace() -> None:
    detail = client.get("/search?page=0").json()["detail"]

    assert "Traceback" not in detail


def test_the_dev_ui_origin_is_allowed() -> None:
    response = client.get("/search", headers={"Origin": "http://localhost:5173"})

    assert response.headers["access-control-allow-origin"] == "http://localhost:5173"


def test_an_unknown_origin_is_not_allowed() -> None:
    response = client.get("/search", headers={"Origin": "http://evil.example"})

    assert "access-control-allow-origin" not in response.headers
