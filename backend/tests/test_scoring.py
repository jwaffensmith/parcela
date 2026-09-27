from datetime import date

from factories import listing
from models import ScoredListing
from scoring import budget_score, recency_scores, score_listings


def test_missing_budget_scores_neutral() -> None:
    assert budget_score(450_000) == 0.5


def test_price_matching_budget_scores_one() -> None:
    assert budget_score(500_000, 500_000) == 1.0


def test_under_budget_is_penalized_in_proportion_to_the_gap() -> None:
    assert budget_score(400_000, 500_000) == 0.8


def test_a_free_listing_scores_zero_against_any_budget() -> None:
    assert budget_score(0, 500_000) == 0.0


def test_slightly_over_budget_decays_across_the_tolerance_band() -> None:
    assert budget_score(525_000, 500_000) == 0.5


def test_exactly_ten_percent_over_budget_scores_zero() -> None:
    assert budget_score(550_000, 500_000) == 0.0


def test_well_over_budget_scores_zero() -> None:
    assert budget_score(575_000, 500_000) == 0.0


def test_no_dates_produce_no_recency_scores() -> None:
    assert recency_scores([]) == []


def test_a_lone_listing_is_treated_as_fully_recent() -> None:
    assert recency_scores([date(2026, 8, 1)]) == [1.0]


def test_listings_sharing_one_date_are_all_fully_recent() -> None:
    one_date = date(2026, 8, 1)

    assert recency_scores([one_date, one_date, one_date]) == [1.0, 1.0, 1.0]


def test_recency_spans_zero_to_one_across_the_set() -> None:
    scores = recency_scores([date(2026, 7, 28), date(2026, 8, 15), date(2026, 9, 4)])

    assert scores[0] == 0.0
    assert scores[-1] == 1.0


def test_recency_is_ordered_newest_first() -> None:
    oldest, middle, newest = recency_scores(
        [date(2026, 1, 1), date(2026, 6, 1), date(2026, 12, 1)]
    )

    assert oldest < middle < newest


def test_scored_listings_come_back_ranked_best_first() -> None:
    scored = score_listings(
        [
            listing(id="far", price=600_000, listed_date=date(2026, 1, 1)),
            listing(id="near", price=500_000, listed_date=date(2026, 12, 1)),
        ],
        target_budget=500_000,
    )

    assert [entry.id for entry in scored] == ["near", "far"]


def test_every_score_stays_within_zero_and_one() -> None:
    scored = score_listings(
        [
            listing(price=100_000, listed_date=date(2026, 1, 1)),
            listing(price=900_000, listed_date=date(2026, 12, 1)),
        ],
        target_budget=500_000,
    )

    assert all(0.0 <= entry.relevance_score <= 1.0 for entry in scored)


def test_identical_listings_receive_identical_scores() -> None:
    scored = score_listings(
        [
            listing(id="a", price=500_000, listed_date=date(2026, 5, 1)),
            listing(id="b", price=500_000, listed_date=date(2026, 5, 1)),
        ],
        target_budget=500_000,
    )

    assert scored[0].relevance_score == scored[1].relevance_score


def test_tied_scores_keep_feed_order() -> None:
    scored = score_listings(
        [
            listing(id="first", price=500_000, listed_date=date(2026, 5, 1)),
            listing(id="second", price=500_000, listed_date=date(2026, 5, 1)),
            listing(id="third", price=500_000, listed_date=date(2026, 5, 1)),
        ],
        target_budget=500_000,
    )

    assert [entry.id for entry in scored] == ["first", "second", "third"]


def test_scores_are_rounded_to_four_decimal_places() -> None:
    scored = score_listings([listing(price=333_333)], target_budget=500_000)

    assert scored[0].relevance_score == round(scored[0].relevance_score, 4)


def test_scoring_leaves_the_source_listings_untouched() -> None:
    original = listing(price=500_000)

    score_listings([original], target_budget=500_000)

    assert not isinstance(original, ScoredListing)


def test_scoring_an_empty_set_returns_nothing() -> None:
    assert score_listings([], target_budget=500_000) == []


def test_without_a_budget_recency_alone_orders_the_results() -> None:
    scored = score_listings(
        [
            listing(id="old", price=100_000, listed_date=date(2026, 1, 1)),
            listing(id="new", price=900_000, listed_date=date(2026, 12, 1)),
        ]
    )

    assert [entry.id for entry in scored] == ["new", "old"]
