import json
from math import ceil
from pathlib import Path
from typing import Optional, Sequence, TypeVar

from dedupe import deduplicate
from models import Listing, ListingStatus, SearchResponse
from scoring import score_listings
from validation import validate_params

DATA_PATH = Path(__file__).resolve().parent / "data" / "sample_listings.json"

DEFAULT_PAGE = 1
DEFAULT_PAGE_SIZE = 10

ListingT = TypeVar("ListingT", bound=Listing)


def load_listings() -> tuple[Listing, ...]:
    """Read and validate the MLS feed on every search."""
    with DATA_PATH.open(encoding="utf-8") as feed:
        return tuple(Listing.model_validate(row) for row in json.load(feed))


def filter_listings(
    listings: Sequence[ListingT],
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    min_bedrooms: Optional[int] = None,
    city: Optional[str] = None,
    keyword: Optional[str] = None,
    status: Optional[ListingStatus] = None,
) -> list[ListingT]:
    return [
        listing
        for listing in listings
        if _matches(
            listing,
            min_price=min_price,
            max_price=max_price,
            min_bedrooms=min_bedrooms,
            city=city,
            keyword=keyword,
            status=status,
        )
    ]


def paginate(
    listings: Sequence[ListingT],
    page: int = DEFAULT_PAGE,
    page_size: int = DEFAULT_PAGE_SIZE,
) -> list[ListingT]:
    start = (page - 1) * page_size
    return list(listings[start : start + page_size])


def search(
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    min_bedrooms: Optional[int] = None,
    city: Optional[str] = None,
    keyword: Optional[str] = None,
    target_budget: Optional[float] = None,
    status: Optional[ListingStatus] = None,
    page: int = DEFAULT_PAGE,
    page_size: int = DEFAULT_PAGE_SIZE,
) -> SearchResponse:
    """Validate, filter, deduplicate, score and paginate — in that order."""
    validate_params(
        min_price=min_price,
        max_price=max_price,
        min_bedrooms=min_bedrooms,
        target_budget=target_budget,
        page=page,
        page_size=page_size,
    )

    matches = filter_listings(
        load_listings(),
        min_price=min_price,
        max_price=max_price,
        min_bedrooms=min_bedrooms,
        city=(city or "").strip() or None,
        keyword=(keyword or "").strip() or None,
        status=status,
    )
    ranked = score_listings(deduplicate(matches), target_budget)

    return SearchResponse(
        total=len(ranked),
        page=page,
        page_size=page_size,
        total_pages=max(1, ceil(len(ranked) / page_size)),
        results=paginate(ranked, page, page_size),
    )


def _matches(
    listing: Listing,
    min_price: Optional[float],
    max_price: Optional[float],
    min_bedrooms: Optional[int],
    city: Optional[str],
    keyword: Optional[str],
    status: Optional[ListingStatus],
) -> bool:
    status_matches = (
        listing.status == status
        if status is not None
        else listing.status != ListingStatus.SOLD
    )

    return all(
        (
            min_price is None or listing.price >= min_price,
            max_price is None or listing.price <= max_price,
            min_bedrooms is None or listing.bedrooms >= min_bedrooms,
            city is None or listing.city.casefold() == city.casefold(),
            keyword is None or keyword.casefold() in listing.description.casefold(),
            status_matches,
        )
    )
