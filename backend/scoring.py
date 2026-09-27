from datetime import date
from typing import Optional, Sequence

from models import Listing, ScoredListing

BUDGET_WEIGHT = 0.6
RECENCY_WEIGHT = 0.4
NEUTRAL_BUDGET_SCORE = 0.5
OVER_BUDGET_TOLERANCE = 0.10
SCORE_PRECISION = 4


def budget_score(price: float, target_budget: Optional[float] = None) -> float:
    """How well a price fits the buyer's budget, in [0, 1]."""
    if target_budget is None:
        return NEUTRAL_BUDGET_SCORE

    if price <= target_budget:
        return 1.0 - (target_budget - price) / target_budget

    over_pct = (price - target_budget) / target_budget
    if over_pct > OVER_BUDGET_TOLERANCE:
        return 0.0
    return 1.0 - over_pct / OVER_BUDGET_TOLERANCE


def recency_scores(listed_dates: Sequence[date]) -> list[float]:
    """Rank dates against each other: newest 1.0, oldest 0.0."""
    if not listed_dates:
        return []

    ordinals = [listed.toordinal() for listed in listed_dates]
    oldest, newest = min(ordinals), max(ordinals)
    span = newest - oldest

    if span == 0:
        return [1.0] * len(ordinals)
    return [(ordinal - oldest) / span for ordinal in ordinals]


def score_listings(
    listings: Sequence[Listing],
    target_budget: Optional[float] = None,
) -> list[ScoredListing]:
    """Score copies of the listings against budget and recency, best match first."""
    recency = recency_scores([listing.listed_date for listing in listings])

    scored = [
        ScoredListing(
            **listing.model_dump(),
            relevance_score=round(
                BUDGET_WEIGHT * budget_score(listing.price, target_budget)
                + RECENCY_WEIGHT * recency_value,
                SCORE_PRECISION,
            ),
        )
        for listing, recency_value in zip(listings, recency)
    ]

    return sorted(scored, key=lambda listing: listing.relevance_score, reverse=True)
