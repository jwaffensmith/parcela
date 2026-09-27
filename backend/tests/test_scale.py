"""The pipeline against a feed far larger than the sample, built in memory.

The sample file is small enough that pagination and deduplication could pass by
coincidence. These build a synthetic feed instead, so the invariants are exercised
at a size the shipped data cannot reach.
"""

from dedupe import deduplicate
from models import Listing, ListingStatus
from scoring import score_listings
from search import filter_listings, paginate

PROPERTIES = 2_000
FEEDS_PER_PROPERTY = 2


def build_feed(properties: int = PROPERTIES) -> list[Listing]:
    """Every property listed twice, by two feeds, at slightly different prices."""
    return [
        Listing.model_validate(
            {
                "id": f"{feed}{index}",
                "source": f"MLS_{feed}",
                "address": f"{index} Example {'St' if feed == 'A' else 'Street'}",
                "city": f"City{index % 40}",
                "state": "VA",
                "zip": f"{20000 + index % 900:05d}",
                "price": 300_000 + index * 100 + (500 if feed == "B" else 0),
                "bedrooms": 2 + index % 4,
                "bathrooms": 1.0 + (index % 3) / 2,
                "sqft": 800 + index % 2_000,
                "latitude": round(38.0 + index / 10_000, 4),
                "longitude": round(-77.0 - index / 10_000, 4),
                "listedDate": f"2026-{1 + index % 9:02d}-{1 + index % 28:02d}",
                "status": ListingStatus.ACTIVE.value,
                "description": f"Property number {index}.",
            }
        )
        for index in range(properties)
        for feed in ("A", "B")[:FEEDS_PER_PROPERTY]
    ]


def test_every_duplicated_property_collapses_to_one_result() -> None:
    assert len(deduplicate(build_feed())) == PROPERTIES


def test_the_cheaper_feed_wins_throughout() -> None:
    merged = deduplicate(build_feed())

    assert all(entry.source == "MLS_A" for entry in merged)


def test_each_merged_property_absorbs_the_other_feed() -> None:
    merged = deduplicate(build_feed())

    assert all(len(entry.duplicates) == FEEDS_PER_PROPERTY - 1 for entry in merged)


def test_scores_stay_within_range_at_scale() -> None:
    scored = score_listings(deduplicate(build_feed()), target_budget=450_000)

    assert all(0.0 <= entry.relevance_score <= 1.0 for entry in scored)


def test_scores_stay_ordered_at_scale() -> None:
    scores = [
        entry.relevance_score
        for entry in score_listings(deduplicate(build_feed()), target_budget=450_000)
    ]

    assert scores == sorted(scores, reverse=True)


def test_pages_tile_the_whole_result_set_without_gaps_or_repeats() -> None:
    merged = deduplicate(build_feed())
    page_size = 37

    seen = [
        entry.id
        for page in range(1, len(merged) // page_size + 2)
        for entry in paginate(merged, page=page, page_size=page_size)
    ]

    assert seen == [entry.id for entry in merged]


def test_filtering_narrows_a_large_feed_correctly() -> None:
    matches = filter_listings(build_feed(), min_bedrooms=5)

    assert matches and all(entry.bedrooms >= 5 for entry in matches)


def test_a_filter_nothing_satisfies_returns_nothing_at_scale() -> None:
    assert filter_listings(build_feed(), min_bedrooms=99) == []


def test_a_city_filter_selects_only_that_city_at_scale() -> None:
    matches = filter_listings(build_feed(), city="City7")

    assert {entry.city for entry in matches} == {"City7"}
