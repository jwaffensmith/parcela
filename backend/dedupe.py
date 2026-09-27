import re
from collections import defaultdict
from typing import Optional, Sequence

from models import DuplicateRef, Listing, MergedListing

PropertyKey = tuple[float, float, int, float, int, Optional[str]]

COORDINATE_PRECISION = 5

UNIT_PATTERN = re.compile(r"(?:\b(?:apt|unit|suite|ste)\b\.?|#)\s*([a-z0-9-]+)", re.IGNORECASE)


def unit_token(address: str) -> Optional[str]:
    """The unit designator of an address, if it has one.

    Full addresses are too inconsistent across feeds to match on, but the unit
    survives the rewording: "Apt 4B", "Unit 4B" and "#4B" are all the token "4b".
    Parsing stops there on purpose — anything smarter than one regex starts
    guessing at free text.
    """
    match = UNIT_PATTERN.search(address)
    return match[1].casefold() if match else None


def property_key(listing: Listing) -> PropertyKey:
    """What makes two rows the same home.

    Addresses are unreliable across feeds — "55 Elm Ct" and "55 Elm Court" are one
    property, and zip codes disagree. Coordinates are consistent, but on their own they
    would merge separate units in one building, so the shape of the home and the unit
    token are part of the key. Two identical floor plans in one building stay separate
    by unit alone, and a listing with a unit never merges with one lacking it —
    an occasional duplicate is a smaller error than collapsing two different homes.
    """
    return (
        round(listing.latitude, COORDINATE_PRECISION),
        round(listing.longitude, COORDINATE_PRECISION),
        listing.bedrooms,
        listing.bathrooms,
        listing.sqft,
        unit_token(listing.address),
    )


def deduplicate(listings: Sequence[Listing]) -> list[MergedListing]:
    """Collapse each property to one result, keeping feed order."""
    groups: dict[PropertyKey, list[Listing]] = defaultdict(list)
    for listing in listings:
        groups[property_key(listing)].append(listing)

    return [_merge(group) for group in groups.values()]


def _merge(group: Sequence[Listing]) -> MergedListing:
    """Keep the cheapest listing of a property, then the most recently listed."""
    canonical, *duplicates = sorted(
        group, key=lambda listing: (listing.price, -listing.listed_date.toordinal())
    )

    return MergedListing(
        **canonical.model_dump(),
        duplicates=[
            DuplicateRef(source=other.source, id=other.id, price=other.price)
            for other in duplicates
        ],
    )
