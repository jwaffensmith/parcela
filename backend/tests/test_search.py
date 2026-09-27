from math import ceil

import pytest

from factories import listing
from models import ListingStatus
from dedupe import deduplicate
from sample_feed import AVAILABLE_PROPERTIES, DISTINCT_PROPERTIES, FEED_ROWS
from search import DEFAULT_PAGE_SIZE, filter_listings, load_listings, paginate, search
from validation import SearchError


def test_the_feed_loads_every_row_including_duplicates() -> None:
    assert len(load_listings()) == FEED_ROWS


def test_a_feed_price_with_cents_is_accepted() -> None:
    assert listing(price=199_990.99).price == 199_990.99


def test_no_filters_keeps_every_listing() -> None:
    listings = [listing(id="a"), listing(id="b")]

    assert filter_listings(listings) == listings


def test_city_matching_ignores_case() -> None:
    matches = filter_listings([listing(city="Springfield")], city="sPrInGfIeLd")

    assert len(matches) == 1


def test_an_unknown_city_matches_nothing() -> None:
    assert filter_listings([listing(city="Springfield")], city="Atlantis") == []


def test_city_matching_is_exact_not_partial() -> None:
    assert filter_listings([listing(city="Springfield")], city="Spring") == []


def test_min_price_excludes_cheaper_listings() -> None:
    listings = [listing(id="cheap", price=100_000), listing(id="rich", price=800_000)]

    assert [m.id for m in filter_listings(listings, min_price=500_000)] == ["rich"]


def test_max_price_excludes_pricier_listings() -> None:
    listings = [listing(id="cheap", price=100_000), listing(id="rich", price=800_000)]

    assert [m.id for m in filter_listings(listings, max_price=500_000)] == ["cheap"]


def test_price_bounds_are_inclusive() -> None:
    matches = filter_listings(
        [listing(price=450_000)], min_price=450_000, max_price=450_000
    )

    assert len(matches) == 1


def test_min_bedrooms_excludes_smaller_homes() -> None:
    listings = [listing(id="small", bedrooms=2), listing(id="large", bedrooms=4)]

    assert [m.id for m in filter_listings(listings, min_bedrooms=3)] == ["large"]


def test_keyword_matches_the_description_ignoring_case() -> None:
    matches = filter_listings([listing(description="Has a GARAGE")], keyword="garage")

    assert len(matches) == 1


def test_keyword_matches_part_of_a_word() -> None:
    matches = filter_listings([listing(description="Renovated kitchen")], keyword="reno")

    assert len(matches) == 1


def test_keyword_absent_from_the_description_matches_nothing() -> None:
    assert filter_listings([listing(description="No parking")], keyword="garage") == []


def test_sold_listings_are_hidden_by_default() -> None:
    listings = [
        listing(id="sold", status=ListingStatus.SOLD),
        listing(id="active", status=ListingStatus.ACTIVE),
    ]

    assert [m.id for m in filter_listings(listings)] == ["active"]


def test_sold_listings_appear_when_asked_for_explicitly() -> None:
    listings = [
        listing(id="sold", status=ListingStatus.SOLD),
        listing(id="active", status=ListingStatus.ACTIVE),
    ]

    matches = filter_listings(listings, status=ListingStatus.SOLD)

    assert [m.id for m in matches] == ["sold"]


def test_asking_for_one_status_excludes_the_others() -> None:
    listings = [
        listing(id="pending", status=ListingStatus.PENDING),
        listing(id="active", status=ListingStatus.ACTIVE),
    ]

    matches = filter_listings(listings, status=ListingStatus.PENDING)

    assert [m.id for m in matches] == ["pending"]


def test_filters_combine_as_a_single_narrowing_set() -> None:
    listings = [
        listing(id="match", city="Reston", price=400_000, bedrooms=3),
        listing(id="wrong_city", city="Vienna", price=400_000, bedrooms=3),
        listing(id="too_dear", city="Reston", price=900_000, bedrooms=3),
        listing(id="too_small", city="Reston", price=400_000, bedrooms=1),
    ]

    matches = filter_listings(
        listings, city="Reston", max_price=500_000, min_bedrooms=2
    )

    assert [m.id for m in matches] == ["match"]


def test_the_first_page_holds_the_leading_items() -> None:
    items = [listing(id=str(index)) for index in range(10)]

    assert [m.id for m in paginate(items, page=1, page_size=3)] == ["0", "1", "2"]


def test_the_last_page_holds_whatever_remains() -> None:
    items = [listing(id=str(index)) for index in range(10)]

    assert [m.id for m in paginate(items, page=4, page_size=3)] == ["9"]


def test_a_page_beyond_the_end_is_empty() -> None:
    items = [listing(id=str(index)) for index in range(10)]

    assert paginate(items, page=99, page_size=3) == []


def test_paginating_nothing_yields_nothing() -> None:
    assert paginate([], page=1, page_size=10) == []


def test_a_page_size_matching_the_total_returns_one_full_page() -> None:
    items = [listing(id=str(index)) for index in range(3)]

    assert len(paginate(items, page=1, page_size=3)) == 3


def test_search_returns_every_available_property_by_default() -> None:
    response = search()

    assert response.total == AVAILABLE_PROPERTIES
    assert response.total_pages == ceil(AVAILABLE_PROPERTIES / DEFAULT_PAGE_SIZE)
    assert len(response.results) == DEFAULT_PAGE_SIZE


def test_the_feed_holds_more_rows_than_it_does_properties() -> None:
    assert len(deduplicate(load_listings())) == DISTINCT_PROPERTIES
    assert len(load_listings()) == FEED_ROWS


def test_a_merged_result_names_the_other_listing_it_absorbed() -> None:
    merged = [entry for entry in search(page_size=100).results if entry.duplicates]

    assert all(
        (entry.source, entry.id) != (other.source, other.id)
        for entry in merged
        for other in entry.duplicates
    )


def test_the_same_property_never_appears_twice_in_the_results() -> None:
    results = search(page_size=100).results
    keys = [
        (entry.latitude, entry.longitude, entry.bedrooms, entry.bathrooms, entry.sqft)
        for entry in results
    ]

    assert len(keys) == len(set(keys))


def test_sold_properties_are_absent_from_a_default_search() -> None:
    assert all(entry.status != ListingStatus.SOLD for entry in search(page_size=100).results)


def test_sold_properties_are_returned_when_asked_for() -> None:
    response = search(status=ListingStatus.SOLD, page_size=100)

    assert response.total > 0
    assert all(entry.status == ListingStatus.SOLD for entry in response.results)


def test_excluding_sold_leaves_fewer_properties_than_the_feed_holds() -> None:
    assert search(page_size=100).total < len(deduplicate(load_listings()))


def test_search_reports_no_matches_rather_than_failing() -> None:
    response = search(city="Atlantis")

    assert response.total == 0
    assert response.results == []


def test_no_matches_still_reports_one_page_so_page_never_exceeds_total_pages() -> None:
    response = search(city="Atlantis")

    assert response.total_pages == 1
    assert response.page <= response.total_pages


def test_search_rejects_an_inverted_price_range() -> None:
    with pytest.raises(SearchError, match="minPrice must not exceed maxPrice"):
        search(min_price=900_000, max_price=100_000)


def test_search_echoes_the_requested_pagination() -> None:
    response = search(page=2, page_size=5)

    assert response.page == 2
    assert response.page_size == 5
    assert response.total_pages == ceil(AVAILABLE_PROPERTIES / 5)


def test_search_ranks_the_closest_listing_to_the_budget_first() -> None:
    response = search(city="Springfield", target_budget=450_000)

    assert response.results[0].price == 450_000


def test_search_orders_every_result_by_descending_score() -> None:
    scores = [entry.relevance_score for entry in search(page_size=100).results]

    assert scores == sorted(scores, reverse=True)


def test_search_scores_only_the_listings_that_survived_filtering() -> None:
    response = search(city="Springfield", page_size=100)

    assert all(entry.city == "Springfield" for entry in response.results)


def test_a_blank_city_is_treated_as_no_city_filter() -> None:
    assert search(city="   ").total == AVAILABLE_PROPERTIES


def test_every_result_carries_a_relevance_score_within_range() -> None:
    response = search(target_budget=450_000, page_size=100)

    assert all(0.0 <= entry.relevance_score <= 1.0 for entry in response.results)
